import {
  Expression,
  ExpressionWorker,
  Binary,
  Unary,
  Parenthesized,
  Literal,
} from "./expression";

export class ASTPrinter extends ExpressionWorker<string> {
  print(expression: Expression): string {
    return this.examine(expression);
  }
  examineUnary(expression: Unary): string {
    return `(${expression.operator.lexeme} ${this.print(expression.operand)})`;
  }
  examineBinary(expression: Binary): string {
    return `(${expression.operator.lexeme} ${this.print(
      expression.left,
    )} ${this.print(expression.right)})`;
  }
  examineLiteral(expression: Literal): string {
    return `${expression.value}`;
  }
  examineParenthesized(expression: Parenthesized): string {
    return `(${this.print(expression.expression)})`;
  }
}
