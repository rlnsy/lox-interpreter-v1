import {
  Binary,
  Program,
  Literal,
  Parenthesized,
  Unary,
  ExpressionExaminer,
  Expression,
  DeclarationExaminer,
  ExpressionStatement,
  PrintStatement,
  VariableReference,
  Declaration,
  VariableDeclaration,
  Assignment,
  Block,
} from "./ast";
import { stringify } from "./stringify";

function isNumber(value: LoxValue): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isString(value: LoxValue): value is string {
  return typeof value === "string";
}

export class EvaluationRuntimeError extends Error {
  constructor(public error: LoxError) {
    super();
  }
}

function checkNumber(
  value: LoxValue,
  errorLabel: string,
  errorLocation: LoxLocation,
): asserts value is number {
  if (!isNumber(value)) {
    throw new EvaluationRuntimeError({
      message: `${errorLabel} is not a number`,
      location: errorLocation,
    });
  }
}

/**
 * Assign type-like name to each category of lox value
 * based on the internal representation
 */
function loxTypeOf(value: LoxValue) {
  if (value === null) return "nil";
  if (typeof value === "boolean") return `${value}`;
  return typeof value; // string or number
}

const unreachable: LoxValue =
  "Look at you, sneaky weasel. You reached some unreachable code!";

export class Environment {
  env = new Map<string, LoxValue>();
  constructor(private outer?: Environment) {}
  initialize(name: string, value: LoxValue): void {
    this.env.set(name, value);
  }
  reassign(name: string, value: LoxValue) {
    if (this.outer && this.outer.isDefined(name)) {
      this.outer.reassign(name, value);
    } else {
      this.env.set(name, value);
    }
  }
  getValue(name: string): LoxValue | undefined {
    if (!this.env.has(name) && this.outer !== undefined) {
      console.log("looking up in outer");
      return this.outer.getValue(name);
    }
    return this.env.get(name);
  }
  isDefined(name: string): boolean {
    return (
      this.env.has(name) ||
      (this.outer !== undefined && this.outer.isDefined(name))
    );
  }
}

class Evaluator
  implements ExpressionExaminer<LoxValue>, DeclarationExaminer<void>
{
  constructor(
    private error: LoxErrorHandler,
    private env: Environment,
  ) {}
  execute(p: Program): void {
    try {
      p.forEach((decl) => {
        this.executeDeclaration(decl);
      });
    } catch (error) {
      if (error instanceof EvaluationRuntimeError) {
        this.error({
          message: error.error.message,
          location: error.error.location,
        });
      } else {
        throw error;
      }
    }
  }
  executeDeclaration(d: Declaration) {
    d.acknowledge(this);
  }
  evaluateExpression(expr: Expression): LoxValue {
    return expr.acknowledge(this);
  }
  examineExpressionStatement(statement: ExpressionStatement) {
    this.evaluateExpression(statement.expression);
  }
  examinePrint(statement: PrintStatement) {
    const value = this.evaluateExpression(statement.expression);
    Bun.write(Bun.stdout, stringify(value) + "\n");
  }
  examineLiteral(expression: Literal) {
    return expression.value;
  }
  examineUnary({ operator: op, operand: operandExpr }: Unary): LoxValue {
    const operand = this.evaluateExpression(operandExpr);
    if (op.type === "MINUS") {
      if (!isNumber(operand)) {
        throw new EvaluationRuntimeError({
          message: "cannot negate non number value",
          location: op.start,
        });
      }
      return -operand;
    } else if (op.type === "BANG") {
      return operand === null || operand == false;
    }
    return unreachable;
  }
  examineParenthesized(expression: Parenthesized): LoxValue {
    return this.evaluateExpression(expression.expression);
  }
  examineBinary(expression: Binary): LoxValue {
    const left = this.evaluateExpression(expression.left);
    const right = this.evaluateExpression(expression.right);
    const op = expression.operator;
    if (op.type === "PLUS") {
      if (isNumber(left) && isNumber(right)) {
        return left + right;
      } else if (isString(left) && isString(right)) {
        return `${left}${right}`;
      }
      throw new EvaluationRuntimeError({
        message: `cannot add ${loxTypeOf(left)} and ${loxTypeOf(right)}`,
        location: op.start,
      });
    } else if (op.type === "MINUS") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      return left - right;
    } else if (op.type === "SLASH") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      if (right === 0)
        throw new EvaluationRuntimeError({
          message: "divide by zero",
          location: op.start,
        });
      return left / right;
    } else if (op.type === "STAR") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      return left * right;
    } else if (op.type === "EQUAL_EQUAL") {
      return left === right;
    } else if (op.type === "BANG_EQUAL") {
      return left !== right;
    } else if (op.type === "GREATER") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      return left > right;
    } else if (op.type === "GREATER_EQUAL") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      return left >= right;
    } else if (op.type === "LESS") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      return left < right;
    } else if (op.type === "LESS_EQUAL") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      return left <= right;
    }
    return unreachable;
  }

  examineVariableRef(expression: VariableReference): LoxValue {
    const value = this.env.getValue(expression.name.lexeme);
    if (value === undefined) {
      throw new EvaluationRuntimeError({
        message: `variable '${expression.name.lexeme}' not defined`,
        location: expression.name.start,
      });
    }
    return value;
  }

  examineVarDeclaration(decl: VariableDeclaration): void {
    const initialValue = decl.initializer
      ? this.evaluateExpression(decl.initializer)
      : null; // default to nil
    this.env.initialize(decl.name.lexeme, initialValue);
  }

  examineAssignment(expression: Assignment): LoxValue {
    const value = this.evaluateExpression(expression.value);
    const name = expression.name.lexeme;
    if (!this.env.isDefined(name)) {
      throw new EvaluationRuntimeError({
        message: `cannot reassign variable '${name}' before creation`,
        location: expression.name.start,
      });
    }
    this.env.reassign(expression.name.lexeme, value);
    return value;
  }

  examineBlock(b: Block): void {
    this.executeBlock(b.statements, new Environment(this.env));
  }

  executeBlock(statements: Declaration[], env: Environment) {
    const outer = this.env;
    try {
      this.env = env; // inner
      statements.forEach((s) => {
        this.executeDeclaration(s);
      });
    } finally {
      this.env = outer;
    }
  }
}

export const interpreter = {
  evaluateExpression(e: Expression, env: Environment) {
    return new Evaluator(() => {}, env).evaluateExpression(e);
  },
  execute(p: Program, errorHandler: LoxErrorHandler, env: Environment) {
    return new Evaluator(errorHandler, env).execute(p);
  },
};
