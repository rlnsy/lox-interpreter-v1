import { describe, test, expect, mock } from "bun:test";
import { parser } from "./parser";
import { Literal, Parenthesized, Unary, Binary } from "./expression";
import { EOF } from "./scanner";

describe("parse", () => {
  // use this when the location of a token doesn't matter
  const start: lox.Location = { line: 1, column: 0, idx: 0 };
  test("literal nil", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [{ type: "NIL", lexeme: "nil", start }, EOF];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Literal);
    expect((result as Literal).value).toEqual(null);
  });
  test("literal number", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [
      { type: "NUMBER", lexeme: "22", literal: 22, start },
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Literal);
    expect((result as Literal).value).toEqual(22);
  });
  test("parenthesized literal", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NIL", lexeme: "nil", start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Parenthesized);
    expect((result as Parenthesized).expression).toBeInstanceOf(Literal);
  });
  test("op unary", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [
      { type: "BANG", lexeme: "!", start },
      { type: "FALSE", lexeme: "false", start },
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Unary);
    expect((result as Unary).operator).toEqual({
      type: "BANG",
      lexeme: "!",
      start,
    });
    expect((result as Unary).operand).toBeInstanceOf(Literal);
  });
  test("double op unary", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [
      { type: "BANG", lexeme: "!", start },
      { type: "BANG", lexeme: "!", start },
      { type: "FALSE", lexeme: "false", start },
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Unary);
    expect((result as Unary).operator).toEqual({
      type: "BANG",
      lexeme: "!",
      start,
    });
    expect((result as Unary).operand).toBeInstanceOf(Unary);
  });
  test("1 / 2", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SLASH", lexeme: "/", start },
      { type: "NUMBER", lexeme: "2", literal: 2, start },
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Binary);
    expect((result as Binary).operator).toEqual({
      type: "SLASH",
      lexeme: "/",
      start,
    });
    expect((result as Binary).left).toBeInstanceOf(Literal);
    expect((result as Binary).right).toBeInstanceOf(Literal);
  });
  test("1 / (2 * 3)", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SLASH", lexeme: "/", start },
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NUMBER", lexeme: "2", literal: 2, start },
      { type: "STAR", lexeme: "*", start },
      { type: "NUMBER", lexeme: "3", literal: 3, start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Binary);
    expect((result as Binary).operator).toEqual({
      type: "SLASH",
      lexeme: "/",
      start,
    });
    expect((result as Binary).left).toBeInstanceOf(Literal);
    expect((result as Binary).right).toBeInstanceOf(Parenthesized);
    expect();
  });
  test("(1 / 2) * 3", () => {
    const error = mock(() => {});
    const tokens: lox.Token[] = [
      { type: "LEFT_PAREN", lexeme: "(", start },
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      { type: "SLASH", lexeme: "/", start },
      { type: "NUMBER", lexeme: "2", literal: 2, start },
      { type: "RIGHT_PAREN", lexeme: ")", start },
      { type: "STAR", lexeme: "*", start },
      { type: "NUMBER", lexeme: "3", literal: 3, start },
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Binary);
    expect((result as Binary).operator).toEqual({
      type: "STAR",
      lexeme: "*",
      start,
    });
    expect((result as Binary).left).toBeInstanceOf(Parenthesized);
    expect((result as Binary).right).toBeInstanceOf(Literal);
  });
  test("(1 / (2 * 3)) + 1", () => {
    const error = mock(() => {});
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
      EOF,
    ];
    const result = parser.parse(tokens, error);
    expect(error).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Binary);
    expect((result as Binary).operator).toEqual({
      type: "PLUS",
      lexeme: "+",
      start,
    });
    expect((result as Binary).left).toBeInstanceOf(Parenthesized);
    expect((result as Binary).right).toBeInstanceOf(Literal);
  });
});
