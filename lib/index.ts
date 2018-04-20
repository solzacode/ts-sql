import * as ast from './astsql';
import { MySQLQueryBuilder } from './queryBuilder';
import { MySQLQueryCompiler } from './queryCompiler';
import { MySQLAstPrinter } from './astPrinter';
import { QuerySerializer } from './querySerializer';
import { MySQLQueryValidator, SqlAstSymbol } from './queryValidator';
import { SqlSymbolType } from './astsql';

// Debug area since vscode is not working fine for jest debug

// let qb = new MySQLQueryBuilder();
// let query = qb.query()
//     .from("accounts", "a")
//     .where(qb.and(
//         qb.equals(qb.column("a.id"), qb.literal(123)),
//         qb.equals(qb.column("a.city"), qb.literal("Redmond")),
//         qb.equals(qb.column("a.country"), qb.literal("USA"))))
//     .select(qb.column("a.name")).build();

// let qc = new MySQLQueryCompiler(query);
// console.log(qc.compile());

//

export * from "./astsql";
export * from "./astPrinter";
export * from "./queryBuilder";
export * from "./queryCompiler";
export * from "./querySerializer";
export * from "./queryValidator";
export * from "./queryVisitor";
