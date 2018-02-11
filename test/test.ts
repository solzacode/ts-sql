import * as tsSql from "../lib/index";

describe("ts-sql unit tests", () => {
    it("should return greeting", () => {
        expect(tsSql.sayHello("Solza")).toBe("Hello, Solza");
    });
});
