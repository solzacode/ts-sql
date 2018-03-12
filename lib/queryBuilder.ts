import * as ast from "./astsql";

export interface PreparedQuery {
    build: BuildMethod;
}

export interface IntoMethod {
    (fields: string[]): PreparedQuery;
}

export interface LimitMethod {
    (limit: number, offset?: number): LimitedProjection;
}

export interface OrderByMethod {
    (expressions: ast.OrderByExpression[]): OrderedProjection;
}

export interface SelectMethod {
    (element: ast.SelectElement | ast.SelectAll, ...moreElements: ast.SelectElement[]): Projection;
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
    (fields: string[] | ast.GroupByItem[]): GroupedQuerySource;
}

export interface HavingMethod {
    (condition: ast.Expression): GroupedAndFilteredQuerySource;
}

export interface BuildMethod {
    (): ast.SelectStatement;
}

export interface QueryBuilder {
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
    into: IntoMethod;
    limit: LimitMethod;
}

export interface LimitedProjection extends PreparedQuery {
    into: IntoMethod;
}

export interface QueryElementsBuilder {
    func(name: string, funcArgs?: ast.FunctionArgument[]): ast.SimpleFunctionCall;
    column(name: string, table?: string): ast.ColumnName;
    literal(value: ast.ConstantType): ast.Constant;
    truthy(predicate: ast.Predicate, negate?: boolean): ast.TruthyPredicate;
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
    isTrue(predicate: ast.Predicate): ast.TruthyPredicate;
    isFalse(predicate: ast.Predicate): ast.TruthyPredicate;
    isUnknown(predicate: ast.Predicate): ast.TruthyPredicate;
    in(predicate: ast.Predicate, target: ast.SelectStatement): ast.InPredicate;
    isNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate;
    isNotNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate;

    binaryPredicate(left: ast.Predicate, operator: ast.ComparisonOperator, right: ast.Predicate): ast.BinaryPredicate;
    equals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate;
    greater(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate;
    less(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate;
    greaterOrEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate;
    lessOrEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate;
    notEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate;
    nullSafeEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate;

    between(left: ast.Predicate, right: ast.Predicate): ast.BetweenPredicate;
    notBetween(left: ast.Predicate, right: ast.Predicate): ast.BetweenPredicate;

    soundsLike(left: ast.Predicate, right: ast.Predicate): ast.SoundsLikePredicate;
    like(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate;
    notLike(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate;
}

class SelectStatementBuilderImpl implements Queryable {
    statement: Partial<ast.SelectStatement>;

    constructor(public queryBuilder: QueryBuilder) {
        this.statement = { };
    }

    select: SelectMethod = (element, ...moreElements) => {
        throw Error("Not implemented");
    }

    from: FromMethod = (table, alias?) => {
        throw Error("Not implemented");
    }
}

export class QueryBuilderBase implements QueryBuilder, QueryElementsBuilder, ExpressionBuilder, PredicateBuilder {
    constructor(public dialect: ast.SqlDialect) { }

    func(name: string, funcArgs?: ast.FunctionArgument[] | undefined): ast.SimpleFunctionCall {
        throw new Error("Method not implemented.");
    }
    column(name: string, table?: string | undefined): ast.ColumnName {
        throw new Error("Method not implemented.");
    }
    literal(value: ast.ConstantType): ast.Constant {
        throw new Error("Method not implemented.");
    }
    truthy(predicate: ast.Predicate, negate?: boolean | undefined): ast.TruthyPredicate {
        throw new Error("Method not implemented.");
    }
    variable(name: string): ast.Variable {
        throw new Error("Method not implemented.");
    }
    exists(statement: ast.SelectStatement): ast.ExistsSelectStatement {
        throw new Error("Method not implemented.");
    }
    nested(statement: ast.SelectStatement): ast.NestedSelectStatement {
        throw new Error("Method not implemented.");
    }
    not(expression: ast.Expression): ast.NotExpression {
        throw new Error("Method not implemented.");
    }
    and(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator> {
        throw new Error("Method not implemented.");
    }
    or(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator> {
        throw new Error("Method not implemented.");
    }
    xor(left: ast.Expression, right: ast.Expression): ast.BinaryExpression<ast.LogicalOperator> {
        throw new Error("Method not implemented.");
    }
    isTrue(predicate: ast.Predicate): ast.TruthyPredicate {
        throw new Error("Method not implemented.");
    }
    isFalse(predicate: ast.Predicate): ast.TruthyPredicate {
        throw new Error("Method not implemented.");
    }
    isUnknown(predicate: ast.Predicate): ast.TruthyPredicate {
        throw new Error("Method not implemented.");
    }
    in(predicate: ast.Predicate, target: ast.SelectStatement): ast.InPredicate {
        throw new Error("Method not implemented.");
    }
    isNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate {
        throw new Error("Method not implemented.");
    }
    isNotNull(predicate: ast.Predicate): ast.IsNullNotNullPredicate {
        throw new Error("Method not implemented.");
    }
    binaryPredicate(left: ast.Predicate, operator: ast.ComparisonOperator, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    equals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    greater(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    less(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    greaterOrEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    lessOrEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    notEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    nullSafeEquals(left: ast.Predicate, right: ast.Predicate): ast.BinaryPredicate {
        throw new Error("Method not implemented.");
    }
    between(left: ast.Predicate, right: ast.Predicate): ast.BetweenPredicate {
        throw new Error("Method not implemented.");
    }
    notBetween(left: ast.Predicate, right: ast.Predicate): ast.BetweenPredicate {
        throw new Error("Method not implemented.");
    }
    soundsLike(left: ast.Predicate, right: ast.Predicate): ast.SoundsLikePredicate {
        throw new Error("Method not implemented.");
    }
    like(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate {
        throw new Error("Method not implemented.");
    }
    notLike(left: ast.Predicate, right: ast.Predicate): ast.LikePredicate {
        throw new Error("Method not implemented.");
    }
    query(): Queryable {
        return new SelectStatementBuilderImpl(this);
    }
}

export class MySQLQueryBuilder extends QueryBuilderBase {
    constructor() {
        super("MySQL");
    }
}

/***
 * SELECT ol.string_field_5, SUM(ol.decimal_field_4)
 * FROM raw_table_10 as ol
 * INNER JOIN raw_table_9 as o ON o.string_field_1 = ol.string_field_2
 * INNER JOIN raw_table_1 as a on a.string_field_1 = o.string_field_2
 * WHERE ol.tenant_id = @tenantId
 * GROUP BY ol.string_field_5
 *
 * qb.select("table.field", qb.func("SUM", "table.field"))
 *
 * qb
 *  .from("raw_table_10", "ol")
 *  .join("raw_table_9", "o", qb.binary("o.string_field_1", "=", "ol.string_field_2"))
 *  .join("raw_table_1", "a", qb.binary("a.string_field_1", "=", "o.string_field_2"))
 *  .where(qb.binary("ol.tenant_id", "=", "@tenantId"))
 *  .groupBy("ol.string_field_5")
 *  .select("ol_string_field_5", qb.func("SUM", "ol.decimal_field_4"))
 */
