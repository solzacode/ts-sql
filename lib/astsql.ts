// Acknowledgements:
// 1. Grammar referenced from https://github.com/antlr/grammars-v4/tree/master/mysql
// 2. Project inspired from https://github.com/exjs/xql

type SelectAll = "*";
type NotOperator = "NOT" | "!";
type UnaryOperator = NotOperator | "~" | "+" | "-";
type ComparisonOperator = "=" | ">" | "<" | ">=" | "<=" | "!=" | "<=>";
type LogicalOperator = "AND" | "OR" | "XOR" | "&&" | "||";
type BitOperator = "<<" | ">>" | "&" | "|" | "^";
type MathOperator = "*" | "/" | "DIV" | "MOD" | "%" | "+" | "-";
type NullLiteral = "NULL" | "NOT NULL";
type ConstantType = string | number | boolean | NullLiteral;
type BinaryOperator = ComparisonOperator | LogicalOperator | BitOperator | MathOperator;
type SortType = "ASC" | "DESC";
type All = "ALL";
type Distinct = "DISTINCT";
type SelectSpec = All | Distinct | "DISTINCTROW" | "HIGH_PRIORITY" | "STRAIGHT_JOIN"
    | "SQL_SMALL_RESULT" | "SQL_BIG_RESULT" | "SQL_BUFFER_RESULT" | "SQL_CACHE" | "SQL_NO_CACHE" | "SQL_CALC_FOUND_ROWS";

interface SqlAstNode {
    nodeType: string;
}

interface NotImplemented extends SqlAstNode {
    // Represents a non implemented feature
}

interface SqlRoot extends SqlAstNode {
    statements: SqlStatement[];
}

type SqlStatement =
    DdlStatement
    | DmlStatement
    | TransactionStatement
    | ReplicationStatement
    | PreparedStatement
    | AdministrationStatement
    | UtilityStatement;

// SQL statements
type DmlStatement =
    SelectStatement
    | NotImplemented;

type DdlStatement = NotImplemented;
type TransactionStatement = NotImplemented;
type ReplicationStatement = NotImplemented;
type PreparedStatement = NotImplemented;
type AdministrationStatement = NotImplemented;
type UtilityStatement = NotImplemented;

// DML Statements
type InsertStatement = NotImplemented;
type UpdateStatement = NotImplemented;
type DeleteStatement = NotImplemented;
type ReplaceStatement = NotImplemented;
type CallStatement = NotImplemented;
type LoadDataStatement = NotImplemented;
type LoadXmlStatement = NotImplemented;
type DoStatement = NotImplemented;
type HandlerStatement = NotImplemented;

interface SelectStatement extends SqlAstNode {
    selectSpec?: SelectSpec[];
    selectAll?: SelectAll;
    elements: SelectElement[];
    selectInto?: SelectIntoExpression;
    from?: From;
    orderBy?: OrderBy;
    limit?: Limit;
    unionWith?: SelectStatement[];
}

type SelectElement =
    AllColumns
    | AliasedTerm<ColumnName>
    | AliasedTerm<FunctionCall>
    | AliasedTerm<AssignedTerm<Expression>>;

interface AllColumns extends SqlAstNode {
    // table.*
    table: string;
}

interface ColumnName extends SqlAstNode {
    name: string;
    table?: string;
}

type FunctionCall =
    SpecificFunction
    | AggregatedWindowFunction
    | SimpleFunctionCall
    | CaseExpression;

type SpecificFunction = NotImplemented;
type AggregatedWindowFunction = NotImplemented;

interface SimpleFunctionCall extends SqlAstNode {
    name: string;
    arguments?: FunctionArgument[];
}

interface CaseExpression extends SqlAstNode {
    argument: Expression;
    branches: CaseBranchExpression[];
    elseBranch: FunctionArgument;
}

interface CaseBranchExpression extends SqlAstNode {
    expression: FunctionArgument;
    result: FunctionArgument;
}

type FunctionArgument =
    Constant
    | ColumnName
    | FunctionCall
    | Expression;

interface Constant extends SqlAstNode {
    value: ConstantType;
}

type Expression =
    NotExpression
    | BinaryExpression<LogicalOperator>
    | TruthyPredicate
    | Predicate;

interface NotExpression extends SqlAstNode {
    expression: Expression;
}

interface BinaryExpression<TOperator extends BinaryOperator> extends SqlAstNode {
    left: Expression;
    operator: TOperator;
    right: Expression;
}

interface TruthyPredicate extends SqlAstNode {
    // predicate IS TRUE | predicate IS FALSE | predicate IS UNKNOWN
    negate?: boolean;
    testValue?: boolean;    // TRUE | FALSE | UNKNOWN
    predicate: Predicate;
}

type Predicate =
    InPredicate
    | NullCheckPredicate
    | BinaryPredicate
    | BetweenPredicate
    | LikePredicate
    | AssignedExpressionAtom;

interface InPredicate extends SqlAstNode {
    negate: boolean;    // Default to false
    value: Predicate;
    targetSet: SelectStatement | Expression[];
}

interface NullCheckPredicate extends SqlAstNode {
    isNull: boolean;
    expression: Predicate;
}

type ExpressionAtom =
    Constant
    | ColumnName
    | FunctionCall
    | UnaryExpressionAtom<UnaryOperator>
    | Expression[]
    | ExistsSelectStatement
    | NestedSelectStatement
    | BinaryExpressionAtom<BitOperator>
    | BinaryExpressionAtom<MathOperator>;

interface UnaryExpressionAtom<TOperator extends UnaryOperator> {
    operator: TOperator;
    expressionAtom: ExpressionAtom;
}

interface BinaryExpressionAtom<TOperator extends BinaryOperator> {
    left: ExpressionAtom;
    operator: TOperator;
    right: ExpressionAtom;
}

interface AssignedTerm<TTerm> extends SqlAstNode {
    variable?: string;
    value: TTerm;
}

interface AliasedTerm<TTerm> extends SqlAstNode {
    term: TTerm;
    alias?: string;
}

interface AssignedExpressionAtom extends SqlAstNode {
    variable?: string;
    value: ExpressionAtom;
}

interface BinaryPredicate extends SqlAstNode {
    left: Predicate;
    operator: ComparisonOperator;
    right: Predicate | NestedSelectStatement;
}

interface BetweenPredicate extends SqlAstNode {
    negate: boolean;
    left: Predicate;
    right: Predicate;
}

interface LikePredicate extends SqlAstNode {
    negate: boolean;
    left: Predicate;
    right: Predicate;
}

interface NestedSelectStatement extends SqlAstNode {
    statement: SelectStatement;
}

// TODO: To be filled out
interface ExistsSelectStatement extends NestedSelectStatement {
}

type SelectIntoExpression = NotImplemented;

interface From extends SqlAstNode {
}

interface OrderBy extends SqlAstNode {
}

interface Limit extends SqlAstNode {
}
