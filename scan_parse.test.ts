import { describe, test, expect, mock } from "bun:test";
import { scanner } from "./scanner";
import { parser } from "./parser";

describe("scan ==> parse", () => {
  function execute(source: string, error: unknown) {
    return `${parser.parse(
      scanner.scanTokens(source, error as lox.ScanErrorHandler),
      error as lox.ParseErrorHandler,
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
    test(`(err) - ${input}`, () => {
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
        message: "expected an expression but found '+'",
      },
    ]);
  });
  error_test("1 +", (errors) => {
    expect(errors).toEqual([
      {
        message: "reached end of input while parsing expression",
      },
    ]);
  });
  error_test("1 + (/)", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected an expression but found '/'",
      },
    ]);
  });
  error_test("1234a", (errors) => {
    expect(errors).toEqual([
      {
        message: "unexpected token: 'a'",
      },
    ]);
  });
  error_test("(1+1", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected closing ')' but found 'EOF'",
      },
    ]);
  });
  error_test("((1+1", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected closing ')' but found 'EOF'",
      },
    ]);
  });
  error_test("((1+1)", (errors) => {
    expect(errors).toEqual([
      {
        message: "expected closing ')' but found 'EOF'",
      },
    ]);
  });
});
