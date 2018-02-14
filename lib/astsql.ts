// Acknowledgements:
// 1. Grammar referenced from https://github.com/antlr/grammars-v4/tree/master/mysql
// 2. Project inspired from https://github.com/exjs/xql

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

export interface SqlAstNode {
    nodeType: string;
}

export interface NotImplemented extends SqlAstNode {
    // Represents a non implemented feature
}

export interface SqlRoot extends SqlAstNode {
    dialect: SqlDialect;
    statements: SqlStatement[];
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

export interface SelectStatement extends SqlAstNode {
    query: QueryIntoExpression | UnionGroupStatement;
    lock?: LockClause;
}

export interface QueryExpression extends SqlAstNode {
    selectSpec?: SelectSpec[];
    selectAll?: SelectAll;          // If all is specified, then elements could be an empty array
    elements: SelectElement[];
    from?: FromClause;
    orderBy?: OrderByClause;
    limit?: LimitClause;
}

export interface QueryIntoExpression extends SqlAstNode {
    query: QueryExpression;
    into?: SelectIntoExpression;
}

export interface UnionGroupStatement extends SqlAstNode {
    union: UnionStatement;
    unionType?: All | Distinct;
    unionLast?: QueryIntoExpression;
    orderBy?: OrderByClause;
    limit?: LimitClause;
}

export interface UnionStatement extends SqlAstNode {
    first: QueryExpression;
    unionType?: All | Distinct;
    second: QueryExpression | UnionStatement;
}

export type SelectElement =
    AllColumns
    | AliasedTerm<ColumnName>
    | AliasedTerm<FunctionCall>
    | AliasedTerm<AssignedTerm<Expression>>;

export interface AllColumns extends SqlAstNode {
    // table.*
    table: string;
}

export interface ColumnName extends SqlAstNode {
    name: string;
    table?: string;
}

export type FunctionCall =
    SpecificFunction
    | AggregatedWindowFunction
    | SimpleFunctionCall        // Handles built in functions as well as user defined functions
    | PasswordFunction;

export type SpecificFunction = CaseExpression | NotImplemented;
export type AggregatedWindowFunction = NotImplemented;
export type PasswordFunction = NotImplemented;

export interface SimpleFunctionCall extends SqlAstNode {
    name: string;
    arguments?: FunctionArgument[];
}

export interface CaseExpression extends SqlAstNode {
    argument: Expression;
    branches: CaseBranchExpression[];
    elseBranch: FunctionArgument;
}

export interface CaseBranchExpression extends SqlAstNode {
    expression: FunctionArgument;
    result: FunctionArgument;
}

export type FunctionArgument =
    Constant
    | ColumnName
    | FunctionCall
    | Expression;

export interface Constant extends SqlAstNode {
    value: ConstantType;
}

export interface AliasedTerm<TTerm> extends SqlAstNode {
    term: TTerm;
    alias?: string;
}

export interface AssignedTerm<TTerm> extends SqlAstNode {
    variable?: string;
    value: TTerm;
}

export type Expression =
    NotExpression
    | BinaryExpression<LogicalOperator>
    | TruthyPredicate
    | Predicate;

export interface NotExpression extends SqlAstNode {
    expression: Expression;
}

export interface BinaryExpression<TOperator extends BinaryOperator> extends SqlAstNode {
    left: Expression;
    operator: TOperator;
    right: Expression;
}

export interface TruthyPredicate extends SqlAstNode {
    // predicate IS TRUE | predicate IS FALSE | predicate IS UNKNOWN
    negate?: boolean;
    testValue?: boolean;    // TRUE | FALSE | UNKNOWN
    predicate: Predicate;
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

export interface InPredicate extends SqlAstNode {
    negate: boolean;    // Default to false
    predicate: Predicate;
    target: SelectStatement | Expression[];
}

export interface IsNullNotNullPredicate extends SqlAstNode {
    checkWith: NullLiteral;
    predicate: Predicate;
}

export interface BinaryPredicate extends SqlAstNode {
    left: Predicate;
    operator: ComparisonOperator;
    right: Predicate | QuantifiedSelectStatement;
}

export interface QuantifiedSelectStatement extends SqlAstNode {
    quantifier: Quantifier;
    statement: SelectStatement;
}

export interface BetweenPredicate extends SqlAstNode {
    negate: boolean;
    left: Predicate;
    right: Predicate;
}

export interface SoundsLikePredicate extends SqlAstNode {
    left: Predicate;
    right: Predicate;
}

export interface LikePredicate extends SqlAstNode {
    negate: boolean;
    left: Predicate;
    right: Predicate;
}

export type RegexPredicate = NotImplemented;

export interface AssignedExpressionAtom extends SqlAstNode {
    variable?: string;
    expression: ExpressionAtom;
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

export interface Variable extends SqlAstNode {
    name: string;
}

export interface UnaryExpressionAtom extends SqlAstNode {
    operator: UnaryOperator;
    expression: ExpressionAtom;
}

export interface BinaryModifiedExpression extends SqlAstNode {
    expression: ExpressionAtom;
}

export interface RowExpression extends SqlAstNode {
    expressions: Expression[];
}

export interface IntervalExpression extends SqlAstNode {
    expression: Expression;
    intervalType: IntervalType;
}

export interface BinaryExpressionAtom<TOperator extends BinaryOperator> {
    left: ExpressionAtom;
    operator: TOperator;
    right: ExpressionAtom;
}

export interface NestedSelectStatement extends SqlAstNode {
    statement: SelectStatement;
}

// TODO: To be filled out
export interface ExistsSelectStatement extends NestedSelectStatement {
}

export type SelectIntoExpression = SelectIntoFieldsExpression | SelectIntoDumpFileExpression | SelectIntoOutFileExpression;
export type SelectIntoDumpFileExpression = NotImplemented;
export type SelectIntoOutFileExpression = NotImplemented;

export interface FromClause extends SqlAstNode {
    tables: TableSource[];
    where?: WhereClause;
    groupBy?: GroupByClause;
    having?: Expression;
}

export interface TableSource extends SqlAstNode {
    tableSourceItem: TableSourceItem;
    joins?: JoinClause[];
}

export type TableSourceItem = AliasedTerm<TableSpec> | AliasedTerm<NestedSelectStatement> | TableSource[];

export interface TableSpec extends SqlAstNode {
    tableName: string;
    partitions?: string[]; // List of partition terms
    indexHints?: IndexHint[];
}

export type IndexHint = NotImplemented;

export interface WhereClause extends SqlAstNode {
    expression: Expression;
}

export interface GroupByClause extends SqlAstNode {
    items: GroupByItem[];
    rollup: boolean;
}

export interface GroupByItem extends SqlAstNode {
    expression: Expression;
    descending: boolean;             // ASC | DESC
}

export interface JoinClause extends SqlAstNode {
    joinType?: JoinType;
    with: TableSourceItem;
    on?: Expression;
    using?: string[];       // Using a list of column names within the scope of the tables
}

export interface OrderByClause extends SqlAstNode {
    expressions: OrderByExpression[];
}

export interface OrderByExpression extends SqlAstNode {
    expression: Expression;
    ascending: boolean;
}

export interface LimitClause extends SqlAstNode {
    offset: number;
    limit: number;
}

export interface SelectIntoFieldsExpression extends SqlAstNode {
    fields: string[];
}
