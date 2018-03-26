import * as ast from "./astsql";

export interface PreparedQuery {
    toSelect: ToSelectMethod;
    build: BuildMethod;
}

export interface BinaryPredicateBuilderMethod {
    (left: string | ast.Predicate, right: string | ast.Predicate): ast.BinaryPredicate;
}

export interface IntoMethod {
    (...fields: string[]): PreparedQuery;
}

export interface LimitMethod {
    (limit: number, offset?: number): LimitedProjection;
}

export interface OrderByMethod {
    (...expressions: ast.OrderByExpression[]): OrderedProjection;
}

export interface SelectMethod {
    (element: string | ast.SelectElement | ast.SelectAll, ...moreElements: ast.SelectElement[]): Projection;
}

export interface FromMethod {
    (table: string | ast.NestedSelectStatement, alias?: string): QuerySource;
}

export interface JoinMethod {
    (table: string | ast.NestedSelectStatement, alias: string, on: ast.Expression): QuerySource;
}

export interface WhereMethod {
    (expression: ast.Expression): FilteredQuerySource;
}

export interface GroupByMethod {
    (...fields: (string | ast.GroupByItem)[]): GroupedQuerySource;
}

export interface HavingMethod {
    (condition: ast.Expression): GroupedAndFilteredQuerySource;
}

export interface ToSelectMethod {
    (): ast.SelectStatement;
}

export interface BuildMethod {
    (): ast.SqlRoot;
}

export interface QueryBuilder {
    dialect: ast.SqlDialect;
    query(): Queryable;
}

export interface Queryable {
    select: SelectMethod;
    from: FromMethod;
}

export interface QuerySource {
    join: JoinMethod;
    lefJoin: JoinMethod;
    rightJoin: JoinMethod;
    where: WhereMethod;
    select: SelectMethod;
}

export interface FilteredQuerySource {
    groupBy: GroupByMethod;
    select: SelectMethod;
}

export interface GroupedQuerySource {
    having: HavingMethod;
    select: SelectMethod;
}

export interface GroupedAndFilteredQuerySource {
    select: SelectMethod;
}

export interface Projection extends PreparedQuery {
    orderBy: OrderByMethod;
    limit: LimitMethod;
    into: IntoMethod;
}

export interface OrderedProjection extends PreparedQuery {
    orderBy: OrderByMethod;
    into: IntoMethod;
    limit: LimitMethod;
}

export interface LimitedProjection extends PreparedQuery {
    into: IntoMethod;
}

export interface QueryElementsBuilder {
    func(name: string, ...funcArgs: (string | ast.FunctionArgument)[]): ast.SimpleFunctionCall;
    column(name: string, table?: string): ast.ColumnName;
    literal(value: ast.ConstantType): ast.Constant | ast.AliasedTerm<ast.Constant>;
    variable(name: string): ast.Variable;
    exists(statement: ast.SelectStatement): ast.ExistsSelectStatement;
    nested(statement: ast.SelectStatement): ast.NestedSelectStatement;
}

