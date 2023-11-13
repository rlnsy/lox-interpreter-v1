await __bun_run__();

async function __bun_run__() { // bun execution boilerplate
	// bun-run lox.ts <args>
	const [_1, _2, ...args] = process.argv;
	await main(args);
}

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
	run(source);
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

function run(source: string) {
	Bun.write(Bun.stdout, "your code: " + source);
}
