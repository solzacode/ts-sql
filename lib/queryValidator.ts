import { AstSymbol, SymbolTable } from "jsymbol";
import * as ast from "./astsql";
import { QueryContext, QueryVisitor, ContextBuilder } from "./queryVisitor";

export enum SymbolState {
    Resolved,
    Unresolved
}

export class SqlAstSymbol implements AstSymbol<ast.SqlSymbolType> {
    public state: SymbolState;
    public parent?: SqlAstSymbol;

    constructor(public identifier: string, public type: ast.SqlSymbolType) {
        this.state = SymbolState.Unresolved;
    }
}

export class ValidationContext implements QueryContext {
    parentNode?: ast.SqlAstNode;
    symbolTable: SymbolTable<SqlAstSymbol>;
    collectedSymbols: SqlAstSymbol[];

    constructor(public currentNode: ast.SqlAstNode) {
        this.symbolTable = new SymbolTable<SqlAstSymbol>();
        this.collectedSymbols = [];
    }
}

export interface ValidationMethod<TNode extends ast.SqlAstNode = ast.SqlAstNode> {
    (context: ValidationContext, node: TNode): ValidationContext;
}

export class QueryValidator extends QueryVisitor<ValidationContext> {
    constructor(dialect: ast.SqlDialect, query: ast.SqlRoot, contextBuilder: ContextBuilder = ValidationContext) {
        super(dialect, query, contextBuilder);
    }

    public validate(): SqlAstSymbol[] {
        let context = this.visit();

        for (let sym of context.symbolTable) {
            context.collectedSymbols.push(sym);
        }

        return context.collectedSymbols;
    }

    protected visitSelectStatement: ValidationMethod<ast.SelectStatement> = (context, node) => {
        context.symbolTable.enterScope();
        this.visitGenericNode(context, node.query);

        for (let sym of context.symbolTable) {
            context.collectedSymbols.push(sym);
        }

        context.symbolTable.exitScope();
        return context;
    }

    protected visitQueryExpression: ValidationMethod<ast.QueryExpression> = (context, node) => {
        if (node.from) {
            this.visitNode(context, node.from);
        }

        if (node.elements && node.elements.length) {
            for (let se of node.elements) {
                this.visitNode(context, se);
            }
        }

        if (node.orderBy) {
            this.visitNode(context, node.orderBy);
        }

        if (node.limit) {
            this.visitNode(context, node.limit);
        }

        return context;
    }

    protected visitTableSpec: ValidationMethod<ast.TableSpec> = (context, node) => {
        node.tableName = this.addResolvedSymbol(context, node.tableName.toString(), ast.SqlSymbolType.Table);

        if (node.partitions && node.partitions.length) {
            for (let index = 0; index < node.partitions.length; index++) {
                let symbol = this.addResolvedSymbol(context, node.partitions[index].toString(), ast.SqlSymbolType.Field);
                symbol.parent = (<SqlAstSymbol> node.tableName);
                node.partitions[index] = symbol;
            }
        }

        return context;
    }

    protected visitAllColumns: ValidationMethod<ast.AllColumns> = (context, node) => {
        node.table = this.lookupOrAddTable(context, node.table.toString());
        return context;
    }

    protected visitColumnName: ValidationMethod<ast.ColumnName> = (context, node) => {
        let parent = node.table ? this.lookupOrAddTable(context, node.table.toString()) : undefined;
        node.table = parent;

        let fieldSymbol = this.lookupOrAddSymbol(context, node.name.toString(), ast.SqlSymbolType.Field);
        fieldSymbol.parent = parent;
        fieldSymbol.state = parent ? parent.state : SymbolState.Unresolved;

        node.name = fieldSymbol;
        return context;
    }

    protected visitSimpleFunctionCall: ValidationMethod<ast.SimpleFunctionCall> = (context, node) => {
        node.name = this.addResolvedSymbol(context, node.name.toString(), ast.SqlSymbolType.Function);

        if (node.args) {
            for (let fe of node.args) {
                if (this.shouldVisitNode(fe)) {
                    context = this.visitNode(context, fe);
                }
            }
        }

        return context;
    }

