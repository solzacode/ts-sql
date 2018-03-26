import { AstSymbol, SymbolTable } from "jsymbol";
import * as ast from "./astsql";
import { QueryContext, QueryVisitor, ContextBuilder } from "./queryVisitor";

export enum SymbolState {
    Resolved,
    Unresolved
}

export class SqlAstSymbol implements AstSymbol<ast.SqlNodeType> {
    public state: SymbolState;
    public parent?: SqlAstSymbol;

    constructor(public identifier: string, public type: ast.SqlNodeType) {
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

export class QueryValidator extends QueryVisitor {
    constructor(dialect: ast.SqlDialect, query: ast.SqlRoot, contextBuilder: ContextBuilder = ValidationContext) {
        super(dialect, query, contextBuilder);
    }
}

export class MySQLQueryValidator extends QueryValidator {
    constructor(query: ast.SqlRoot) {
        super("MySQL", query, ValidationContext);
    }
}
