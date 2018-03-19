import { QueryVisitor, QueryContext } from "./queryVisitor";
import { SqlAstNode, AllColumns, SqlRoot } from "./astsql";

export interface AstPrintOptions {
    indentSize: number;
}

export class MySQLAstPrinter extends QueryVisitor {
    private _options: AstPrintOptions;
    private _indents: Map<SqlAstNode, number>;

    constructor(query: SqlRoot, options?: Partial<AstPrintOptions>) {
        super("MySQL", query);

        let defaultOptions = this.getDefaultOptions();
        this._options = { ...defaultOptions, ...options };
        this._indents = new Map<SqlAstNode, number>();
    }

    public visitGenericNode(context: QueryContext, node: SqlAstNode) {
        console.log(this.getIndentation(context) + SqlAstNode.getNodeType(node));

        return super.visitGenericNode(context, node);
    }

    public visitAllColumns(context: QueryContext, node: AllColumns) {
        console.log(this.getIndentation(context) + node.table + "*");
        return context;
    }

    private getDefaultOptions(): AstPrintOptions {
        return {
            indentSize: 2
        };
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