    protected visitAssignedTerm: ValidationMethod<ast.AssignedTerm<ast.SqlAstNode>> = (context, node) => {
        context = this.visitNode(context, node.value);

        if (node.variable) {
            node.variable = this.addResolvedSymbol(context, node.variable.toString(), ast.SqlSymbolType.Variable);
        }

        return context;
    }

    protected visitAssignedExpressionAtom: ValidationMethod<ast.AssignedExpressionAtom> = (context, node) => {
        context = this.visitNode(context, node.expression);

        if (node.variable) {
            node.variable = this.addResolvedSymbol(context, node.variable.toString(), ast.SqlSymbolType.Variable);
        }

        return context;
    }

    protected visitVariable: ValidationMethod<ast.Variable> = (context, node) => {
        node.name = this.addResolvedSymbol(context, node.name.toString(), ast.SqlSymbolType.Variable);
        return context;
    }

    protected visitSelectIntoFieldsExpression: ValidationMethod<ast.SelectIntoFieldsExpression> = (context, node) => {
        for (let index = 0; index < node.fields.length; index++) {
            node.fields[index] = this.addResolvedSymbol(context, node.fields[index].toString(), ast.SqlSymbolType.Variable);
        }

        return context;
    }

    protected visitAliasedTerm: ValidationMethod<ast.AliasedTerm<ast.SqlAstNode>> = (context, node) => {
        if (!node.alias) {
            return this.visitGenericNode(context, node);
        }

        context = this.visitNode(context, node.term);

        let aliasSymbol = this.addResolvedSymbol(context, node.alias.toString(), ast.SqlSymbolType.Alias);
        let nodeType = ast.SqlAstNode.getNodeType(node.term);

        switch (nodeType) {
            case "ColumnName":
                aliasSymbol.parent = (<SqlAstSymbol> ((<ast.ColumnName> node.term).name));
                break;

            case "TableSpec":
                aliasSymbol.parent = (<SqlAstSymbol> ((<ast.TableSpec> node.term).tableName));
                break;

            default:
                break;
        }

        if (aliasSymbol.parent) {
            aliasSymbol.state = aliasSymbol.parent.state;
        }

        node.alias = aliasSymbol;
        return context;
    }

    protected addResolvedSymbol(context: ValidationContext, name: string, type: ast.SqlSymbolType) {
        let symbol = new SqlAstSymbol(name, type);
        symbol.state = SymbolState.Resolved;
        context.symbolTable.add(symbol);

        return symbol;
    }

    protected lookupOrAddTable(context: ValidationContext, name: string) {
        let symbols = context.symbolTable.lookup(name);
        if (symbols) {
            for (let index = 0; index < symbols.length; index++) {
                if (symbols[index].type === ast.SqlSymbolType.Alias
                    || symbols[index].type === ast.SqlSymbolType.Table) {
                    return symbols[index];
                }
            }
        }

        let symbol = new SqlAstSymbol(name, ast.SqlSymbolType.Table);
        symbol.state = SymbolState.Unresolved;
        context.symbolTable.add(symbol);

        return symbol;
    }

    protected lookupOrAddSymbol(context: ValidationContext, name: string, type: ast.SqlSymbolType) {
        let symbols = context.symbolTable.lookup(name, type);
        if (symbols) {
            if (symbols.length > 1) {
                throw Error("Found more than one symbol of the same type in the current scope");
            }

            return symbols[0];
        }

        let symbol = new SqlAstSymbol(name, type);
        symbol.state = SymbolState.Unresolved;
        context.symbolTable.add(symbol);
        return symbol;
    }
}

export class MySQLQueryValidator extends QueryValidator {
    constructor(query: ast.SqlRoot) {
        super("MySQL", query, ValidationContext);
    }
}
