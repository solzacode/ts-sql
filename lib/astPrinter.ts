import { QueryVisitor, QueryContext } from "./queryVisitor";
import { SqlAstNode, AllColumns } from "./astsql";

export class AstPrinter extends QueryVisitor {
    private indents: Map<SqlAstNode, number> = new Map<SqlAstNode, number>();

    public visitGenericNode(context: QueryContext, node: SqlAstNode) {
        console.log(this.getIndentation(context), node.getNodeType());

        return super.visitGenericNode(context, node);
    }

    private getIndentation(context: QueryContext): string {
        if (context.parentNode) {
            if (this.indents.has(context.parentNode)) {
                this.indents.set(context.currentNode, (this.indents.get(context.parentNode) || 0) + 1);
            }
        } else {
            this.indents.set(context.currentNode, 0);
        }

        let ci: number = this.indents.get(context.currentNode) || 0;
        return " ".repeat(ci * 2);
    }
}
