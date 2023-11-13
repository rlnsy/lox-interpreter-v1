type Token = string; // TODO

function scanTokens(source: string, error: lox.runErrorHandlerFn): Token[] {
	error({
			message: "oops can't compile",
			line: 1,
			column: 0,
			idx: 0
		});
	return []; // TODO
}

export const scanner = {
	scanTokens
};
