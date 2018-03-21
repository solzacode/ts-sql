import { AstSymbol, SymbolTable } from "jsymbol";
import { SqlNodeType, SqlAstNode, SqlRoot } from "./astsql";
import { QueryContext, QueryVisitor } from "./queryVisitor";

export enum SymbolState {
    Resolved,
    Unresolved
}

export class SqlAstSymbol implements AstSymbol<SqlNodeType> {
    public state: SymbolState;
    public parent?: SqlAstSymbol;

    constructor(public identifier: string, public type: SqlNodeType) {
        this.state = SymbolState.Unresolved;
    }
}

export class ValidationContext implements QueryContext {
    parentNode?: SqlAstNode;
    symbolTable: SymbolTable<SqlAstSymbol>;

    constructor(public currentNode: SqlAstNode) {
        this.symbolTable = new SymbolTable<SqlAstSymbol>();
    }
}

export class MySQLQueryValidator extends QueryVisitor {
    constructor(query: SqlRoot) {
        super("MySQL", query, ValidationContext);
    }
}
