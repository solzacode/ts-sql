import * as ast from "./astsql";
import { QueryVisitor, QueryContext, ContextBuilder } from "./queryVisitor";

export class CompilationContext implements QueryContext {
    public parentNode?: ast.SqlAstNode;
    public queryString: string;

    constructor(public currentNode: ast.SqlAstNode) {
        this.parentNode = undefined;
        this.queryString = "";
    }
}

export interface CompileMethod<TNode extends ast.SqlAstNode = ast.SqlAstNode> {
    (context: CompilationContext, node: TNode): CompilationContext;
}

export abstract class QueryCompiler extends QueryVisitor<CompilationContext> {
    delimiter: string;

    constructor(public dialect: ast.SqlDialect, query: ast.SqlRoot, contextBuilder: ContextBuilder = CompilationContext) {
        super(dialect, query, contextBuilder);

        this.delimiter = ";";
    }

    compile(): string {
        let context = this.visit();
        return context.queryString;
    }

    protected visitSqlRoot: CompileMethod<ast.SqlRoot> = (context, node) => {
        context.queryString = node.statements.map(s => this.visitNode(context, s).queryString).join(this.delimiter + "\n");
        return context;
    }

    protected visitQueryExpression: CompileMethod<ast.QueryExpression> = (context, node) => {
        let query: string = "SELECT ";
        let elementStrings: string[] = [];

        if (node.selectAll) {
            elementStrings.push("*");
        }

        query += elementStrings.concat(node.elements.map(v => this.visitNode(context, v).queryString)).join(", ");

        if (node.from) {
            query += "\n" + this.visitNode(context, node.from).queryString;
        }

        if (node.orderBy) {
            query += "\n" + this.visitNode(context, node.orderBy).queryString;
        }

        if (node.limit) {
            query += "\n" + this.visitNode(context, node.limit).queryString;
        }

        context.queryString = query;
        return context;
    }

    protected visitConstant: CompileMethod<ast.Constant> = (context, node) => {
        if (node.value !== "NULL" && node.value !== "NOT NULL" && typeof node.value === "string") {
            context.queryString = "'" + node.value + "'";
        } else {
            context.queryString = node.value.toString();
        }

        return context;
    }

    protected visitFromClause: CompileMethod<ast.FromClause> = (context, node) => {
        let fromClause = node.tables.map(t => this.visitNode(context, t).queryString).join(", ");
        fromClause = "FROM " + fromClause;

        if (node.where) {
            fromClause += "\n" + this.visitNode(context, node.where).queryString;
        }

        if (node.groupBy) {
            fromClause += "\n" + this.visitNode(context, node.groupBy).queryString;
        }

        if (node.having) {
            fromClause += "\n HAVING " + this.visitNode(context, node.having).queryString;
        }

        context.queryString = fromClause;
        return context;
    }

    protected visitTableSource: CompileMethod<ast.TableSource> = (context, node) => {
        let table = this.visitNode(context, node.tableSourceItem).queryString;
        let joins = node.joins ? node.joins.map(j => this.visitNode(context, j).queryString) : [];

        joins = [table].concat(joins);
        context.queryString = joins.join("\n");

        return context;
    }

    protected visitJoinClause: CompileMethod<ast.JoinClause> = (context, node) => {
        let joinClause = (node.joinType ? node.joinType + " " : "") + "JOIN ";
        joinClause += this.visitNode(context, node.joinWith).queryString;

        if (node.on) {
            joinClause += " ON " + this.visitNode(context, node.on).queryString;
        }

        context.queryString = joinClause;
        return context;
    }

    protected visitTableSpec: CompileMethod<ast.TableSpec> = (context, node) => {
        context.queryString = node.tableName.toString();
        return context;
    }

    protected visitGroupByClause: CompileMethod<ast.GroupByClause> = (context, node) => {
        let groupByClause = "GROUP BY " + node.items.map(i => this.visitNode(context, i).queryString).join(", ");

        context.queryString = groupByClause;
        return context;
    }

    protected visitAliasedTerm: CompileMethod< ast.AliasedTerm<ast.SqlAstNode>> = (context, node) => {
        let termQuery = this.visitNode(context, node.term).queryString;
        context.queryString = node.alias ?  "(" + termQuery + ") AS " + node.alias : termQuery;

        return context;
    }

    protected visitSimpleFunctionCall: CompileMethod<ast.SimpleFunctionCall> = (context, node) => {
        let func = node.name + "(" + (node.args || []).map(a => this.visitNode(context, a).queryString).join(", ") + ")";

        context.queryString = func;
        return context;
    }

    protected visitBinaryPredicate: CompileMethod<ast.BinaryPredicate> = (context, node) => {
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

    protected visitLikePredicate: CompileMethod<ast.LikePredicate> = (context, node) => {
        context.queryString =
            "("
            + this.visitNode(context, node.left).queryString
            + (node.negate ? " NOT LIKE " : " LIKE ")
            + this.visitNode(context, node.right).queryString
            + ")";

        return context;
    }

    protected visitColumnName: CompileMethod<ast.ColumnName> = (context, node) => {
        context.queryString = node.table ? node.table.toString() + "." + node.name.toString() : node.name.toString();
        return context;
    }

    protected visitWhereClause: CompileMethod<ast.WhereClause> = (context, node) => {
        context.queryString = "WHERE " + this.visitNode(context, node.expression).queryString;
        return context;
    }

    protected visitOrderByClause: CompileMethod<ast.OrderByClause> = (context, node) => {
        context.queryString = "ORDER BY " + node.expressions.map(oe => this.visitNode(context, oe).queryString).join(", ");
        return context;
    }

    protected visitOrderByExpression: CompileMethod<ast.OrderByExpression> = (context, node) => {
        context.queryString = this.visitNode(context, node.expression).queryString + (node.descending ? " DESC " : " ASC ");
        return context;
    }

    protected visitLimitClause: CompileMethod<ast.LimitClause> = (context, node) => {
        context.queryString = "LIMIT " + node.limit.toString() + (node.offset ? node.offset.toString() : "");
        return context;
    }

    protected visitBinaryExpression: CompileMethod<ast.BinaryExpression<ast.BinaryOperator>> = (context, node) => {
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
        super("MySQL", query, CompilationContext);

        // Customize any other instance properties here, e.g. this.delimiter = "GO"; // For SQL Server (T-SQL)
    }
}
