import * as ast from "./astsql";

export class QuerySerializer {
    // TODO: Make strong type classes instead of just JSON objects in the future
    serialize(sql: ast.SqlRoot): string {
        return JSON.stringify(sql);
    }

    deserialize(sql: string): ast.SqlRoot {
        let sqlObject = JSON.parse(sql);
        // return <ast.SqlRoot> this.buildNode(sqlObject);
        return <ast.SqlRoot> sqlObject;
    }
}
