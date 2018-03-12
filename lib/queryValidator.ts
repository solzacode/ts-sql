import { AstSymbol, SymbolTable } from "jsymbol";
import { SqlNodeType, SqlAstNode, SqlRoot } from "astsql";
import { QueryContext, QueryVisitor } from "queryVisitor";

export enum SymbolState {
    Resolved,
    Unresolved
}

export class SqlAstSymbol implements AstSymbol<SqlNodeType> {
    public state: SymbolState;

    constructor(public identifier: string, public type: SqlNodeType) {
        this.state = SymbolState.Unresolved;
    }
}

export class ValidationContext implements QueryContext {
    currentNode: SqlAstNode;
    parentNode?: SqlAstNode;
    symbolTable: SymbolTable<SqlAstSymbol>;

    constructor(node: SqlAstNode) {
        this.currentNode = node;
        this.symbolTable = new SymbolTable<SqlAstSymbol>();
    }
}

export class MySQLQueryValidator extends QueryVisitor {
    constructor(query: SqlRoot) {
        super("MySQL", query, ValidationContext);
    }
}
