import { describe, test, expect, mock } from "bun:test";
import {
  Expression,
  Literal,
  Unary,
  Parenthesized,
  Binary,
} from "./expression";
import { evaluator } from "./evaluator";

describe("evaluator", () => {
  const start: lox.Location = { line: 1, column: 0, idx: 0 }; // placeholder token location
  const ONE = new Literal(1);
  const ZERO = new Literal(0);
  const TWO = new Literal(2);
  const FALSE = new Literal(false);
  const TRUE = new Literal(true);
  const NIL = new Literal(null);
  const MINUS = { type: "MINUS", lexeme: "-", start } as const;
  const PLUS = { type: "PLUS", lexeme: "+", start } as const;
  const NOT = { type: "BANG", lexeme: "!", start } as const;
  const HELLO = new Literal("hello");
  const DIVIDE = { type: "SLASH", lexeme: "/", start } as const;
  const LESS = { type: "LESS", lexeme: "<", start } as const;
  const cases: [Expression, lox.Value][] = [
    [ONE, 1],
    [HELLO, "hello"],
    [new Unary(MINUS, ONE), -1],
    [new Unary(MINUS, new Unary(MINUS, ONE)), 1],
    [new Unary(NOT, FALSE), true],
    [new Unary(NOT, TRUE), false],
    [new Unary(NOT, new Unary(NOT, TRUE)), true],
    [new Unary(NOT, NIL), true],
    [new Unary(NOT, ONE), false],
    [new Parenthesized(ONE), 1],
    [new Binary(PLUS, ONE, ONE), 2],
    [new Binary(MINUS, ONE, ONE), 0],
    [new Binary(MINUS, TWO, ONE), 1],
    [new Binary(PLUS, HELLO, HELLO), "hellohello"],
  ];
  cases.forEach(([input, expected]) => {
    test(`${input}`, () => {
      const error = mock(() => {});
      const result = evaluator.evaluate(input, error);
      expect(error).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });
  const errorCases: [Expression, lox.Error][] = [
    [
      new Binary(DIVIDE, ONE, ZERO),
      { message: "divide by zero", location: start },
    ],
    [
      new Binary(PLUS, ONE, HELLO),
      { message: "cannot add number and string", location: start },
    ],
    [
      new Binary(MINUS, TWO, FALSE),
      { message: "RHS is not a number", location: start },
    ],
    [
      new Binary(LESS, ONE, NIL),
      { message: "RHS is not a number", location: start },
    ],
    [
      new Binary(DIVIDE, TRUE, TWO),
      { message: "LHS is not a number", location: start },
    ],
  ];
  errorCases.forEach(([input, expected]) => {
    test(`~err~ ${input}`, () => {
      const errors: lox.Error[] = [];
      const error = mock((err) => {
        errors.push(err);
      });
      const result = evaluator.evaluate(input, error);
      expect(error).toHaveBeenCalled();
      expect(errors).toEqual([expected]);
    });
  });
});
