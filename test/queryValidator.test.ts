import * as sql from '../lib/';

describe("queryValidator unit tests", () => {
    let qb = new sql.MySQLQueryBuilder();

    it("runs queryValidator successfully", () => {
        let query = qb.query()
            .from("accounts", "a")
            .where(qb.equals(qb.column("a.id"), qb.literal(123)))
            .select(qb.column("a.name")).build();
        let qc = new sql.MySQLQueryCompiler(query);
        qc.compile();

        let qv = new sql.MySQLQueryValidator(query);
        let symbols = qv.validate();

        expect(symbols.length).toBe(4);
    });

    it("can replace symbols", () => {
        let query = qb.query()
            .from("accounts", "a")
            .where(qb.equals(qb.column("a.id"), qb.literal(123)))
            .select(qb.column("a.name")).build();
        let qc = new sql.MySQLQueryCompiler(query);
        qc.compile();

        let qv = new sql.MySQLQueryValidator(query);
        let symbols = qv.validate();

        let map = new Map<string, string>();
        map.set('table:accounts', 'raw_table_1');
        map.set('field:accounts.id', 'string_field_1');
        map.set('field:accounts.name', 'string_field_2');

        let updatedSymbols = [];

        for (let s of symbols) {
            let copy = s.identifier;
            let key = s.identifier;
            if (s.type === sql.SqlSymbolType.Table) {
                key = 'table:' + s.identifier;
            } else if (s.type === sql.SqlSymbolType.Field) {
                let parent = s.parent;
                if (parent && parent.type === sql.SqlSymbolType.Alias) {
                    parent = parent.parent;
                }
                key = 'field:' + parent!.identifier + '.' + s.identifier;
            }

            if (map.has(key)) {
                copy = map.get(key)!;
            }

            updatedSymbols.push(copy);
        }

        for (let index = 0; index < symbols.length; index++) {
            symbols[index].identifier = updatedSymbols[index];
        }

        let qc2 = new sql.MySQLQueryCompiler(query);

        let actual = qc2.compile();
        let expected = "SELECT a.string_field_2 FROM raw_table_1 AS a WHERE (a.string_field_1 = 123)";

        expect(actual).toEqual(expected);
    });
});
