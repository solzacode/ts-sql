import { AstSymbol } from "jsymbol";
import "reflect-metadata";

export type SqlDialect = "MySQL" | "Custom";    // Future support: "ANSI-SQL" | "T-SQL" | "PL-SQL"
export type SelectAll = "*";
export type NotOperator = "NOT" | "!";
export type UnaryOperator = NotOperator | "~" | "+" | "-";
export type ComparisonOperator = "=" | ">" | "<" | ">=" | "<=" | "!=" | "<=>";
export type LogicalOperator = "AND" | "OR" | "XOR" | "&&" | "||";
export type BitOperator = "<<" | ">>" | "&" | "|" | "^";
export type MathOperator = "*" | "/" | "DIV" | "MOD" | "%" | "+" | "-";
export type NullLiteral = "NULL" | "NOT NULL";
export type ConstantType = string | number | boolean | NullLiteral;
export type BinaryOperator = ComparisonOperator | LogicalOperator | BitOperator | MathOperator;
export type SortType = "ASC" | "DESC";
export type All = "ALL";
export type Distinct = "DISTINCT";
export type SelectSpec = All | Distinct | "DISTINCTROW" | "HIGH_PRIORITY" | "STRAIGHT_JOIN"
    | "SQL_SMALL_RESULT" | "SQL_BIG_RESULT" | "SQL_BUFFER_RESULT" | "SQL_CACHE" | "SQL_NO_CACHE" | "SQL_CALC_FOUND_ROWS";
export type LockClause = "FOR UPDATE" | "LOCK IN SHARE MODE";
export type Quantifier = "ALL" | "SOME" | "ANY";
export type IntervalTypeBase = "QUARTER" | "MONTH" | "DAY" | "HOUR" | "MINUTE" | "WEEK" | "SECOND" | "MICROSECOND";
export type IntervalType =
    IntervalTypeBase
    | "YEAR"
    | "YEAR_MONTH"
    | "DAY_HOUR"
    | "DAY_MINUTE"
    | "DAY_SECOND"
    | "HOUR_MINUTE"
    | "HOUR_SECOND"
    | "MINUTE_SECOND"
    | "SECOND_MICROSECOND"
    | "MINUTE_MICROSECOND"
    | "HOUR_MICROSECOND"
    | "DAY_MICROSECOND";
export type JoinType = "INNER" | "CROSS" | "LEFT OUTER" | "RIGHT OUTER";  // Natural & straight joins not supported
export enum SqlSymbolType {
    Table,
    Field,
    Variable,
    Alias,
    Function
}
export enum SqlNodeType {
    Undefined,
    NotImplemented,
    SqlRoot,
    SelectStatement,
    QueryExpression,
    QueryIntoExpression,
    UnionGroupStatement,
    UnionStatement,
    AllColumns,
    ColumnName,
    SimpleFunctionCall,
    CaseExpression,
    CaseBranchExpression,
    Constant,
    AliasedTerm,
    AssignedTerm,
    NotExpression,
    BinaryExpression,
    TruthyPredicate,
    InPredicate,
    IsNullNotNullPredicate,
    BinaryPredicate,
    QuantifiedSelectStatement,
    BetweenPredicate,
    SoundsLikePredicate,
    LikePredicate,
    AssignedExpressionAtom,
    Variable,
    UnaryExpressionAtom,
    BinaryModifiedExpression,
    RowExpression,
    IntervalExpression,
    BinaryExpressionAtom,
    NestedSelectStatement,
    ExistsSelectStatement,
    FromClause,
    TableSource,
    TableSpec,
    WhereClause,
    GroupByClause,
    GroupByItem,
    JoinClause,
    OrderByClause,
    OrderByExpression,
    LimitClause,
    SelectIntoFieldsExpression
}
export const NodeTypeKey = Symbol("SqlAst:NodeType");
export const SqlNodeMarker = function(nodeType: SqlNodeType) {
    return function<TNode extends new(...args: any[]) => SqlAstNode>(constructor: TNode) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);

                if (!(this instanceof SqlAstNode)) {
                    throw Error("Invalid node type found");
                }

                Reflect.defineMetadata(NodeTypeKey, nodeType, this);
            }
        };
    };
};
export function getSqlNodeType(node: SqlAstNode) {
    let type = Reflect.getMetadata(NodeTypeKey, node);
    return SqlNodeType[type];
}

export type SqlSymbol<T = {}> = string | AstSymbol<T>;

export abstract class SqlAstNode {
    getNodeType(): string {
        return getSqlNodeType(this);
    }
}

