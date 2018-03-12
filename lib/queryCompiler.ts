import * as ast from "./astsql";
import { QueryVisitor, QueryContext } from "queryVisitor";

export class CompilationContext implements QueryContext {
    public parentNode?: ast.SqlAstNode;
    public queryString: string;

    constructor(public currentNode: ast.SqlAstNode) {
        this.parentNode = undefined;
        this.queryString = "";
    }
}

export class QueryCompiler extends QueryVisitor<CompilationContext> {
    delimiter: string;

    constructor(public dialect: ast.SqlDialect, query: ast.SqlRoot) {
        super(dialect, query, CompilationContext);

        this.delimiter = ";";
    }

    compile(): string {
        let context = this.visit();
        return context.queryString;
    }

    protected visitQueryExpression(context: CompilationContext, node: ast.QueryExpression) {
        let query: string = "SELECT ";
        query += node.elements.map(v => this.visitNode(context, v).queryString).join(", ");

        context.queryString = query;
        return context;
    }

    protected visitConstant(context: CompilationContext, node: ast.Constant) {
        if (node.value !== "NULL" && node.value !== "NOT NULL" && typeof node.value === "string") {
            context.queryString = "'" + node.value + "'";
        } else {
            context.queryString = node.value.toString();
        }

        return context;
    }
}

export class MySQLQueryCompiler extends QueryCompiler {
    constructor(query: ast.SqlRoot) {
        super("MySQL", query);

        // Customize any other instance properties here, e.g. this.delimiter = "GO"; // For SQL Server (T-SQL)
    }
}
