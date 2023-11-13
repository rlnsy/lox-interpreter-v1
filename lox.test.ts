import { describe, test, expect } from "bun:test";
import { lox } from "./lox";

describe("createErrorReport", () => {
  test("line 1 column 0", () => {
    expect(
      lox.createErrorReport("invalid token", 1, 0, "this is not valid code"),
    ).toEqual(
      `Error: invalid token
    1 | this is not valid code
        ^-- here`,
    );
  });
  test("line 2 column 6", () => {
    expect(lox.createErrorReport("invalid token", 2, 6, "print $")).toEqual(
      `Error: invalid token
    2 | print $
              ^-- here`,
    );
  });
});
