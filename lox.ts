import { scanner } from "./scanner";
import { parser } from "./parser";

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
  const hadError = run(source);
  if (hadError) {
    process.exit(65);
  }
}

async function repl() {
  const prompt = "\n> ";
  const utf8Decoder = new TextDecoder();
  Bun.write(Bun.stdout, "Welcome to Lox!" + prompt);
  for await (const chunk of Bun.stdin.stream()) {
    run(utf8Decoder.decode(chunk));
    Bun.write(Bun.stdout, prompt);
  }
}

async function evaluate(source: string) {
  const hadError = run(source);
  if (hadError) {
    process.exit(65);
  }
}

type RunError = {
  message: string;
  line: number;
  column: number;
};

function createErrorReport(
  message: string,
  line: number,
  column: number,
  lineContent: string,
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
  content += "^-- here";
  return content;
}

function report(...args: Parameters<typeof createErrorReport>) {
  Bun.write(Bun.stderr, createErrorReport(...args));
}

/*
 * Run a program from its source code string representation.
 * Return true if there was an error running the program.
 */
function run(source: string): boolean {
  let hasError = false;
  const scanError: lox.ScanErrorHandler = ({
    message,
    location: { line, column, idx },
  }) => {
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
    report(message, line, column, lineContent);
    hasError = true;
  };
  const parseError: lox.ParseErrorHandler = ({ message }) => {
    Bun.write(Bun.stderr, message);
    hasError = true;
  };
  const tokens = scanner.scanTokens(source, scanError);
  if (hasError) return true;
  const ast = parser.parse(tokens, parseError);
  if (hasError) return true;
  console.log(`${ast}`); // TODO
  return hasError;
}

declare global {
  namespace lox {
    type ScanError = {
      message: string;
      location: lox.Location;
    };
    type ScanErrorHandler = (error: lox.ScanError) => void;
    type ParseError = {
      message: string;
    };
    type ParseErrorHandler = (error: lox.ParseError) => void;
  }
}

export const lox = {
  main,
  createErrorReport,
};
