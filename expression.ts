export abstract class Expression {
  abstract accept<T>(worker: ExpressionWorker<T>): T;
}

export class Binary extends Expression {
  accept<T>(worker: ExpressionWorker<T>) {
    return worker.examineBinary(this);
  }
  constructor(
    public operator: lox.Token,
    public left: Expression,
    public right: Expression,
  ) {
    super();
  }
}

export class Parenthesized extends Expression {
  accept<T>(worker: ExpressionWorker<T>) {
    return worker.examineParenthesized(this);
  }
  constructor(public expression: Expression) {
    super();
  }
}

export class Unary extends Expression {
  accept<T>(worker: ExpressionWorker<T>) {
    return worker.examineUnary(this);
  }
  constructor(
    public operator: lox.Token,
    public operand: Expression,
  ) {
    super();
  }
}

export class Literal extends Expression {
  accept<T>(worker: ExpressionWorker<T>) {
    return worker.examineLiteral(this);
  }
  constructor(public value: unknown) {
    super();
  }
}

export abstract class ExpressionWorker<T> {
  examine(expression: Expression): T {
    return expression.accept(this);
  }
  abstract examineBinary(expression: Binary): T;
  abstract examineParenthesized(expression: Parenthesized): T;
  abstract examineUnary(expression: Unary): T;
  abstract examineLiteral(expression: Literal): T;
}
