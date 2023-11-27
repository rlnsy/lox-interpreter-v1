import { describe, test, expect, mock } from "bun:test";
import { scanner } from "./scanner";
import { parser } from "./parser";
import { Expression } from "./ast";

describe("scan ==> parse", () => {
  function execute(source: string, error: unknown) {
    const program = parser.parse(
      scanner.scanTokens(source, error as LoxErrorHandler),
      error as LoxErrorHandler,
    );
    if (program instanceof Expression) {
      return "EXPRESSION";
    }
    return program == null ? "ERROR" : `[${program.join(" ; ")}]`;
  }
  function run_test(
    input: string,
    fn: (result: unknown, error: unknown) => void,
  ) {
    test(input, () => {
      const error = mock(() => {});
      const result = execute(input, error);
      fn(result, error);
    });
  }
  function error_test(input: string, fn: (errors: unknown[]) => void) {
    test(`~err~ ${input}`, () => {
      const errors: unknown[] = [];
      const error = mock((err) => {
        errors.push(err);
      });
      execute(input, error);
      expect(error).toHaveBeenCalled();
      fn(errors);
    });
  }
  run_test("1 == 1;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [binary: == [literal: 1] [literal: 1]]]]",
    );
  });
  run_test("1 != 2;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [binary: != [literal: 1] [literal: 2]]]]",
    );
  });
  run_test("!(1 == 2);", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [unary: ! [group: [binary: == [literal: 1] [literal: 2]]]]]]",
    );
  });
  run_test("1 < 1 == false;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [binary: == [binary: < [literal: 1] [literal: 1]] [literal: false]]]]",
    );
  });
  run_test("---1;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [unary: - [unary: - [unary: - [literal: 1]]]]]]",
    );
  });
  run_test("1 * 2 * 3 * 4;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [binary: * [binary: * [binary: * [literal: 1] [literal: 2]] [literal: 3]] [literal: 4]]]]",
    );
  });
  run_test("1 + 2 + 3 + 4;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [binary: + [binary: + [binary: + [literal: 1] [literal: 2]] [literal: 3]] [literal: 4]]]]",
    );
  });
  run_test("1 + 2 * 3 + 4;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[[express [binary: + [binary: + [literal: 1] [binary: * [literal: 2] [literal: 3]]] [literal: 4]]]]",
    );
  });
  run_test("var a;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual("[[var-decl a undefined]]");
  });
  run_test("var a = 1;", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual("[[var-decl a [literal: 1]]]");
  });
  error_test("1 + 1", (errors) => {
    expect(errors).toEqual([
      {
        message: "missing semicolon",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
        label: "statement started here",
      },
    ]);
  });
  error_test("+", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found '+'",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test("1 +", (errors) => {
    expect(errors).toEqual([
      {
        message: "reached end of input while parsing expression",
        label: "expression started here",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test("1 + ;", (errors) => {
    expect(errors).toEqual([
      {
        message: "unexpected statement terminator while parsing expression",
        label: "expression started here",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test("1 + (/)", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found '/'",
        location: {
          line: 1,
          column: 5,
          idx: 5,
        },
      },
    ]);
  });
  error_test("1234a", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected semicolon to end statement but found 'a'",
        location: {
          line: 1,
          column: 4,
          idx: 4,
        },
      },
    ]);
  });
  error_test("(1+1", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected closing ')' but found 'EOF'",
        label: "opened here",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test("((1+1", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected closing ')' but found 'EOF'",
        label: "opened here",
        location: {
          line: 1,
          column: 1,
          idx: 1,
        },
      },
    ]);
  });
  error_test("((1+1)", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected closing ')' but found 'EOF'",
        label: "opened here",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test(" == ", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found '=='",
        location: {
          line: 1,
          column: 1,
          idx: 1,
        },
      },
    ]);
  });
  error_test("1 == ", (errors) => {
    expect(errors).toEqual([
      {
        message: "reached end of input while parsing expression",
        label: "expression started here",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test("true == 1 > ", (errors) => {
    expect(errors).toEqual([
      {
        message: "reached end of input while parsing expression",
        label: "expression started here",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test("true == 1 > !", (errors) => {
    expect(errors).toEqual([
      {
        message: "reached end of input while parsing expression",
        label: "expression started here",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
      },
    ]);
  });
  error_test("1 + (2 + )", (errors) => {
    expect(errors).toEqual([
      {
        message: "unexpected token ')'",
        location: {
          line: 1,
          column: 9,
          idx: 9,
        },
      },
    ]);
  });
  error_test("()", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found ')'",
        location: {
          line: 1,
          column: 1,
          idx: 1,
        },
      },
    ]);
  });
  error_test("1 + ()", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found ')'",
        location: {
          line: 1,
          column: 5,
          idx: 5,
        },
      },
    ]);
  });
  error_test("1 + (()", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found ')'",
        location: {
          line: 1,
          column: 6,
          idx: 6,
        },
      },
    ]);
  });
  error_test("1 + (+)", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found '+'",
        location: {
          line: 1,
          column: 5,
          idx: 5,
        },
      },
    ]);
  });
  error_test("var a", (errors) => {
    expect(errors).toEqual([
      {
        message: "missing semicolon",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
        label: "statement started here",
      },
    ]);
  });
  error_test("var a = ;", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected start of expression but found ';'",
        location: {
          line: 1,
          column: 8,
          idx: 8,
        },
      },
    ]);
  });
  error_test("{ print 1; ", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected closing '}' but found 'EOF'",
        location: {
          line: 1,
          column: 0,
          idx: 0,
        },
        label: "opened here",
      },
    ]);
  });
  run_test("{ print 1; }", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual("[[block [print [literal: 1]]]]");
  });
});
