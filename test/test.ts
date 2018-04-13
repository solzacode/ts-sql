import * as sql from "../lib/index";

describe("ts-sql unit tests", () => {
    it("validate simple query", () => {
        let qb = new sql.MySQLQueryBuilder();
        let query = qb.query()
            .from("accounts")
            .where(qb.equals(qb.column("accountId"), qb.literal("12345")))
            .select(qb.column("accountName"), qb.column("country")).build();

        let qc = new sql.MySQLQueryCompiler(query);
        let qs = qc.compile();

        // console.log(qs);
    });
});
