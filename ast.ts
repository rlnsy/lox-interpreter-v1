export abstract class Expression {
  abstract accept<T>(worker: ExpressionWorker<T>): T;
  // debug display
  abstract display(): string;
  toString() {
    return this.display();
  }
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
  display(): string {
    return `[binary: ${this.operator.lexeme} ${this.left} ${this.right}]`;
  }
}

export class Parenthesized extends Expression {
  accept<T>(worker: ExpressionWorker<T>) {
    return worker.examineParenthesized(this);
  }
  constructor(public expression: Expression) {
    super();
  }
  display() {
    return `[group: ${this.expression}]`;
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
  display() {
    return `[unary: ${this.operator.lexeme} ${this.operand}]`;
  }
}

export class Literal extends Expression {
  accept<T>(worker: ExpressionWorker<T>) {
    return worker.examineLiteral(this);
  }
  constructor(public value: lox.Value) {
    super();
  }
  display() {
    return `[literal: ${this.value}]`;
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
