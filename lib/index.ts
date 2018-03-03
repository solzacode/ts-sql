import * as ast from './astsql';
import { MySQLQueryBuilder } from './queryBuilder';
import { MySQLQueryCompiler } from './queryCompiler';
import { AstPrinter } from './astPrinter';

let qb = new MySQLQueryBuilder();
qb.select(qb.column("accounts.f_id", "accountId"));

qb.select("*");
qb.select(qb.column("accounts.*"), qb.alias(qb.func("SUM", qb.column("accounts.mrr")), "SumOfMrr"));

let query = qb.build();
console.log(JSON.stringify(query));

// // let qc = new MySQLQueryCompiler();
// // console.log(qc.compile(qb.query));

let obj = new ast.Variable("@myvar");
console.log(obj.constructor.name);
console.log(obj.getNodeType());
console.log(obj.constructor.name === obj.getNodeType());

let visitor = new AstPrinter("MySQL", query);
visitor.visit();
