import { describe, test, expect, mock } from "bun:test";
import { scanner } from "./scanner";
import { parser } from "./parser";

describe("scan ==> parse", () => {
  function execute(source: string, error: unknown) {
    return `${parser.parse(
      scanner.scanTokens(source, error as lox.ErrorHandler),
      error as lox.ErrorHandler,
    )}`;
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
  run_test("1 == 1", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual("[binary: == [literal: 1] [literal: 1]]");
  });
  run_test("1 != 2", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual("[binary: != [literal: 1] [literal: 2]]");
  });
  run_test("!(1 == 2)", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[unary: ! [group: [binary: == [literal: 1] [literal: 2]]]]",
    );
  });
  run_test("1 < 1 == false", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[binary: == [binary: < [literal: 1] [literal: 1]] [literal: false]]",
    );
  });
  run_test("---1", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual("[unary: - [unary: - [unary: - [literal: 1]]]]");
  });
  run_test("1 * 2 * 3 * 4", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[binary: * [binary: * [binary: * [literal: 1] [literal: 2]] [literal: 3]] [literal: 4]]",
    );
  });
  run_test("1 + 2 + 3 + 4", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[binary: + [binary: + [binary: + [literal: 1] [literal: 2]] [literal: 3]] [literal: 4]]",
    );
  });
  run_test("1 + 2 * 3 + 4", (result, error) => {
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual(
      "[binary: + [binary: + [literal: 1] [binary: * [literal: 2] [literal: 3]]] [literal: 4]]",
    );
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
        message: "unexpected token: 'a'",
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
});
