import * as ast from "./astsql";

export interface QueryContext<TResult = any> {
    parentNode?: ast.SqlAstNode;
    currentNode: ast.SqlAstNode;
    result?: TResult;
}

export interface QueryContextType<TResult> {
    new(node: ast.SqlAstNode): QueryContext<TResult>;
}

export class QueryVisitor<TResult = any> {
    public visitStarted: boolean;

    constructor(public dialect: ast.SqlDialect, public query: ast.SqlRoot) {
        this.visitStarted = false;
    }

    public visit(): TResult | undefined {
        if (this.visitStarted) {
            throw Error("Visit already initiated");
        }

        let context: QueryContext<TResult> = { currentNode: this.query };
        context = this.visitNode(context, this.query);
        this.visitStarted = true;

        return context.result;
    }

    // Dispatcher
    protected visitNode(context: QueryContext<TResult>, node: ast.SqlAstNode): QueryContext<TResult> {
        let type: ast.SqlAstNodeType = Reflect.getMetadata(ast.NodeTypeKey, this);

        if (!node || type) {
            throw Error("Node is of incorrect type");
        }

        let previousParent: ast.SqlAstNode | undefined = context.parentNode;
        let previousCurrent: ast.SqlAstNode = context.currentNode;

        if (context.currentNode !== node) {
            context.parentNode = context.currentNode;
            context.currentNode = node;
        }

        context = this.doVisitNode(context, node);

        context.parentNode = previousParent;
        context.currentNode = previousCurrent;
        return context;
    }

    protected visitGenericNode(context: QueryContext<TResult>, node: ast.SqlAstNode): QueryContext<TResult> {
        let anyNode: any = node;

        for (let p in anyNode) {
            if (anyNode[p] instanceof ast.SqlAstNode) {
                context = this.visitNode(context, anyNode[p]);
            } else if (Array.isArray(anyNode[p])) {
                for (let elem of anyNode[p]) {
                    if (elem instanceof ast.SqlAstNode) {
                        context = this.visitNode(context, elem);
                    }
                }
            }
        }

        return context;
    }

    private doVisitNode(context: QueryContext<TResult>, node: ast.SqlAstNode): QueryContext<TResult> {
        let nodeType = node.getNodeType();
        let visitorMethod = "visit" + nodeType;
        let visitor: any = this;

        if (visitor[visitorMethod] && typeof visitor[visitorMethod] === "function") {
            return visitor[visitorMethod](context, node);
        }

        return this.visitGenericNode(context, node);
    }
}
