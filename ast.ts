export type Program = Statement[];

export abstract class Statement {
  abstract acknowledge<T>(examiner: StatementExaminer<T>): T;
}

export class ExpressionStatement extends Statement {
  acknowledge<T>(examiner: StatementExaminer<T>): T {
    return examiner.examineExpressionStatement(this);
  }
  constructor(public expression: Expression) {
    super();
  }

  toString(): string {
    return `[express ${this.expression}]`;
  }
}

export class PrintStatement extends Statement {
  acknowledge<T>(examiner: StatementExaminer<T>): T {
    return examiner.examinePrint(this);
  }
  constructor(public expression: Expression) {
    super();
  }
  toString(): string {
    return `[print ${this.expression}]`;
  }
}

export interface StatementExaminer<T> {
  examineExpressionStatement(statement: ExpressionStatement): T;
  examinePrint(statement: PrintStatement): T;
}

export abstract class Expression {
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
  toString(): string {
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
  toString() {
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
  toString() {
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
  toString() {
    return `[literal: ${this.value}]`;
  }
}

export interface ExpressionExaminer<T> {
  examineBinary(expression: Binary): T;
  examineParenthesized(expression: Parenthesized): T;
  examineUnary(expression: Unary): T;
  examineLiteral(expression: Literal): T;
}
