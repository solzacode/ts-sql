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

export abstract class QueryVisitor<TContext extends QueryContext = QueryContext> {
    public visitStarted: boolean;
    private _contextBuilder: ContextBuilder;

    constructor(public dialect: ast.SqlDialect, public query: ast.SqlRoot, contextBuilder?: ContextBuilder) {
        this.visitStarted = false;
        this._contextBuilder = contextBuilder || GenericQueryContext;

        if (this.dialect !== query.dialect) {
            throw Error("Mismatched query dialects.");
        }
    }

    // Derived classes must call this to start the visiting process
    protected visit(): TContext {
        if (this.visitStarted) {
            throw Error("Visit already initiated");
        }

        this.visitStarted = true;

        let context = this.buildContext();
        context = this.visitNode(context, this.query);

        return context;
    }

    // Dispatcher
    protected visitNode(context: TContext, node: ast.SqlAstNode): TContext {
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

    // Generic visit method. The visiting process falls back to this if it doesn't find a visit<NodeType> method
    // e.g. visitSelectStatement or visitQueryExpression
    protected visitGenericNode(context: TContext, node: ast.SqlAstNode): TContext {
        let anyNode: any = node;

        for (let p in anyNode) {
            if (this.shouldVisitNode(anyNode[p])) {
                context = this.visitNode(context, anyNode[p]);
            } else if (Array.isArray(anyNode[p])) {
                for (let elem of anyNode[p]) {
                    if (this.shouldVisitNode(elem)) {
                        context = this.visitNode(context, elem);
                    }
                }
            } else {
                // throw Error("Unknown element requested to be visited");
                // console.log(`WARNING: Skipping visiting unknown element ${p}`);
            }
        }

        return context;
    }

    // Context builder
    protected buildContext(): TContext {
        return <TContext> new this._contextBuilder(this.query);
    }

    // Determines whether this object should be visited
    protected shouldVisitNode(node: any): boolean {
        return node && (node instanceof ast.SqlAstNode || node.nodeType);
    }

    // Determines which visit method to call and calls here
    private doVisitNode(context: TContext, node: ast.SqlAstNode): TContext {
        let nodeType = ast.SqlAstNode.getNodeType(node);
        let visitorMethod = "visit" + nodeType;
        let visitor: any = this;

        if (visitor[visitorMethod] && typeof visitor[visitorMethod] === "function") {
            return visitor[visitorMethod](context, node);
        }

        return this.visitGenericNode(context, node);
    }
}
