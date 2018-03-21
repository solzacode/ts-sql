import * as sql from "../lib/index";

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

describe("queryCompiler unit tests", () => {
    let qb = new sql.MySQLQueryBuilder();

    it("compiles query with reused condition object", () => {
        let c = qb.equals(qb.column("o.string_field_1"), qb.column("ol.string_field_2"));
        let sb = qb.query();
        let query = sb
            .from("raw_table_10", "ol")
            .join("raw_table_9", "o", c)
            .join("raw_table_1", "a", c)
            .where(c)
            .groupBy("ol.string_field_5")
            .select("*")
            .build();

        let compiledQuery =
            "SELECT *\n" +
            "FROM (raw_table_10) AS ol\n" +
            "INNER JOIN (raw_table_9) AS o ON (o.string_field_1 = ol.string_field_2)\n" +
            "INNER JOIN (raw_table_1) AS a ON (o.string_field_1 = ol.string_field_2)\n" +
            "WHERE (o.string_field_1 = ol.string_field_2)\n" +
            "GROUP BY ol.string_field_5";

        let qc = new sql.MySQLQueryCompiler(query);
        let compilation = qc.compile();

        expect(compilation).toBe(compiledQuery);
    });
});
