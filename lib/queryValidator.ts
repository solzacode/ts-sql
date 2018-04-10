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

    constructor(public currentNode: ast.SqlAstNode) {
        this.symbolTable = new SymbolTable<SqlAstSymbol>();
    }
}

export interface ValidationMethod<TNode extends ast.SqlAstNode = ast.SqlAstNode> {
    (context: ValidationContext, node: TNode): ValidationContext;
}

export class QueryValidator extends QueryVisitor<ValidationContext> {
    constructor(dialect: ast.SqlDialect, query: ast.SqlRoot, contextBuilder: ContextBuilder = ValidationContext) {
        super(dialect, query, contextBuilder);
    }

    protected visitSelectStatement: ValidationMethod<ast.SelectStatement> = (context, node) => {
        context.symbolTable.enterScope();
        this.visitGenericNode(context, node.query);
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
        let symbol = new SqlAstSymbol(node.tableName.toString(), ast.SqlSymbolType.Table);
        context.symbolTable.add(symbol);
        symbol.state = SymbolState.Resolved;

        node.tableName = symbol;

        if (node.partitions) {
            for (let p of node.partitions) {
                let partitionField = new SqlAstSymbol(p.toString(), ast.SqlSymbolType.Field);
                partitionField.parent = symbol;
                partitionField.state = SymbolState.Resolved;

                context.symbolTable.add(partitionField);
            }
        }

        return context;
    }

    protected visitAliasedTerm: ValidationMethod<ast.AliasedTerm<ast.SqlAstNode>> = (context, node) => {
        return context;
    }
}

export class MySQLQueryValidator extends QueryValidator {
    constructor(query: ast.SqlRoot) {
        super("MySQL", query, ValidationContext);
    }
}