export interface ExpressionBuilder {
    not(expression: ast.Expression): ast.NotExpression;
    and(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator>;
    or(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator>;
    xor(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator>;
}

export interface PredicateBuilder {
    // Binary predicate builders
    equals: BinaryPredicateBuilderMethod;
    greater: BinaryPredicateBuilderMethod;
    less: BinaryPredicateBuilderMethod;
    greaterOrEquals: BinaryPredicateBuilderMethod;
    lessOrEquals: BinaryPredicateBuilderMethod;
    notEquals: BinaryPredicateBuilderMethod;
    nullSafeEquals: BinaryPredicateBuilderMethod;

    isTrue(predicate: ast.Predicate): ast.TruthyPredicate;
    isFalse(predicate: ast.Predicate): ast.TruthyPredicate;
    isUnknown(predicate: ast.Predicate): ast.TruthyPredicate;
    in(predicate: ast.Predicate, target: ast.SelectStatement | ast.Expression[]): ast.InPredicate;
    notIn(predicate: ast.Predicate, target: ast.SelectStatement | ast.Expression[]): ast.InPredicate;
    isNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate;
    isNotNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate;

    binaryPredicate(left: ast.Predicate, operator: ast.ComparisonOperator, right: ast.Predicate): ast.BinaryPredicate;

    between(operand: ast.Predicate, start: ast.Predicate, end: ast.Predicate): ast.BetweenPredicate;
    notBetween(operand: ast.Predicate, start: ast.Predicate, end: ast.Predicate): ast.BetweenPredicate;

    soundsLike(left: ast.Predicate, right: ast.Predicate): ast.SoundsLikePredicate;
    like(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate;
    notLike(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate;
}

class QueryableImpl implements
    Queryable,
    QuerySource,
    FilteredQuerySource,
    GroupedQuerySource,
    GroupedAndFilteredQuerySource,
    Projection,
    OrderedProjection,
    LimitedProjection,
    PreparedQuery {
    // Begin implementation
    statement: ast.SelectStatement;

    constructor(public queryBuilder: QueryBuilderBase) {
        this.statement = new ast.SelectStatement(new ast.QueryIntoExpression(new ast.QueryExpression()));
    }

    select: SelectMethod = (element, ...moreElements) => {
        const all: ast.SelectAll = "*";
        let query = this.statement.query.query;

        if (element === all) {
            query.selectAll = all;
            query.elements = moreElements;
        } else {
            query.elements = [typeof element === "string" ? this.queryBuilder.column(element) : element].concat(moreElements);
        }

        return this;
    }

    from: FromMethod = (table, alias?) => {
        let query = this.statement.query.query;
        let tableSourceItems: ast.TableSourceItem[] = [];

        if (typeof table === "string") {
            let tableSpec = new ast.TableSpec(table);
            tableSourceItems.push(alias ? new ast.AliasedTerm(tableSpec, alias) : tableSpec);
        } else {
            if (!alias) {
                throw Error("Alias required for nested select statements");
            } else {
                tableSourceItems.push(new ast.AliasedTerm(<ast.NestedSelectStatement> table, alias));
            }
        }

        query.from = new ast.FromClause(tableSourceItems.map(item => new ast.TableSource(item)));
        return this;
    }

    join: JoinMethod = (table, alias, on) => {
        return this.buildJoinClause(table, alias, on, "INNER");
    }

    lefJoin: JoinMethod = (table, alias, on) => {
        return this.buildJoinClause(table, alias, on, "LEFT OUTER");
    }

    rightJoin: JoinMethod = (table, alias, on) => {
        return this.buildJoinClause(table, alias, on, "RIGHT OUTER");
    }

    where: WhereMethod = (expression) => {
        let query = this.statement.query.query;

        if (query.from) {
            query.from.where = new ast.WhereClause(expression);
        }

        return this;
    }

    groupBy: GroupByMethod = (...fields: (string | ast.GroupByItem)[]) => {
        let groupByClause = new ast.GroupByClause(fields.map(f => typeof f === "string" ? new ast.GroupByItem(new ast.ColumnName(f)) : f));

        if (this.statement.query.query.from) {
            this.statement.query.query.from.groupBy = groupByClause;
        } else {
            throw Error("Can't group anything");
        }

        return this;
    }

    having: HavingMethod = (condition) => {
        if (this.statement.query.query.from) {
            this.statement.query.query.from.having = condition;
        } else {
            throw Error("Invalid use of 'having'");
        }

        return this;
    }

    orderBy: OrderByMethod = (...expressions: ast.OrderByExpression[]) => {
        this.statement.query.query.orderBy = new ast.OrderByClause(expressions);
        return this;
    }

    limit: LimitMethod = (limit: number, offset?: number) => {
        this.statement.query.query.limit = new ast.LimitClause(limit, offset);
        return this;
    }

    into: IntoMethod = (...fields: string[]) => {
        throw Error("Into is not yet implemented");
    }

    toSelect: ToSelectMethod = () => {
        return (<ast.SelectStatement> this.statement);
    }

    build: BuildMethod = () => {
        return new ast.SqlRoot(this.queryBuilder.dialect, [this.toSelect()]);
    }

    private buildJoinClause(table: string | ast.NestedSelectStatement, alias: string, on: ast.Expression, joinType: ast.JoinType) {
        let tableSpec = new ast.AliasedTerm(typeof table === "string" ? new ast.TableSpec(table) : table, alias);
        let joinPart = new ast.JoinClause(tableSpec);
        joinPart.joinType = joinType;
        joinPart.on = on;

        if (this.statement.query.query.from !== undefined) {
            let tables = this.statement.query.query.from.tables;
            let lastTable = tables[tables.length - 1];
            lastTable.joins = lastTable.joins ? lastTable.joins.concat(joinPart) : [joinPart];
        } else {
            throw Error("Can't join with anything meaningful");
        }

        return this;
    }
}

export abstract class QueryBuilderBase implements QueryBuilder, QueryElementsBuilder, ExpressionBuilder, PredicateBuilder {
    constructor(public dialect: ast.SqlDialect) { }

    alias(node: ast.SqlAstNode, aliasName: string) {
        return new ast.AliasedTerm(node, aliasName);
    }

    func(name: string, ...funcArgs: (string | ast.FunctionArgument)[]): ast.SimpleFunctionCall {
        return new ast.SimpleFunctionCall(name, funcArgs.map(f => typeof f === "string" ? this.column(f) : f));
    }

    column(name: string, table?: string): ast.ColumnName {
        let lastDot = name.lastIndexOf(".");
        if (lastDot !== -1) {
            if (table) {
                throw Error("Invalid syntax for column name");
            } else {
                table = name.substr(0, lastDot);
                name = name.substr(lastDot + 1);

                if (!name || name === "") {
                    throw Error("Invalid syntax for column name");
                }
            }
        }

        return new ast.ColumnName(name, table);
    }

    literal(value: ast.ConstantType, alias?: string): ast.Constant | ast.AliasedTerm<ast.Constant> {
        let constant = new ast.Constant(value);
        return alias ? new ast.AliasedTerm<ast.Constant>(constant, alias) : constant;
    }

    variable(name: string): ast.Variable {
        return new ast.Variable(name);
    }

    exists(statement: ast.SelectStatement): ast.ExistsSelectStatement {
        return new ast.ExistsSelectStatement(statement);
    }

    nested(statement: ast.SelectStatement): ast.NestedSelectStatement {
        return new ast.NestedSelectStatement(statement);
    }

    not(expression: ast.Expression): ast.NotExpression {
        return new ast.NotExpression(expression);
    }

    and(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator> {
        return new ast.BinaryExpression<ast.LogicalOperator>(left, "AND", right);
    }

    or(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator> {
        return new ast.BinaryExpression<ast.LogicalOperator>(left, "OR", right);
    }

    xor(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator> {
        return new ast.BinaryExpression<ast.LogicalOperator>(left, "XOR", right);
    }

    isTrue(predicate: ast.Predicate): ast.TruthyPredicate {
        return new ast.TruthyPredicate(predicate, false, true);
    }

    isFalse(predicate: ast.Predicate): ast.TruthyPredicate {
        return new ast.TruthyPredicate(predicate, false, false);
    }

    isUnknown(predicate: ast.Predicate): ast.TruthyPredicate {
        throw new Error("Method not implemented.");
    }

    in(predicate: ast.Predicate, target: ast.SelectStatement | ast.Expression[]): ast.InPredicate {
        return new ast.InPredicate(predicate, target);
    }

    notIn(predicate: ast.Predicate, target: ast.SelectStatement | ast.Expression[]): ast.InPredicate {
        return new ast.InPredicate(predicate, target, true);
    }

    isNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate {
        return new ast.IsNullNotNullPredicate(predicate, "NULL");
    }

    isNotNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate {
        return new ast.IsNullNotNullPredicate(predicate, "NOT NULL");
    }

    binaryPredicate(left: ast.Predicate, operator: ast.ComparisonOperator, right: ast.Predicate): ast.BinaryPredicate {
        return new ast.BinaryExpression(left, operator, right);
    }

    equals: BinaryPredicateBuilderMethod = (left, right) => {
        return this.buildBinaryPredicate(left, "=", right);
    }

    greater: BinaryPredicateBuilderMethod = (left, right) => {
        return this.buildBinaryPredicate(left, ">", right);
    }

    less: BinaryPredicateBuilderMethod = (left, right) => {
        return this.buildBinaryPredicate(left, "<", right);
    }

    greaterOrEquals: BinaryPredicateBuilderMethod = (left, right) => {
        return this.buildBinaryPredicate(left, ">=", right);
    }

    lessOrEquals: BinaryPredicateBuilderMethod = (left, right) => {
        return this.buildBinaryPredicate(left, "<=", right);
    }

    notEquals: BinaryPredicateBuilderMethod = (left, right) => {
        return this.buildBinaryPredicate(left, "!=", right);
    }

    nullSafeEquals: BinaryPredicateBuilderMethod = (left, right) => {
        return this.buildBinaryPredicate(left, "<=>", right);
    }

    between(operand: ast.Predicate, start: ast.Predicate, end: ast.Predicate): ast.BetweenPredicate {
        return new ast.BetweenPredicate(operand, start, end);
    }

    notBetween(operand: ast.Predicate, left: ast.Predicate, right: ast.Predicate): ast.BetweenPredicate {
        return new ast.BetweenPredicate(operand, left, right, true);
    }

    soundsLike(left: ast.Predicate, right: ast.Predicate): ast.SoundsLikePredicate {
        return new ast.SoundsLikePredicate(left, right);
    }

    like(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate {
        return new ast.LikePredicate(left, right);
    }

    notLike(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate {
        return new ast.LikePredicate(left, right, true);
    }

    query(): Queryable {
        return new QueryableImpl(this);
    }

    private buildBinaryPredicate(left: string | ast.Predicate, operator: ast.ComparisonOperator, right: string | ast.Predicate) {
        let lp = typeof left === "string" ? this.column(left) : left;
        let rp = typeof right === "string" ? this.column(right) : right;

        return new ast.BinaryPredicate(lp, operator, rp);
    }
}

export class MySQLQueryBuilder extends QueryBuilderBase {
    constructor() {
        super("MySQL");
    }
}
