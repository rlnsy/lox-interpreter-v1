import { scanner } from "./scanner";
import { ParseError, parser } from "./parser";
import {
  Environment,
  EvaluationRuntimeError,
  interpreter,
} from "./interpreter";
import { Expression, Program } from "./ast";
import { stringify } from "./stringify";

async function main(args: string[]) {
  if (args.length === 1) {
    await file(args[0]);
  } else if (args.length === 0) {
    await repl();
  } else if (args.length === 2 && args[0] === "eval") {
    evaluate(args[1], true);
  } else {
    Bun.write(
      Bun.stderr,
      `Example usage:
	1. lox
	2. lox hello-world.lox
	3. lox eval "hello world"
`,
    );
    process.exit(64);
  }
}

async function file(name: string) {
  const source = await Bun.file(name).text();
  return evaluate(source, false);
}

async function repl() {
  const env = new Environment();
  const prompt = "\n> ";
  const utf8Decoder = new TextDecoder();
  Bun.write(Bun.stdout, "Welcome to Lox!" + prompt);
  for await (const chunk of Bun.stdin.stream()) {
    run(utf8Decoder.decode(chunk), env, true);
    Bun.write(Bun.stdout, prompt);
  }
}

async function evaluate(source: string, allowExpression: boolean) {
  const [hadError, hadRuntimeError] = run(
    source,
    new Environment(),
    allowExpression,
  );
  if (hadError) {
    process.exit(65);
  } else if (hadRuntimeError) {
    process.exit(70);
  }
}

function createErrorReport(
  message: string,
  line: number,
  column: number,
  lineContent: string,
  label = "here",
): string {
  let content = `Error: ${message}\n`;
  content += "    " + `${line} | ${lineContent}\n`;
  content += "    ";
  for (let i = 0; i < `${line}`.length; i++) {
    content += " ";
  }
  content += "   ";
  for (let i = 0; i < column; i++) {
    content += " ";
  }
  content += `^-- ${label}\n`;
  return content;
}

function report(...args: Parameters<typeof createErrorReport>) {
  Bun.write(Bun.stderr, createErrorReport(...args));
}

/*
 * Run a program from its source code string representation.
 * Return true if there was an error running the program.
 */
function run(
  source: string,
  env: Environment,
  allowExpression: boolean,
): [boolean, boolean] {
  let errors: LoxError[] = [];
  const hasError = () => errors.length > 0;
  let hasRuntimeError = false;
  function getLineContent(idx: number): string {
    let lineContent = "";
    let lineStart = idx;
    // determine the start of the line
    while (lineStart > 0 && source[lineStart - 1] != "\n") {
      lineStart--;
    }
    for (let i = lineStart; i < source.length; i++) {
      if (source[i] === "\n") break;
      lineContent += source[i];
    }
    return lineContent;
  }
  function reportError(error: LoxError) {
    const lineContent = getLineContent(error.location.idx);
    report(
      error.message,
      error.location.line,
      error.location.column,
      lineContent,
      error.label,
    );
  }
  const runtimeError: LoxErrorHandler = (error) => {
    hasRuntimeError = true;
    reportError(error);
  };
  const tokens = scanner.scanTokens(source, (error) => {
    reportError(error);
    errors.push(error);
  });
  if (hasError()) return [true, false];
  function parse(): Program | Expression {
    errors = [];
    const program = parser.parse(tokens, (error) => {
      errors.push(error);
    });
    if (!allowExpression) {
      return program;
    }
    const programParseErrors = errors;
    if (hasError()) {
      errors = [];
      try {
        return parser.parseExpression(tokens);
      } catch (err) {
        if (err instanceof ParseError) {
          errors = programParseErrors;
          return program;
        } else {
          throw err;
        }
      }
    }
    return program;
  }
  const ast = parse();
  if (hasError()) {
    errors.forEach((error) => {
      reportError(error);
    });
    return [true, false];
  }
  if (ast instanceof Expression) {
    try {
      const value = interpreter.evaluateExpression(ast, env);
      Bun.write(Bun.stdout, `${stringify(value)}\n`);
    } catch (err) {
      if (err instanceof EvaluationRuntimeError) {
        runtimeError(err.error);
      } else {
        throw err;
      }
    }
  } else {
    interpreter.execute(ast, runtimeError, env);
  }
  if (hasRuntimeError) return [false, true];
  return [hasError(), hasRuntimeError];
}

export const lox = {
  main,
  createErrorReport,
  run,
};
