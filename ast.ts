export type Program = Declaration[];

export abstract class Declaration {
  abstract acknowledge<T>(examiner: StatementExaminer<T>): T;
}

export class ExpressionStatement extends Declaration {
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

export class PrintStatement extends Declaration {
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

export class VariableDeclaration extends Declaration {
  acknowledge<T>(examiner: StatementExaminer<T>): T {
    return examiner.examineVarDeclaration(this);
  }
  constructor(
    public name: lox.Token,
    public initializer?: Expression,
  ) {
    super();
  }
  toString(): string {
    return `[var-decl ${this.name.lexeme} ${this.initializer}]`;
  }
}

export interface StatementExaminer<T> {
  examineExpressionStatement(statement: ExpressionStatement): T;
  examinePrint(statement: PrintStatement): T;
  examineVarDeclaration(decl: VariableDeclaration): T;
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

export class VariableReference extends Expression {
  acknowledge<T>(examiner: ExpressionExaminer<T>): T {
    return examiner.examineVariableRef(this);
  }
  constructor(public name: lox.Token) {
    super();
  }
  toString() {
    return `[var-ref ${this.name}]`;
  }
}

export class Assignment extends Expression {
  acknowledge<T>(examiner: ExpressionExaminer<T>): T {
    return examiner.examineAssignment(this);
  }
  constructor(
    public name: lox.Token,
    public value: Expression,
  ) {
    super();
  }
  toString() {
    return `[assign ${this.name} ${this.value}]`;
  }
}

export interface ExpressionExaminer<T> {
  examineBinary(expression: Binary): T;
  examineParenthesized(expression: Parenthesized): T;
  examineUnary(expression: Unary): T;
  examineLiteral(expression: Literal): T;
  examineVariableRef(expression: VariableReference): T;
  examineAssignment(expression: Assignment): T;
}
