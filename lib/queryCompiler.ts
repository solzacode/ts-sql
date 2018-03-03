import * as ast from "./astsql";

export class CompileContext {
    parentNode?: ast.SqlAstNode;
    currentNode?: ast.SqlAstNode;
}

export class QueryCompiler {
    delimiter: string;

    constructor(public dialect: ast.SqlDialect) {
        this.delimiter = ";";
    }

    compile(query: ast.SqlRoot): string {
        return this.compileNode(query, "");
    }

    compileNode(node: any, querySoFar: string): string {
        switch (true) {
            case node instanceof ast.SelectStatement:
                return this.compileSelectStatement(node, querySoFar);

            case node instanceof ast.SqlRoot:
                return this.compileSqlRoot(node, querySoFar);

            case node instanceof ast.AliasedTerm:
                return this.compileAliasedTerm(node, querySoFar);

            case node instanceof ast.ColumnName:
                return this.compileColumnName(node, querySoFar);

            case node instanceof ast.AllColumns:
                return this.compileAllColumns(node, querySoFar);

            case node instanceof ast.QueryIntoExpression:
                return this.compileQueryIntoExpression(node, querySoFar);

            case node instanceof ast.SelectIntoFieldsExpression:
                return this.compileSelectIntoFieldsExpression(node, querySoFar);

            case node instanceof ast.QueryExpression:
                return this.compileQueryExpression(node, querySoFar);

            case node instanceof ast.SimpleFunctionCall:
                return this.compileSimpleFunctionCall(node, querySoFar);

            default:
            // throw Error("Unknown construct");
            // do nothing
        }

        return querySoFar;
    }

    compileSqlRoot(node: ast.SqlRoot, querySoFar: string) {
        for (let index = 0; index < node.statements.length; index++) {
            querySoFar = this.compileNode(node.statements[index], querySoFar);

            if (index < node.statements.length - 1) {
                querySoFar += " " + this.delimiter + "\n";
            }
        }

        return querySoFar;
    }

    compileSelectStatement(node: ast.SelectStatement, querySoFar: string) {
        querySoFar += " SELECT";
        querySoFar = this.compileNode(node.query, querySoFar);

        if (node.lock) {
            querySoFar += " " + (<string> node.lock);
        }

        return querySoFar;
    }

    compileQueryIntoExpression(node: ast.QueryIntoExpression, querySoFar: string) {
        querySoFar = this.compileNode(node.query, querySoFar);

        if (node.into) {
            querySoFar = this.compileNode(node.into, querySoFar);
        }

        return querySoFar;
    }

    compileSelectIntoFieldsExpression(node: ast.SelectIntoFieldsExpression, querySoFar: string) {
        if (node.fields.length === 1) {
            return querySoFar += " " + node.fields[0];
        }

        return querySoFar + " (" + node.fields.join(", ") + ")";
    }

    compileQueryExpression(node: ast.QueryExpression, querySoFar: string) {
        if (node.selectSpec) {
            querySoFar += " " + node.selectSpec.join(" ");
        }

        if (!node.selectAll && node.elements.length === 0) {
            throw Error("Nothing specified in SELECT expression");
        }

        if (node.selectAll) {
            querySoFar += " *";
            if (node.elements.length !== 0) {
                querySoFar += ",";
            }
        }

        if (node.elements.length !== 0) {
            for (let index = 0; index < node.elements.length; index++) {
                querySoFar = this.compileNode(node.elements[index], querySoFar);

                if (index < node.elements.length - 1) {
                    querySoFar += ", ";
                }
            }
        }

        return querySoFar;
    }

    compileAliasedTerm(node: ast.AliasedTerm<ast.SqlAstNode>, querySoFar: string) {
        querySoFar = this.compileNode(node.term, querySoFar);
        if (node.alias) {
            querySoFar += " AS " + node.alias;
        }

        return querySoFar;
    }

    compileColumnName(node: ast.ColumnName, querySoFar: string) {
        querySoFar += " ";

        if (node.table) {
            querySoFar += node.table + ".";
        }

        querySoFar += node.name;
        return querySoFar;
    }

    compileAllColumns(node: ast.AllColumns, querySoFar: string) {
        querySoFar += " " + node.table + ".*";
        return querySoFar;
    }

    compileSimpleFunctionCall(node: ast.SimpleFunctionCall, querySoFar: string) {
        querySoFar += " " + node.name + "(";
        if (node.args) {
            querySoFar += node.args.map(a => this.compileNode(a, "")).join(", ");
        }
        querySoFar += ")";

        return querySoFar;
    }
}

export class MySQLQueryCompiler extends QueryCompiler {
    constructor() {
        super("MySQL");

        // Customize any other instance properties here, e.g. this.delimiter = "GO"; // For SQL Server (T-SQL)
    }
}