@SqlNodeMarker(SqlNodeType.NotImplemented)
export class NotImplemented extends SqlAstNode {
    // Represents a non implemented feature
}

@SqlNodeMarker(SqlNodeType.SqlRoot)
export class SqlRoot extends SqlAstNode {
    constructor(public dialect: string, public statements: SqlStatement[] = []) {
        super();
    }
}

export type SqlStatement =
    DdlStatement
    | DmlStatement
    | TransactionStatement
    | ReplicationStatement
    | PreparedStatement
    | AdministrationStatement
    | UtilityStatement;

// SQL statements
export type DdlStatement = NotImplemented;
export type TransactionStatement = NotImplemented;
export type ReplicationStatement = NotImplemented;
export type PreparedStatement = NotImplemented;
export type AdministrationStatement = NotImplemented;
export type UtilityStatement = NotImplemented;

// DML Statements
export type DmlStatement =
    SelectStatement
    | InsertStatement
    | UpdateStatement
    | DeleteStatement
    | ReplaceStatement
    | CallStatement
    | LoadDataStatement
    | LoadXmlStatement
    | DoStatement
    | HandlerStatement;

export type InsertStatement = NotImplemented;
export type UpdateStatement = NotImplemented;
export type DeleteStatement = NotImplemented;
export type ReplaceStatement = NotImplemented;
export type CallStatement = NotImplemented;
export type LoadDataStatement = NotImplemented;
export type LoadXmlStatement = NotImplemented;
export type DoStatement = NotImplemented;
export type HandlerStatement = NotImplemented;

@SqlNodeMarker(SqlNodeType.SelectStatement)
export class SelectStatement extends SqlAstNode {
    query: QueryIntoExpression | UnionGroupStatement;
    lock?: LockClause;

    constructor(query: QueryIntoExpression | UnionGroupStatement) {
        super();

        this.query = query;
    }
}

@SqlNodeMarker(SqlNodeType.QueryExpression)
export class QueryExpression extends SqlAstNode {
    selectSpec?: SelectSpec[];
    selectAll?: SelectAll;          // If all is specified, then elements could be an empty array
    elements: SelectElement[];
    from?: FromClause;
    orderBy?: OrderByClause;
    limit?: LimitClause;

    constructor(elements: SelectElement[] = []) {
        super();

        this.elements = elements;
    }
}

@SqlNodeMarker(SqlNodeType.QueryIntoExpression)
export class QueryIntoExpression extends SqlAstNode {
    query: QueryExpression;
    into?: SelectIntoExpression;

    constructor(query: QueryExpression) {
        super();

        this.query = query;
    }
}

@SqlNodeMarker(SqlNodeType.UnionStatement)
export class UnionStatement extends SqlAstNode {
    first: QueryExpression;
    unionType?: All | Distinct;
    second: QueryExpression | UnionStatement;

    constructor(first: QueryExpression, second: QueryExpression | UnionStatement, unionType: All | Distinct = "ALL") {
        super();

        this.first = first;
        this.second = second;
        this.unionType = unionType;
    }
}

@SqlNodeMarker(SqlNodeType.UnionGroupStatement)
export class UnionGroupStatement extends SqlAstNode {
    unionType?: All | Distinct;
    unionLast?: QueryIntoExpression;
    orderBy?: OrderByClause;
    limit?: LimitClause;

    constructor(public union: UnionStatement) {
        super();
    }
}

export type SelectElement =
    AllColumns
    | AliasedTerm<ColumnName>
    | AliasedTerm<FunctionCall>
    | AliasedTerm<AssignedTerm<Expression>>;

// Represents table.*
@SqlNodeMarker(SqlNodeType.AllColumns)
export class AllColumns extends SqlAstNode {
    constructor(public table: SqlSymbol) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.ColumnName)
export class ColumnName extends SqlAstNode {
    constructor(public name: SqlSymbol, public table?: SqlSymbol) {
        super();
    }
}

export type FunctionCall =
    SpecificFunction
    | AggregatedWindowFunction
    | SimpleFunctionCall        // Handles built in functions as well as user defined functions
    | PasswordFunction;

export type SpecificFunction = CaseExpression | NotImplemented;
export type AggregatedWindowFunction = NotImplemented;
export type PasswordFunction = NotImplemented;

@SqlNodeMarker(SqlNodeType.SimpleFunctionCall)
export class SimpleFunctionCall extends SqlAstNode {
    constructor(public name: SqlSymbol, public args?: FunctionArgument[]) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.CaseExpression)
