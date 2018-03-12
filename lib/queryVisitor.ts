import * as ast from "./astsql";

export interface QueryContext {
    currentNode: ast.SqlAstNode;
    parentNode?: ast.SqlAstNode;
}

export interface ContextBuilder {
    new (node: ast.SqlAstNode): QueryContext;
}

class GenericQueryContext implements QueryContext {
    public parentNode?: ast.SqlAstNode;
    constructor(public currentNode: ast.SqlAstNode) {
    }
}

export class QueryVisitor<TContext extends QueryContext = QueryContext> {
    public visitStarted: boolean;
    private _contextBuilder: ContextBuilder;

    constructor(public dialect: ast.SqlDialect, public query: ast.SqlRoot, contextBuilder?: ContextBuilder) {
        this.visitStarted = false;
        this._contextBuilder = contextBuilder || GenericQueryContext;

        if (this.dialect !== query.dialect) {
            throw Error("Mismatched query dialects.");
        }
    }

    public visit(): TContext {
        if (this.visitStarted) {
            throw Error("Visit already initiated");
        }

        let context = this.buildContext();
        context = this.visitNode(context, this.query);
        this.visitStarted = true;

        return context;
    }

    // Dispatcher
    protected visitNode(context: TContext, node: ast.SqlAstNode): TContext {
        if (!node || node.constructor.name !== node.getNodeType()) {
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

    protected visitGenericNode(context: TContext, node: ast.SqlAstNode): TContext {
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

    protected buildContext(): TContext {
        return <TContext> new this._contextBuilder(this.query);
    }

    private doVisitNode(context: TContext, node: ast.SqlAstNode): TContext {
        let nodeType = node.getNodeType();
        let visitorMethod = "visit" + nodeType;
        let visitor: any = this;

        if (visitor[visitorMethod] && typeof visitor[visitorMethod] === "function") {
            return visitor[visitorMethod](context, node);
        }

        return this.visitGenericNode(context, node);
    }
}
