import * as sql from '../lib/';

describe("queryValidator unit tests", () => {
    let qb = new sql.MySQLQueryBuilder();

    it("runs queryValidator successfully", () => {
        let query = qb.query()
            .from("accounts")
            .where(qb.equals(qb.column("accounts.id"), qb.literal(123)))
            .select(qb.column("accounts.name")).build();
        let qc = new sql.MySQLQueryCompiler(query);
        console.log(qc.compile());

        let qv = new sql.MySQLQueryValidator(query);
        let symbols = qv.validate();

        expect(symbols.length).toBe(3);
    });
});
