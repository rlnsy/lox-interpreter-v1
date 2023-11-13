import { ASTPrinter } from "./ast_printer";
import { Binary, Unary, Parenthesized, Literal } from "./expression";
import { describe, test, expect } from "bun:test";

describe("ASTPrinter", () => {
  test("number literal", () => {
    expect(new ASTPrinter().print(new Literal(22))).toEqual("22");
  });
  test("string literal", () => {
    expect(new ASTPrinter().print(new Literal("hello world"))).toEqual(
      "hello world",
    );
  });
  test("binop", () => {
    expect(
      new ASTPrinter().print(
        new Binary(
          { type: "PLUS", lexeme: "+" },
          new Literal(1),
          new Literal(1),
        ),
      ),
    ).toEqual("(+ 1 1)");
  });
  test("unop", () => {
    expect(
      new ASTPrinter().print(
        new Unary({ type: "MINUS", lexeme: "-" }, new Literal(1)),
      ),
    ).toEqual("(- 1)");
  });
  test("nested binop", () => {
    expect(
      new ASTPrinter().print(
        new Binary(
          { type: "PLUS", lexeme: "+" },
          new Literal(1),
          new Binary(
            { type: "PLUS", lexeme: "+" },
            new Literal(1),
            new Literal(2),
          ),
        ),
      ),
    ).toEqual("(+ 1 (+ 1 2))");
  });
  test("group", () => {
    // 1 / (1 - x)
    expect(
      new ASTPrinter().print(
        new Binary(
          { type: "SLASH", lexeme: "/" },
          new Literal(1),
          new Parenthesized(
            new Binary(
              { type: "MINUS", lexeme: "-" },
              new Literal(1),
              new Literal("x"),
            ),
          ),
        ),
      ),
    ).toEqual("(/ 1 ((- 1 x)))");
  });
});
