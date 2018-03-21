import * as sql from "../lib";

describe("querySerializer unit tests", () => {
    let qb = new sql.MySQLQueryBuilder();
    let serializer = new sql.QuerySerializer();

    it("serializes simple select * query", () => {
        let q2 = qb.query().select("*").build();

        let query = '{"dialect":"MySQL","statements":[{"query":{"query":{"elements":[],"nodeType":4,"selectAll":"*"}' +
                    ',"nodeType":5},"nodeType":3}],"nodeType":2}';
        let json = serializer.serialize(q2);

        // q2 = serializer.deserialize(json);
        expect(json).toBe(query);
    });
});
