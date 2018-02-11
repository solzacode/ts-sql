// // import { Select, SelectNode } from "./astsql";

// // declare module "./astsql" {
// //     // tslint:disable-next-line:no-shadowed-variable
// //     export interface Select {
// //         from(table: string): void;
// //     }
// // }

// // function applyMixins(derivedCtor: any, baseCtors: any[]) {
// //     baseCtors.forEach(baseCtor => {
// //         Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
// //             derivedCtor.prototype[name] = baseCtor.prototype[name];
// //         });
// //     });
// // }

// // class SelectExtensions {
// //     from(table: string) {
// //         // Do nothing
// //     }
// // }

// // applyMixins(SelectNode, [SelectExtensions]);

// // export class QueryBuilder {
// //     select(...fields: string[]): Select {
// //         return <Select> {};
// //     }
// // }

// // let qb = new QueryBuilder();
// // qb.select("all", "hello");
// // qb.select(...["all", "where"]);
// // let x = qb.select();
// // // x.from();

interface Select {
    field(table: string, column: string): SelectFrom;
}

interface SelectFrom extends Select {
}
