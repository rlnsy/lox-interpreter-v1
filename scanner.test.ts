import { scanner } from "./scanner";
import { describe, test, expect, mock, jest } from "bun:test";

describe("scanTokens", () => {
	test("ϵ", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([{ type: "EOF", lexeme: null }]);
	});
	test("+", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("+", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "PLUS", lexeme: "+" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("=", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("=", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "EQUAL", lexeme: "=" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("error", () => {
		let errors: unknown[] = [];
		const error = (err: unknown) => { errors.push(err) };
		const tokens = scanner.scanTokens("?", error);
		expect(errors).toEqual([{
			message: "unexpected character",
			line: 1,
			column: 0,
			idx: 0
		}]);
	});
	test("error at column", () => {
		let errors: unknown[] = [];
		const error = (err: unknown) => { errors.push(err) };
		const tokens = scanner.scanTokens("+++?", error);
		expect(errors).toEqual([{
			message: "unexpected character",
			line: 1,
			column: 3,
			idx: 3
		}]);
	});
	test("<=", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("<=", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "LESS_EQUAL", lexeme: "<=" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("multiple tokens", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("+==", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "PLUS", lexeme: "+" },
			{ type: "EQUAL_EQUAL", lexeme: "==" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("whitespace", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("	+ ", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "PLUS", lexeme: "+" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("comment", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("// this is a comment", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "EOF", lexeme: null }
		]);
	});
	test("multiline", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("+\n-", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "PLUS", lexeme: "+" },
			{ type: "MINUS", lexeme: "-" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("multiline", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("+\n-", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "PLUS", lexeme: "+" },
			{ type: "MINUS", lexeme: "-" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("error at line", () => {
		let errors: unknown[] = [];
		const error = (err: unknown) => { errors.push(err) };
		const tokens = scanner.scanTokens("+++\n=?", error);
		expect(errors).toEqual([{
			message: "unexpected character",
			line: 2,
			column: 1,
			idx: 5
		}]);
	});
	test("freeform example", () => {
		const error = mock(() => {});
		expect(error).not.toHaveBeenCalled();
		const tokens = scanner.scanTokens(`
		// this is a comment
		(( )){} // grouping stuff
		!*+-/=<> <= == // operators
		`, error);
		expect(tokens).toEqual([
			{ type: "LEFT_PAREN", lexeme: "(" },
			{ type: "LEFT_PAREN", lexeme: "(" },
			{ type: "RIGHT_PAREN", lexeme: ")" },
			{ type: "RIGHT_PAREN", lexeme: ")" },
			{ type: "LEFT_BRACE", lexeme: "{" },
			{ type: "RIGHT_BRACE", lexeme: "}" },
			{ type: "BANG", lexeme: "!" },
			{ type: "STAR", lexeme: "*" },
			{ type: "PLUS", lexeme: "+" },
			{ type: "MINUS", lexeme: "-" },
			{ type: "SLASH", lexeme: "/" },
			{ type: "EQUAL", lexeme: "=" },
			{ type: "LESS", lexeme: "<" },
			{ type: "GREATER", lexeme: ">" },
			{ type: "LESS_EQUAL", lexeme: "<=" },
			{ type: "EQUAL_EQUAL", lexeme: "==" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("string", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens(`"hello world"`, error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "STRING", lexeme: `"hello world"`, literal: "hello world" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("unterminated string error", () => {
		let errors: unknown[] = [];
		const error = (err: unknown) => { errors.push(err) };
		const tokens = scanner.scanTokens(`"hello`, error);
		expect(errors).toEqual([{
			message: "unterminated string",
			line: 1,
			column: 0,
			idx: 0
		}]);
	});
	test("unterminated string error 2", () => {
		let errors: unknown[] = [];
		const error = (err: unknown) => { errors.push(err) };
		const tokens = scanner.scanTokens(`+++ "hello`, error);
		expect(errors).toEqual([{
			message: "unterminated string",
			line: 1,
			column: 4,
			idx: 4
		}]);
	});
	test("unterminated string error 3", () => {
		let errors: unknown[] = [];
		const error = (err: unknown) => { errors.push(err) };
		const tokens = scanner.scanTokens(`+++ "hello\n`, error);
		expect(errors).toEqual([{
			message: "unterminated string",
			line: 1,
			column: 4,
			idx: 4
		}]);
	});
	test("single digit integer", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("1", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "NUMBER", lexeme: "1", literal: 1 },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("multi digit integer", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("12", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "NUMBER", lexeme: "12", literal: 12 },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("decimal point", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("1.2", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "NUMBER", lexeme: "1.2", literal: 1.2 },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("multiple decimal places", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("1.23", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "NUMBER", lexeme: "1.23", literal: 1.23 },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("identifier", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("_myVariable1", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "IDENTIFIER", lexeme: "_myVariable1" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("and keyword", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("and", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "AND", lexeme: "and" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("or keyword", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("or", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "OR", lexeme: "or" },
			{ type: "EOF", lexeme: null }
		]);
	});
	test("class keyword", () => {
		const error = mock(() => {});
		const tokens = scanner.scanTokens("class", error);
		expect(error).not.toHaveBeenCalled();
		expect(tokens).toEqual([
			{ type: "CLASS", lexeme: "class" },
			{ type: "EOF", lexeme: null }
		]);
	});
});
