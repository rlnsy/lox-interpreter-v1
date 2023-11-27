import { describe, test, expect, mock } from "bun:test";
import { parser } from "./parser";
import {
  Program,
  ExpressionStatement,
  Literal,
  Parenthesized,
  Unary,
  Binary,
  Expression,
  Declaration,
} from "./ast";
import { EOF } from "./scanner";

describe("parse", () => {
  function parseWithoutError(tokens: lox.Token[]) {
    const error = mock(() => {});
    const program = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    return program as Program;
  }
  function expectExpressionStatement(
    s: Declaration,
  ): asserts s is ExpressionStatement {
    expect(s).toBeInstanceOf(ExpressionStatement);
  }
  function expectLiteral(e: Expression): asserts e is Literal {
    expect(e).toBeInstanceOf(Literal);
  }
  function expectParenthesized(e: Expression): asserts e is Parenthesized {
    expect(e).toBeInstanceOf(Parenthesized);
  }
  function expectUnary(e: Expression): asserts e is Unary {
    expect(e).toBeInstanceOf(Unary);
  }
  function expectBinary(e: Expression): asserts e is Binary {
    expect(e).toBeInstanceOf(Binary);
  }
  // use this when the location of a token doesn't matter
  const start: lox.Location = { line: 1, column: 0, idx: 0 };
  test("literal nil", () => {
    const tokens: lox.Token[] = [
      { type: "NIL", lexeme: "nil", start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expect(result.expression).toBeInstanceOf(Literal);
    expectLiteral(result.expression);
    expect(result.expression.value).toEqual(null);
  });
  test("parenthesized literal", () => {
    const tokens: lox.Token[] = [
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NIL", lexeme: "nil", start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expectParenthesized(result.expression);
    expectLiteral(result.expression.expression);
  });
  test("op unary", () => {
    const tokens: lox.Token[] = [
      { type: "BANG", lexeme: "!", start },
      { type: "FALSE", lexeme: "false", start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expectUnary(result.expression);
    expect(result.expression.operator).toEqual({
      type: "BANG",
      lexeme: "!",
      start,
    });
    expect(result.expression.operand).toBeInstanceOf(Literal);
  });
  test("double op unary", () => {
    const tokens: lox.Token[] = [
      { type: "BANG", lexeme: "!", start },
      { type: "BANG", lexeme: "!", start },
      { type: "FALSE", lexeme: "false", start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expectUnary(result.expression);
    expect(result.expression.operator).toEqual({
      type: "BANG",
      lexeme: "!",
      start,
    });
    expect(result.expression.operand).toBeInstanceOf(Unary);
  });
  test("1 / 2", () => {
    const tokens: lox.Token[] = [
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SLASH", lexeme: "/", start },
      { type: "NUMBER", lexeme: "2", literal: 2, start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expectBinary(result.expression);
    expect(result.expression.operator).toEqual({
      type: "SLASH",
      lexeme: "/",
      start,
    });
    expect(result.expression.left).toBeInstanceOf(Literal);
    expect(result.expression.right).toBeInstanceOf(Literal);
  });
  test("1 / (2 * 3)", () => {
    const tokens: lox.Token[] = [
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SLASH", lexeme: "/", start },
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NUMBER", lexeme: "2", literal: 2, start },
      { type: "STAR", lexeme: "*", start },
      { type: "NUMBER", lexeme: "3", literal: 3, start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expectBinary(result.expression);
    expect(result.expression.operator).toEqual({
      type: "SLASH",
      lexeme: "/",
      start,
    });
    expect(result.expression.left).toBeInstanceOf(Literal);
    expect(result.expression.right).toBeInstanceOf(Parenthesized);
  });
  test("(1 / 2) * 3", () => {
    const tokens: lox.Token[] = [
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SLASH", lexeme: "/", start },
      { type: "NUMBER", lexeme: "2", literal: 2, start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      { type: "STAR", lexeme: "*", start },
      { type: "NUMBER", lexeme: "3", literal: 3, start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expectBinary(result.expression);
    expect(result.expression.operator).toEqual({
      type: "STAR",
      lexeme: "*",
      start,
    });
    expect(result.expression.left).toBeInstanceOf(Parenthesized);
    expect(result.expression.right).toBeInstanceOf(Literal);
  });
  test("(1 / (2 * 3)) + 1", () => {
    const tokens: lox.Token[] = [
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SLASH", lexeme: "/", start },
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NUMBER", lexeme: "2", literal: 2, start },
      { type: "STAR", lexeme: "*", start },
      { type: "NUMBER", lexeme: "3", literal: 3, start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      { type: "PLUS", lexeme: "+", start },
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SEMICOLON", lexeme: ";", start },
      EOF,
    ];
    const program = parseWithoutError(tokens);
    expect(program).toHaveLength(1);
    const result = program[0];
    expectExpressionStatement(result);
    expectBinary(result.expression);
    expect(result.expression.operator).toEqual({
      type: "PLUS",
      lexeme: "+",
      start,
    });
    expect(result.expression.left).toBeInstanceOf(Parenthesized);
    expect(result.expression.right).toBeInstanceOf(Literal);
  });
});
