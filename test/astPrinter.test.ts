import * as sql from "../lib/index";

describe("astPrinter unit tests", () => {
    it("ast print with select all columns work", () => {
        let qb = new sql.MySQLQueryBuilder();
        let q = qb.query();
        let node = q.select("*").build();

        let printedLines: string[] = [];
        let printer = new sql.MySQLAstPrinter(
            node,
            {
                indentSize: 0,
                logger: {
                    log: (message: string) => printedLines.push(message)
                }
            });

        printer.print();

        expect(printedLines.length).toBe(4);
        expect(printedLines[0]).toBe('SqlRoot');
        expect(printedLines[1]).toBe('SelectStatement');
        expect(printedLines[2]).toBe('QueryIntoExpression');
        expect(printedLines[3]).toBe('QueryExpression');
    });
});
