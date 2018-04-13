import * as sql from '../lib/';

describe("queryValidator unit tests", () => {
    let qb = new sql.MySQLQueryBuilder();

    it("runs queryValidator successfully", () => {
        let query = qb.query().from("accounts").where(qb.equals(qb.column("id"), qb.literal(123))).select(qb.column("name")).build();
        let qc = new sql.MySQLQueryCompiler(query);
        console.log(qc.compile());

        let qv = new sql.MySQLQueryValidator(query);
        let st = qv.validate();

        let sym: sql.SqlAstSymbol = new sql.SqlAstSymbol('hello', sql.SqlSymbolType.Alias);
        for (sym of st) {
            console.log(sym.toString());
        }

        expect(true).toBe(true);
    });
});
