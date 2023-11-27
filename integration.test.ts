import { test, expect } from "bun:test";
import { scanner } from "./scanner";
import { parser } from "./parser";
import { Environment, interpreter } from "./interpreter";
import { Expression } from "./ast";

function run(
  input: string,
  fn: (
    prints: string[],
    errors: {
      hasScanError: boolean;
      hasParseError: boolean;
      hasRunError: boolean;
    },
  ) => void,
) {
  test(input, () => {
    const prints: string[] = [];
    Bun.write = ((_: unknown, content: string) =>
      prints.push(content)) as unknown as typeof Bun.write;
    let hasScanError = false;
    let hasParseError = false;
    let hasRunError = false;
    const next = () => fn(prints, { hasScanError, hasParseError, hasRunError });
    const tokens = scanner.scanTokens(input, () => {
      hasScanError = true;
    });
    if (hasScanError) return next();
    const ast = parser.parse(tokens, () => {
      hasParseError = true;
    });
    if (ast instanceof Expression) {
      throw new Error("parsed an expression, not a program");
    }
    if (hasParseError) return next();
    interpreter.execute(
      ast,
      () => {
        hasRunError = true;
      },
      new Environment(),
    );
    next();
  });
}

function run_test(input: string, fn: (prints: string[]) => void) {
  run(input, (prints, { hasScanError, hasParseError, hasRunError }) => {
    expect(hasScanError).toBeFalse();
    expect(hasParseError).toBeFalse();
    expect(hasRunError).toBeFalse();
    fn(prints);
  });
}

run_test(
  `
	 var a = 1;
	 print a + 2;
`,
  (output) => {
    expect(output).toEqual(["3\n"]);
  },
);

run_test(
  `
	 var a;
	 print a;
`,
  (output) => {
    expect(output).toEqual(["nil\n"]);
  },
);

run(
  `
print;
1+1;
1+=1;
print "hi"
    `,
  (_, { hasParseError }) => {
    expect(hasParseError).toBeTrue();
  },
);

run_test(
  `
	 var a = 1;
	 a = 2;
	 print a;
`,
  (output) => {
    expect(output).toEqual(["2\n"]);
  },
);

run_test(
  `
	 var a = 1;
	 var b = (a = 2);
	 print a + b;
`,
  (output) => {
    expect(output).toEqual(["4\n"]);
  },
);

run(
  `
a = 1;
print a;
    `,
  (_, { hasRunError }) => {
    expect(hasRunError).toBeTrue();
  },
);

run(
  `
-true;
    `,
  (_, { hasRunError }) => {
    expect(hasRunError).toBeTrue();
  },
);

run_test(
  `
 { print "hello"; }
 `,
  (output) => {
    expect(output).toEqual(["hello\n"]);
  },
);

run_test(
  `
  var a = 1;
 { print a; }
 `,
  (output) => {
    expect(output).toEqual(["1\n"]);
  },
);

run_test(
  `
  var a = 1;
 { var a = 2; print a; }
 print a;
 `,
  (output) => {
    expect(output).toEqual(["2\n", "1\n"]);
  },
);

run_test(
  `
  var a = 1;
 { a = 2; print a; }
 print a;
 `,
  (output) => {
    expect(output).toEqual(["2\n", "2\n"]);
  },
);