export class CaseExpression extends SqlAstNode {
    branches: CaseBranchExpression[];
    elseBranch?: FunctionArgument;

    constructor(public expression?: Expression) {
        super();

        this.branches = [];
    }
}

@SqlNodeMarker(SqlNodeType.CaseBranchExpression)
export class CaseBranchExpression extends SqlAstNode {
    constructor(public expression: FunctionArgument, public result: FunctionArgument) {
        super();
    }
}

export type FunctionArgument =
    Constant
    | ColumnName
    | FunctionCall
    | Expression;

@SqlNodeMarker(SqlNodeType.Constant)
export class Constant extends SqlAstNode {
    constructor(public value: ConstantType) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.AliasedTerm)
export class AliasedTerm<TTerm extends SqlAstNode> extends SqlAstNode {
    constructor(public term: TTerm, public alias?: SqlSymbol) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.AssignedTerm)
export class AssignedTerm<TTerm extends SqlAstNode> extends SqlAstNode {
    constructor(public value: TTerm, public variable?: SqlSymbol) {
        super();
    }
}

export type Expression =
    NotExpression
    | BinaryExpression<LogicalOperator>
    | TruthyPredicate
    | Predicate;

@SqlNodeMarker(SqlNodeType.NotExpression)
export class NotExpression extends SqlAstNode {
    constructor(public expression: Expression) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.BinaryExpression)
export class BinaryExpression<TOperator extends BinaryOperator> extends SqlAstNode {
    constructor(public left: Expression, public operator: TOperator, public right: Expression) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.TruthyPredicate)
export class TruthyPredicate extends SqlAstNode {
    // predicate IS TRUE | predicate IS FALSE | predicate IS UNKNOWN
    // testValue?: boolean;    // TRUE | FALSE | UNKNOWN
    constructor(public predicate: Predicate, public negate: boolean = false, public testValue?: boolean) {
        super();
    }
}

export type Predicate =
    InPredicate
    | IsNullNotNullPredicate
    | BinaryPredicate
    | BetweenPredicate
    | SoundsLikePredicate
    | LikePredicate
    | RegexPredicate
    | AssignedExpressionAtom;

@SqlNodeMarker(SqlNodeType.InPredicate)
export class InPredicate extends SqlAstNode {
    // negate: boolean;    // Default to false
    constructor(public predicate: Predicate, public target: SelectStatement | Expression[], public negate: boolean = false) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.IsNullNotNullPredicate)
export class IsNullNotNullPredicate extends SqlAstNode {
    constructor(public predicate: Predicate, public checkWith: NullLiteral) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.BinaryPredicate)
export class BinaryPredicate extends SqlAstNode {
    constructor(public left: Predicate, public operator: ComparisonOperator, public right: Predicate | QuantifiedSelectStatement) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.QuantifiedSelectStatement)
export class QuantifiedSelectStatement extends SqlAstNode {
    constructor(public quantifier: Quantifier, public statement: SelectStatement) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.BetweenPredicate)
export class BetweenPredicate extends SqlAstNode {
    constructor(public operand: Predicate, public left: Predicate, public right: Predicate, public negate: boolean = false) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.SoundsLikePredicate)
export class SoundsLikePredicate extends SqlAstNode {
    constructor(public left: Predicate, public right: Predicate) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.LikePredicate)
export class LikePredicate extends SqlAstNode {
    constructor(public left: Predicate, public right: Predicate, public negate: boolean = false) {
        super();
    }
}

export type RegexPredicate = NotImplemented;

@SqlNodeMarker(SqlNodeType.AssignedExpressionAtom)
export class AssignedExpressionAtom extends SqlAstNode {
    constructor(public expression: ExpressionAtom, public variable?: SqlSymbol) {
        super();
    }
}

/*--------------------
    expressionAtom
        : constant                                                      #constantExpressionAtom
        | fullColumnName                                                #fullColumnNameExpressionAtom
        | functionCall                                                  #functionCallExpressionAtom
        | expressionAtom COLLATE collationName                          #collateExpressionAtom
        | mysqlVariable                                                 #mysqlVariableExpressionAtom
        | unaryOperator expressionAtom                                  #unaryExpressionAtom
        | BINARY expressionAtom                                         #binaryExpressionAtom
        | '(' expression (',' expression)* ')'                          #nestedExpressionAtom
        | ROW '(' expression (',' expression)+ ')'                      #nestedRowExpressionAtom
        | EXISTS '(' selectStatement ')'                                #existsExpressionAtom
        | '(' selectStatement ')'                                       #subQueryExpressionAtom
        | INTERVAL expression intervalType                              #intervalExpressionAtom
        | left=expressionAtom bitOperator right=expressionAtom          #bitExpressionAtom
        | left=expressionAtom mathOperator right=expressionAtom         #mathExpressionAtom
        ;
-----------------------*/
export type ExpressionAtom =
    Constant
    | ColumnName
    | FunctionCall
    | CollatedExpression
    | Variable
    | UnaryExpressionAtom
    | BinaryModifiedExpression
    | Expression[]
    | RowExpression
    | ExistsSelectStatement
    | NestedSelectStatement
    | BinaryExpressionAtom<BitOperator | MathOperator>;

