import {
  Binary,
  Program,
  Literal,
  Parenthesized,
  Unary,
  ExpressionExaminer,
  Expression,
  StatementExaminer,
  ExpressionStatement,
  PrintStatement,
  VariableReference,
  Declaration,
  VariableDeclaration,
} from "./ast";
import { stringify } from "./stringify";

function isNumber(value: lox.Value): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isString(value: lox.Value): value is string {
  return typeof value === "string";
}

class EvaluationRuntimeError extends Error {
  constructor(
    public message: string,
    public location: lox.Location,
  ) {
    super();
  }
}

function checkNumber(
  value: lox.Value,
  errorLabel: string,
  errorLocation: lox.Location,
): asserts value is number {
  if (!isNumber(value)) {
    throw new EvaluationRuntimeError(
      `${errorLabel} is not a number`,
      errorLocation,
    );
  }
}

/**
 * Assign type-like name to each category of lox value
 * based on the internal representation
 */
function loxTypeOf(value: lox.Value) {
  if (value === null) return "nil";
  if (typeof value === "boolean") return `${value}`;
  return typeof value; // string or number
}

const unreachable: lox.Value =
  "Look at you, sneaky weasel. You reached some unreachable code!";

export class Environment {
  env = new Map<string, lox.Value>();
  set(name: string, value: lox.Value): void {
    this.env.set(name, value);
  }
  get(name: string): lox.Value | undefined {
    return this.env.get(name);
  }
}

class Evaluator
  implements ExpressionExaminer<lox.Value>, StatementExaminer<void>
{
  constructor(
    private error: lox.ErrorHandler,
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
          message: error.message,
          location: error.location,
        });
      } else {
        throw error;
      }
    }
  }
  executeDeclaration(d: Declaration) {
    d.acknowledge(this);
  }
  evaluateExpression(expr: Expression): lox.Value {
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
  examineUnary({ operator: op, operand: operandExpr }: Unary): lox.Value {
    const operand = this.evaluateExpression(operandExpr);
    if (op.type === "MINUS") {
      if (!isNumber(operand)) {
        throw new Error();
      }
      return -operand;
    } else if (op.type === "BANG") {
      return operand === null || operand == false;
    }
    return unreachable;
  }
  examineParenthesized(expression: Parenthesized): lox.Value {
    return this.evaluateExpression(expression.expression);
  }
  examineBinary(expression: Binary): lox.Value {
    const left = this.evaluateExpression(expression.left);
    const right = this.evaluateExpression(expression.right);
    const op = expression.operator;
    if (op.type === "PLUS") {
      if (isNumber(left) && isNumber(right)) {
        return left + right;
      } else if (isString(left) && isString(right)) {
        return `${left}${right}`;
      }
      throw new EvaluationRuntimeError(
        `cannot add ${loxTypeOf(left)} and ${loxTypeOf(right)}`,
        op.start,
      );
    } else if (op.type === "MINUS") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      return left - right;
    } else if (op.type === "SLASH") {
      checkNumber(left, "LHS", op.start), checkNumber(right, "RHS", op.start);
      if (right === 0)
        throw new EvaluationRuntimeError("divide by zero", op.start);
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

  examineVariableRef(expression: VariableReference): lox.Value {
    const value = this.env.get(expression.name.lexeme);
    if (value === undefined) {
      throw new EvaluationRuntimeError(
        `variable '${expression.name.lexeme}' not defined`,
        expression.name.start,
      );
    }
    return value;
  }

  examineVarDeclaration(decl: VariableDeclaration): void {
    const initialValue = decl.initializer
      ? this.evaluateExpression(decl.initializer)
      : null; // default to nil
    this.env.set(decl.name.lexeme, initialValue);
  }
}

export const interpreter = {
  evaluateExpression(
    e: Expression,
    errorHandler: lox.ErrorHandler,
    env: Environment,
  ) {
    return new Evaluator(errorHandler, env).evaluateExpression(e);
  },
  execute(p: Program, errorHandler: lox.ErrorHandler, env: Environment) {
    return new Evaluator(errorHandler, env).execute(p);
  },
};
