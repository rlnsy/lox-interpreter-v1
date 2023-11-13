import { scanner } from "./scanner";

async function main(args: string[]) {
	if (args.length === 1) {
		await file(args[0]);
	} else if (args.length === 0) {
		await repl();
	} else {
		Bun.write(Bun.stderr, "expected 0 or 1 arguments");
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

type RunError = {
	message: string;
	line: number;
	column: number;

}

function createErrorReport(message: string, line: number, column: number, lineContent: string): string {
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
	const error: lox.runErrorHandlerFn = ({ message, line, column, idx }) => {
		let lineContent = "";
		for (let i = idx; i < source.length; i++) {
			if (source[i] === '\n') break;
			lineContent += source[i];
		}
		report(message, line, column, lineContent);
		hasError = true;
	}
	const tokens = scanner.scanTokens(source, error);
	// if hasError at this point, don't execute code
	if (hasError) return true;
	console.log({ tokens }); // TODO
	return hasError;
}

declare global {
	namespace lox {
		type runErrorHandlerFn = (detail: lox.runErrorDetail) => void;
		type runErrorDetail = {
			message: string;
			line: number;
			column: number;
			idx: number;
		}
	}
}

export const lox = {
	main,
	createErrorReport
};
