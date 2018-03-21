import * as ast from './astsql';
import { MySQLQueryBuilder } from './queryBuilder';
import { MySQLQueryCompiler } from './queryCompiler';
import { MySQLAstPrinter } from './astPrinter';
import { QuerySerializer } from './querySerializer';

/*
let qb = new MySQLQueryBuilder();
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

printer = new MySQLAstPrinter(q2);
// printer.visit();

compiler = new MySQLQueryCompiler(q2);
console.log(compiler.compile());
*/

export * from "./astsql";
export * from "./astPrinter";
export * from "./queryBuilder";
export * from "./queryCompiler";
export * from "./querySerializer";
export * from "./queryValidator";
export * from "./queryVisitor";
