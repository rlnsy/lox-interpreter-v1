abstract class ASTNode {
  // debug display
  abstract display(): string;
  toString() {
    return this.display();
  }
}

export type Program = Expression;

export abstract class Expression extends ASTNode {
  abstract acknowledge<T>(examiner: ExpressionExaminer<T>): T;
}

export class Binary extends Expression {
  acknowledge<T>(examiner: ExpressionExaminer<T>) {
    return examiner.examineBinary(this);
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
  acknowledge<T>(examiner: ExpressionExaminer<T>) {
    return examiner.examineParenthesized(this);
  }
  constructor(public expression: Expression) {
    super();
  }
  display() {
    return `[group: ${this.expression}]`;
  }
}

export class Unary extends Expression {
  acknowledge<T>(examiner: ExpressionExaminer<T>) {
    return examiner.examineUnary(this);
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
  acknowledge<T>(examiner: ExpressionExaminer<T>) {
    return examiner.examineLiteral(this);
  }
  constructor(public value: lox.Value) {
    super();
  }
  display() {
    return `[literal: ${this.value}]`;
  }
}

export abstract class ExpressionExaminer<T> {
  examine(expr: Expression): T {
    return expr.acknowledge(this);
  }
  abstract examineBinary(expression: Binary): T;
  abstract examineParenthesized(expression: Parenthesized): T;
  abstract examineUnary(expression: Unary): T;
  abstract examineLiteral(expression: Literal): T;
}
