import { QueryVisitor, QueryContext } from "./queryVisitor";
import { SqlAstNode, AllColumns, SqlRoot, SqlDialect } from "./astsql";

export interface AstLogger {
    log(message: string): void;
}

export interface AstPrintOptions {
    indentSize: number;
    logger: AstLogger;
}

export abstract class QueryAstPrinter extends QueryVisitor {
    private _options: AstPrintOptions;
    private _indents: Map<SqlAstNode, number>;

    constructor(dialect: SqlDialect, query: SqlRoot, options?: Partial<AstPrintOptions>) {
        super(dialect, query);

        let defaultOptions = this.getDefaultOptions();
        this._options = { ...defaultOptions, ...options };
        this._indents = new Map<SqlAstNode, number>();
    }

    public print() {
        this.visit();
    }

    protected visitGenericNode(context: QueryContext, node: SqlAstNode) {
        this.log(this.getIndentation(context) + SqlAstNode.getNodeType(node));
        return super.visitGenericNode(context, node);
    }

    private getDefaultOptions(): AstPrintOptions {
        return {
            indentSize: 2,
            logger: { log: (message) => console.log(message) }
        };
    }

    private log(message: string) {
        this._options.logger.log(message);
    }

    private getIndentation(context: QueryContext): string {
        if (context.parentNode) {
            if (this._indents.has(context.parentNode)) {
                this._indents.set(context.currentNode, (this._indents.get(context.parentNode) || 0) + 1);
            }
        } else {
            this._indents.set(context.currentNode, 0);
        }

        let ci: number = this._indents.get(context.currentNode) || 0;
        return " ".repeat(ci * this._options.indentSize);
    }
}

export class MySQLAstPrinter extends QueryAstPrinter {
    constructor(query: SqlRoot, options?: Partial<AstPrintOptions>) {
        super("MySQL", query, options);
    }
}
