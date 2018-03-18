import * as ast from './astsql';
import { MySQLQueryBuilder } from './queryBuilder';
import { MySQLQueryCompiler } from './queryCompiler';
import { MySQLAstPrinter } from './astPrinter';

// let qb = new MySQLQueryBuilder();
// let c = qb.equals(qb.column("o.string_field_1"), qb.column("ol.string_field_2"));
// let sb = qb.query();
// let query = sb
//   .from("raw_table_10", "ol")
//   .join("raw_table_9", "o", c)
//   .join("raw_table_1", "a", c)
//   .where(c)
//   .groupBy(["ol.string_field_5"])
//   .select("*")
//   .build();

// // qb.select(qb.column("accounts.f_id", "accountId"));

// // qb.select("*");
// // qb.select(qb.column("accounts.*"), qb.alias(qb.func("SUM", qb.column("accounts.mrr")), "SumOfMrr"));

// // let query = qb.build();
// // console.log(JSON.stringify(query));

// // // let qc = new MySQLQueryCompiler();
// // // console.log(qc.compile(qb.query));

// let obj = new ast.Variable("@myVar");
// console.log(obj.constructor.name);
// console.log(obj.getNodeType());
// console.log(obj.constructor.name === obj.getNodeType());

// let visitor = new MySQLAstPrinter(new ast.SqlRoot("MySQL", [query]));
// visitor.visit();

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

let qb = new MySQLQueryBuilder();
let query = qb.query()
    .from("accounts", "a")
    .where(qb.equals(qb.column("id"), qb.literal(1)))
    .select("*", qb.literal("hello", "h"), qb.literal(42), qb.literal("NULL"));
let q = query.build();

let q1 = qb.query()
    .from("raw_table_10", "ol")
    .join("raw_table_9", "o", qb.equals("o.string_field_1", "ol.string_field_2"))
    .join("raw_table_1", "a", qb.equals("a.string_field_1", "o.string_field_2"))
    .where(qb.equals("ol.tenant_id", "@tenantId"))
    .groupBy("ol.string_field_5")
    .select("ol_string_field_5", qb.func("SUM", "ol.decimal_field_4"))
    .build();

// let q = qb.query().select(qb.literal(1)).build();

let printer = new MySQLAstPrinter(q);
printer.visit();

let compiler = new MySQLQueryCompiler(q);
console.log(compiler.compile());

printer = new MySQLAstPrinter(q1);
printer.visit();

let q1json = JSON.stringify(q1);
let q2 = JSON.parse(q1json);

console.log(q1json);
printer = new MySQLAstPrinter(q2);
printer.visit();
