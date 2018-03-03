import * as ast from "./astsql";

export class QueryBuilder {
    query: ast.SqlRoot;
    currentStatement?: ast.SqlStatement;

    constructor(dialect: ast.SqlDialect) {
        this.query = new ast.SqlRoot(dialect);
    }

    select(element: ast.SelectAll | ast.SelectElement, ...moreElements: ast.SelectElement[]): MySQLQueryBuilder {
        if (this.currentStatement) {
            this.query.statements.push(this.currentStatement);
        }

        let queryExpression = new ast.QueryExpression();
        if (element === "*") {
            queryExpression.selectAll = element;
        } else {
            queryExpression.elements.push(element);
        }

        queryExpression.elements.push(...moreElements);

        this.currentStatement = new ast.SelectStatement(new ast.QueryIntoExpression(queryExpression));
        return this;
    }

    allColumns(table: string) {
        return new ast.AllColumns(table);
    }

    column(name: string, alias?: string) {
        let position = name.lastIndexOf(".");

        if (position) {
            if (name.endsWith(".*")) {
                if (alias) {
                    throw Error("Cannot use alias with table.* pattern");
                }

                return this.allColumns(name.substring(0, name.length - 2));
            }

            return new ast.AliasedTerm(new ast.ColumnName(name.substring(position + 1), name.substring(0, position)), alias);
        }

        return new ast.AliasedTerm(new ast.ColumnName(name), alias);
    }

    func(name: string, ...funcArgs: ast.FunctionArgument[]) {
        return new ast.SimpleFunctionCall(name, funcArgs.length > 0 ? funcArgs : undefined);
    }

    alias<TTerm extends ast.SqlAstNode>(term: TTerm, name: string) {
        return new ast.AliasedTerm(term, name);
    }

    variable(name: string) {
        return new ast.Variable(name);
    }

    literal(value: string | number | boolean): ast.Constant {
        return new ast.Constant(value);
    }

    unary(operator: ast.UnaryOperator, term: ast.ExpressionAtom) {
        return new ast.UnaryExpressionAtom(operator, term);
    }

    exists(select: ast.SelectStatement) {
        return new ast.ExistsSelectStatement(select);
    }

    nestedSelect(select: ast.SelectStatement) {
        return new ast.NestedSelectStatement(select);
    }

    binary(left: ast.ExpressionAtom, operator: ast.BitOperator | ast.MathOperator, right: ast.ExpressionAtom) {
        return new ast.BinaryExpressionAtom(left, operator, right);
    }

    build(): ast.SqlRoot {
        if (this.currentStatement) {
            this.query.statements.push(this.currentStatement);
        }

        return this.query;
    }
}

export class MySQLQueryBuilder extends QueryBuilder {
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
 */
