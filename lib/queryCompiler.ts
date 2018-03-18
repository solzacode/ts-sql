import * as ast from "./astsql";
import { QueryVisitor, QueryContext } from "./queryVisitor";

export class CompilationContext implements QueryContext {
    public parentNode?: ast.SqlAstNode;
    public queryString: string;

    constructor(public currentNode: ast.SqlAstNode) {
        this.parentNode = undefined;
        this.queryString = "";
    }
}

export interface VisitMethod<TNode extends ast.SqlAstNode = ast.SqlAstNode> {
    (context: CompilationContext, node: TNode): CompilationContext;
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
        let elementStrings: string[] = [];

        if (node.selectAll) {
            elementStrings.push("*");
        }

        query += elementStrings.concat(node.elements.map(v => this.visitNode(context, v).queryString)).join(", ");

        if (node.from) {
            query += "\n" + this.visitNode(context, node.from).queryString;
        }

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

    protected visitFromClause(context: CompilationContext, node: ast.FromClause) {
        let fromClause = node.tables.map(t => this.visitNode(context, t).queryString).join(", ");
        context.queryString = "FROM " + fromClause;

        if (node.where) {
            context.queryString += "\n" + this.visitNode(context, node.where).queryString;
        }

        return context;
    }

    protected visitTableSpec(context: CompilationContext, node: ast.TableSpec) {
        context.queryString = node.tableName.toString();
        return context;
    }

    protected visitAliasedTerm<TTerm extends ast.SqlAstNode = ast.SqlAstNode>(context: CompilationContext, node: ast.AliasedTerm<TTerm>) {
        let termQuery = this.visitNode(context, node.term).queryString;
        context.queryString = node.alias ?  "(" + termQuery + ") AS " + node.alias : termQuery;

        return context;
    }

    protected visitBinaryPredicate(context: CompilationContext, node: ast.BinaryPredicate): CompilationContext {
        context.queryString =
            "("
            + this.visitNode(context, node.left).queryString
            + " "
            + node.operator.toString()
            + " "
            + this.visitNode(context, node.right).queryString
            + ")";

        return context;
    }

    protected visitColumnName: VisitMethod<ast.ColumnName> = (context, node) => {
        context.queryString = node.table ? node.table.toString() + "." + node.name.toString() : node.name.toString();
        return context;
    }

    protected visitWhereClause: VisitMethod<ast.WhereClause> = (context, node) => {
        context.queryString = "WHERE " + this.visitNode(context, node.expression).queryString;
        return context;
    }

    protected visitBinaryExpression: VisitMethod<ast.BinaryExpression<ast.BinaryOperator>> = (context, node) => {
        context.queryString =
            "("
            + this.visitNode(context, node.left).queryString
            + " "
            + node.operator.toString()
            + " "
            + this.visitNode(context, node.right).queryString
            + ")";

        return context;
    }
}

export class MySQLQueryCompiler extends QueryCompiler {
    constructor(query: ast.SqlRoot) {
        super("MySQL", query);

        // Customize any other instance properties here, e.g. this.delimiter = "GO"; // For SQL Server (T-SQL)
    }
}
