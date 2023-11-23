import { scanner } from "./scanner";
import { parser } from "./parser";
import { Environment, interpreter } from "./interpreter";

async function main(args: string[]) {
  if (args.length === 1) {
    await file(args[0]);
  } else if (args.length === 0) {
    await repl();
  } else if (args.length === 2 && args[0] === "eval") {
    evaluate(args[1]);
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
  return evaluate(source);
}

async function repl() {
  const env = new Environment();
  const prompt = "\n> ";
  const utf8Decoder = new TextDecoder();
  Bun.write(Bun.stdout, "Welcome to Lox!" + prompt);
  for await (const chunk of Bun.stdin.stream()) {
    run(utf8Decoder.decode(chunk), env);
    Bun.write(Bun.stdout, prompt);
  }
}

async function evaluate(source: string) {
  const [hadError, hadRuntimeError] = run(source, new Environment());
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
function run(source: string, env: Environment): [boolean, boolean] {
  let hasError = false;
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
  const error: lox.ErrorHandler = ({
    message,
    location: { line, column, idx },
    label,
  }) => {
    const lineContent = getLineContent(idx);
    report(message, line, column, lineContent, label);
    hasError = true;
  };
  const runtimeError: lox.ErrorHandler = ({
    message,
    location: { line, column, idx },
    label,
  }) => {
    const lineContent = getLineContent(idx);
    report(message, line, column, lineContent, label);
    hasRuntimeError = true;
  };
  const tokens = scanner.scanTokens(source, error);
  if (hasError) return [true, false];
  const ast = parser.parse(tokens, error);
  if (hasError) return [true, false];
  interpreter.execute(ast, runtimeError, env);
  if (hasRuntimeError) return [false, true];
  return [hasError, hasRuntimeError];
}

declare global {
  namespace lox {
    type Error = {
      message: string;
      location: lox.Location;
      label?: string;
    };
    type ErrorHandler = (error: lox.Error) => void;
  }
}

export const lox = {
  main,
  createErrorReport,
};
