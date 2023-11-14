import { scanner, EOF } from "./scanner";
import { describe, test, expect, mock, jest } from "bun:test";

describe("scanTokens", () => {
  test("ϵ", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([EOF]);
  });
  const start = { line: 1, column: 0, idx: 0 };
  test("+", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("+", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([{ type: "PLUS", lexeme: "+", start }, EOF]);
  });
  test("=", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("=", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([{ type: "EQUAL", lexeme: "=", start }, EOF]);
  });
  test("error", () => {
    let errors: unknown[] = [];
    const error = (err: unknown) => {
      errors.push(err);
    };
    const tokens = scanner.scanTokens("?", error);
    expect(errors).toEqual([
      {
        message: "unexpected character",
        location: start,
      },
    ]);
  });
  test("error at column", () => {
    let errors: unknown[] = [];
    const error = (err: unknown) => {
      errors.push(err);
    };
    const tokens = scanner.scanTokens("+++?", error);
    expect(errors).toEqual([
      {
        message: "unexpected character",
        location: {
          line: 1,
          column: 3,
          idx: 3,
        },
      },
    ]);
  });
  test("<=", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("<=", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      {
        type: "LESS_EQUAL",
        lexeme: "<=",
        start,
      },
      EOF,
    ]);
  });
  test("multiple tokens", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("+==", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "PLUS", lexeme: "+", start },
      {
        type: "EQUAL_EQUAL",
        lexeme: "==",
        start: { line: 1, column: 1, idx: 1 },
      },
      EOF,
    ]);
  });
  test("whitespace", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("	+ ", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "PLUS", lexeme: "+", start: { line: 1, column: 1, idx: 1 } },
      EOF,
    ]);
  });
  test("comment", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("// this is a comment", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([EOF]);
  });
  test("multiline", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("+\n-", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "PLUS", lexeme: "+", start },
      { type: "MINUS", lexeme: "-", start: { line: 2, column: 0, idx: 2 } },
      EOF,
    ]);
  });
  test("error at line", () => {
    let errors: unknown[] = [];
    const error = (err: unknown) => {
      errors.push(err);
    };
    const tokens = scanner.scanTokens("+++\n=?", error);
    expect(errors).toEqual([
      {
        message: "unexpected character",
        location: {
          line: 2,
          column: 1,
          idx: 5,
        },
      },
    ]);
  });
  test("freeform example", () => {
    const error = mock(() => {});
    expect(error).not.toHaveBeenCalled();
    const tokens = scanner.scanTokens(
      `
// this is a comment
(( )){} // grouping stuff
!*+-/=<> <= == // operators
		`,
      error,
    );
    expect(tokens).toEqual([
      {
        type: "LEFT_PAREN",
        lexeme: "(",
        literal: undefined,
        start: { line: 3, column: 0, idx: 22 },
      },
      {
        type: "LEFT_PAREN",
        lexeme: "(",
        literal: undefined,
        start: {
          line: 3,
          column: 1,
          idx: 23,
        },
      },
      {
        type: "RIGHT_PAREN",
        lexeme: ")",
        literal: undefined,
        start: {
          line: 3,
          column: 3,
          idx: 25,
        },
      },
      {
        type: "RIGHT_PAREN",
        lexeme: ")",
        literal: undefined,
        start: {
          line: 3,
          column: 4,
          idx: 26,
        },
      },
      {
        type: "LEFT_BRACE",
        lexeme: "{",
        literal: undefined,
        start: {
          line: 3,
          column: 5,
          idx: 27,
        },
      },
      {
        type: "RIGHT_BRACE",
        lexeme: "}",
        literal: undefined,
        start: {
          line: 3,
          column: 6,
          idx: 28,
        },
      },
      {
        type: "BANG",
        lexeme: "!",
        literal: undefined,
        start: {
          line: 4,
          column: 0,
          idx: 48,
        },
      },
      {
        type: "STAR",
        lexeme: "*",
        literal: undefined,
        start: {
          line: 4,
          column: 1,
          idx: 49,
        },
      },
      {
        type: "PLUS",
        lexeme: "+",
        literal: undefined,
        start: {
          line: 4,
          column: 2,
          idx: 50,
        },
      },
      {
        type: "MINUS",
        lexeme: "-",
        literal: undefined,
        start: {
          line: 4,
          column: 3,
          idx: 51,
        },
      },
      {
        type: "SLASH",
        lexeme: "/",
        literal: undefined,
        start: {
          line: 4,
          column: 4,
          idx: 52,
        },
      },
      {
        type: "EQUAL",
        lexeme: "=",
        literal: undefined,
        start: {
          line: 4,
          column: 5,
          idx: 53,
        },
      },
      {
        type: "LESS",
        lexeme: "<",
        literal: undefined,
        start: {
          line: 4,
          column: 6,
          idx: 54,
        },
      },
      {
        type: "GREATER",
        lexeme: ">",
        literal: undefined,
        start: {
          line: 4,
          column: 7,
          idx: 55,
        },
      },
      {
        type: "LESS_EQUAL",
        lexeme: "<=",
        literal: undefined,
        start: {
          line: 4,
          column: 9,
          idx: 57,
        },
      },
      {
        type: "EQUAL_EQUAL",
        lexeme: "==",
        literal: undefined,
        start: {
          line: 4,
          column: 12,
          idx: 60,
        },
      },
      EOF,
    ]);
  });
  test("string", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens(`"hello world"`, error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      {
        type: "STRING",
        lexeme: `"hello world"`,
        literal: "hello world",
        start,
      },
      EOF,
    ]);
  });
  test("unterminated string error", () => {
    let errors: unknown[] = [];
    const error = (err: unknown) => {
      errors.push(err);
    };
    const tokens = scanner.scanTokens(`"hello`, error);
    expect(errors).toEqual([
      {
        message: "unterminated string",
        location: start,
        label: "started here",
      },
    ]);
  });
  test("unterminated string error 2", () => {
    let errors: unknown[] = [];
    const error = (err: unknown) => {
      errors.push(err);
    };
    const tokens = scanner.scanTokens(`+++ "hello`, error);
    expect(errors).toEqual([
      {
        message: "unterminated string",
        label: "started here",
        location: {
          line: 1,
          column: 4,
          idx: 4,
        },
      },
    ]);
  });
  test("unterminated string error 3", () => {
    let errors: unknown[] = [];
    const error = (err: unknown) => {
      errors.push(err);
    };
    const tokens = scanner.scanTokens(`+++ "hello\n`, error);
    expect(errors).toEqual([
      {
        message: "unterminated string",
        label: "started here",
        location: {
          line: 1,
          column: 4,
          idx: 4,
        },
      },
    ]);
  });
  test("single digit integer", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("1", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "NUMBER", lexeme: "1", literal: 1, start },
      EOF,
    ]);
  });
  test("multi digit integer", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("12", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "NUMBER", lexeme: "12", literal: 12, start },
      EOF,
    ]);
  });
  test("decimal point", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("1.2", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "NUMBER", lexeme: "1.2", literal: 1.2, start },
      EOF,
    ]);
  });
  test("multiple decimal places", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("1.23", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "NUMBER", lexeme: "1.23", literal: 1.23, start },
      EOF,
    ]);
  });
  test("identifier", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("_myVariable1", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([
      { type: "IDENTIFIER", lexeme: "_myVariable1", start },
      EOF,
    ]);
  });
  test("and keyword", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("and", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([{ type: "AND", lexeme: "and", start }, EOF]);
  });
  test("or keyword", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("or", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([{ type: "OR", lexeme: "or", start }, EOF]);
  });
  test("class keyword", () => {
    const error = mock(() => {});
    const tokens = scanner.scanTokens("class", error);
    expect(error).not.toHaveBeenCalled();
    expect(tokens).toEqual([{ type: "CLASS", lexeme: "class", start }, EOF]);
  });
});