export type CollatedExpression = NotImplemented;

@SqlNodeMarker(SqlNodeType.Variable)
export class Variable extends SqlAstNode {
    constructor(public name: SqlSymbol) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.UnaryExpressionAtom)
export class UnaryExpressionAtom extends SqlAstNode {
    constructor(public operator: UnaryOperator, public expression: ExpressionAtom) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.BinaryModifiedExpression)
export class BinaryModifiedExpression extends SqlAstNode {
    constructor(public expression: ExpressionAtom) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.RowExpression)
export class RowExpression extends SqlAstNode {
    constructor(public expressions: Expression[]) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.IntervalExpression)
export class IntervalExpression extends SqlAstNode {
    constructor(public expression: Expression, public intervalType: IntervalType) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.BinaryExpressionAtom)
export class BinaryExpressionAtom<TOperator extends BinaryOperator> extends SqlAstNode {
    constructor(public left: ExpressionAtom, public operator: TOperator, public right: ExpressionAtom) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.NestedSelectStatement)
export class NestedSelectStatement extends SqlAstNode {
    constructor(public statement: SelectStatement) {
        super();
    }
}

// TODO: To be filled out
@SqlNodeMarker(SqlNodeType.ExistsSelectStatement)
export class ExistsSelectStatement extends SqlAstNode {
    constructor(public statement: SelectStatement) {
        super();
    }
}

export type SelectIntoExpression = SelectIntoFieldsExpression | SelectIntoDumpFileExpression | SelectIntoOutFileExpression;
export type SelectIntoDumpFileExpression = NotImplemented;
export type SelectIntoOutFileExpression = NotImplemented;

@SqlNodeMarker(SqlNodeType.FromClause)
export class FromClause extends SqlAstNode {
    where?: WhereClause;
    groupBy?: GroupByClause;
    having?: Expression;

    constructor(public tables: TableSource[]) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.TableSource)
export class TableSource extends SqlAstNode {
    joins?: JoinClause[];

    constructor(public tableSourceItem: TableSourceItem) {
        super();
    }
}

export type TableSourceItem = AliasedTerm<TableSpec> | AliasedTerm<NestedSelectStatement> | TableSource[];

@SqlNodeMarker(SqlNodeType.TableSpec)
export class TableSpec extends SqlAstNode {
    partitions?: SqlSymbol[]; // List of partition terms
    indexHints?: IndexHint[];

    constructor(public tableName: SqlSymbol) {
        super();
    }
}

export type IndexHint = NotImplemented;

@SqlNodeMarker(SqlNodeType.WhereClause)
export class WhereClause extends SqlAstNode {
    constructor(public expression: Expression) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.GroupByClause)
export class GroupByClause extends SqlAstNode {
    constructor(public items: GroupByItem[], public rollup: boolean = false) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.GroupByItem)
export class GroupByItem extends SqlAstNode {
    // descending: ASC | DESC
    constructor(public expression: Expression, public descending: boolean = false) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.JoinClause)
export class JoinClause extends SqlAstNode {
    joinType?: JoinType;
    on?: Expression;
    using?: SqlSymbol[];       // Using a list of column names within the scope of the tables

    constructor(public joinWith: TableSourceItem) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.OrderByClause)
export class OrderByClause extends SqlAstNode {
    constructor(public expressions: OrderByExpression[]) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.OrderByExpression)
export class OrderByExpression extends SqlAstNode {
    constructor(public expression: Expression, public descending: boolean = false) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.LimitClause)
export class LimitClause extends SqlAstNode {
    constructor(public limit: number, public offset?: number) {
        super();
    }
}

@SqlNodeMarker(SqlNodeType.SelectIntoFieldsExpression)
export class SelectIntoFieldsExpression extends SqlAstNode {
    constructor(public fields: SqlSymbol[]) {
        super();
    }
}
