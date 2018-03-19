import * as ast from './astsql';
import { MySQLQueryBuilder } from './queryBuilder';
import { MySQLQueryCompiler } from './queryCompiler';
import { MySQLAstPrinter } from './astPrinter';
import { QuerySerializer } from './querySerializer';

let serializer = new QuerySerializer();

let qb = new MySQLQueryBuilder();
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

// console.log(serializer.serialize(query));

let qc = new MySQLQueryCompiler(query);
console.log(qc.compile());

let visitor = new MySQLAstPrinter(new ast.SqlRoot("MySQL", [query]));
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

qb = new MySQLQueryBuilder();
let qq = qb.query()
    .from("accounts", "a")
    .where(qb.equals(qb.column("id"), qb.literal(1)))
    .select("*", qb.literal("hello", "h"), qb.literal(42), qb.literal("NULL"));
let q = qq.build();

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
// printer.visit();

let compiler = new MySQLQueryCompiler(q);
console.log(compiler.compile());

compiler = new MySQLQueryCompiler(q1);
console.log(compiler.compile());

let q2 = qb.query().select("*").build();
let json = serializer.serialize(q2);

console.log(json);

q2 = serializer.deserialize(json);
printer = new MySQLAstPrinter(q2);
// printer.visit();

compiler = new MySQLQueryCompiler(q2);
console.log(compiler.compile());
