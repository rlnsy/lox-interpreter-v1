import { describe, test, expect } from "bun:test";
import { lox } from "./lox";
import { Environment } from "./interpreter";

describe("createErrorReport", () => {
  test("line 1 column 0", () => {
    expect(
      lox.createErrorReport("invalid token", 1, 0, "this is not valid code"),
    ).toEqual(
      `Error: invalid token
    1 | this is not valid code
        ^-- here
`,
    );
  });
  test("line 2 column 6", () => {
    expect(lox.createErrorReport("invalid token", 2, 6, "print $")).toEqual(
      `Error: invalid token
    2 | print $
              ^-- here
`,
    );
  });
});

describe("run", () => {
  function run(
    input: string,
    allowExpression: boolean,
    fn: (output: string[], errors: [boolean, boolean]) => void,
  ) {
    const prints: string[] = [];
    Bun.write = ((_: unknown, content: string) =>
      prints.push(content)) as unknown as typeof Bun.write;
    const errors = lox.run(input, new Environment(), allowExpression);
    fn(prints, errors);
  }
  test("hello world", () => {
    run('print "hello world";', true, (output, [error, runError]) => {
      expect(output).toEqual(["hello world\n"]);
      expect(error).toBeFalse;
      expect(runError).toBeFalse;
    });
  });
  test("expression - allowed", () => {
    run("1+1", true, (output, [error, runError]) => {
      expect(output).toEqual(["2\n"]);
      expect(error).toBeFalse;
      expect(runError).toBeFalse;
    });
  });
  test("expression - not allowed", () => {
    run("1+1", false, (output, [error]) => {
      expect(error).toBeTrue;
      expect(output).toEqual([
        `Error: missing semicolon
    1 | 1+1
        ^-- statement started here
`,
      ]);
    });
  });
  test("statement - expression allowed", () => {
    run("1+1;", true, (output, [error, runError]) => {
      expect(output).toEqual([]);
      expect(error).toBeFalse;
      expect(runError).toBeFalse;
    });
  });
  test("statement - expression not allowed", () => {
    run("1+1;", false, (output, [error, runError]) => {
      expect(output).toEqual([]);
      expect(error).toBeFalse;
      expect(runError).toBeFalse;
    });
  });
  test("expression syntax error in statement", () => {
    run("1+(;", false, (output, [error]) => {
      expect(error).toBeTrue;
      expect(output).toEqual([
        `Error: expected start of expression but found ';'
    1 | 1+(;
           ^-- here
`,
      ]);
    });
  });
  test("statment error", () => {
    run("print ;", false, (output, [error]) => {
      expect(error).toBeTrue;
      expect(output).toEqual([
        `Error: expected start of expression but found ';'
    1 | print ;
              ^-- here
`,
      ]);
    });
  });
  test("string error", () => {
    run(
      `
print "hello world";
1 + 1 == 2;
var i = 0;
var name ="m
exit;	
	`,
      false,
      (output, [error]) => {
        expect(error).toBeTrue;
        expect(output).toEqual([
          `Error: unterminated string
    5 | var name ="m
                  ^-- started here
`,
        ]);
      },
    );
  });
  test("multiple errors 1", () => {
    run("print; { ; print a", false, (output, [error]) => {
      expect(error).toBeTrue;
      expect(output).toEqual([
        `Error: expected start of expression but found ';'
    1 | print; { ; print a
             ^-- here
`,
        `Error: expected start of expression but found ';'
    1 | print; { ; print a
                 ^-- here
`,
        `Error: missing semicolon
    1 | print; { ; print a
                   ^-- statement started here
`,
      ]);
    });
  });
  test("multiple errors 2", () => {
    run(
      `
print;
{
1+1;
{ 1+=1 }
print "hi"
}
	`,
      false,
      (output, [error]) => {
        expect(error).toBeTrue;
        expect(output).toEqual([
          `Error: expected start of expression but found ';'
    2 | print;
             ^-- here
`,
          `Error: unexpected token '='
    5 | { 1+=1 }
            ^-- here
`,
          `Error: expected semicolon to end statement but found '}'
    7 | }
        ^-- here
`,
        ]);
      },
    );
  });
});
