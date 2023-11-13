declare global {
	namespace scanner {
		type tokenType = "EOF"
		// Single-character tokens
| "LEFT_PAREN" | "RIGHT_PAREN" | "LEFT_BRACE" | "RIGHT_BRACE"
| "COMMA" | "DOT" | "MINUS" | "PLUS" | "SEMICOLON" | "SLASH" | "STAR"
		// One or two character tokens
| "BANG" | "BANG_EQUAL" | "EQUAL" | "EQUAL_EQUAL"
| "GREATER" | "GREATER_EQUAL" | "LESS" | "LESS_EQUAL"
		// Literals
| "IDENTIFIER" | "STRING" | "NUMBER"
		// Keywords
| "AND" | "CLASS" | "ELSE" | "FALSE" | "FUN" | "FOR" | "IF" | "NIL"
| "OR" | "PRINT" | "RETURN" | "SUPER" | "THIS" | "TRUE" | "VAR"
| "WHILE";
		type token = {
			type: scanner.tokenType;
			lexeme: string | null;
			literal?: unknown;
		}
	}
}

type char = string;

const NULL_CHAR = '\0';

function isDigit(c: char) {
	return c >= '0' && c <= '9';
}

function isAlpha(c: char) {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

const keywords: Record<string, scanner.tokenType> = {
  and: "AND",
  class: "CLASS",
  else: "ELSE",
  false: "FALSE",
  for: "FOR",
  fun: "FUN",
  if: "IF",
  nil: "NIL",
  or: "OR",
  print: "PRINT",
  return: "RETURN",
  super: "SUPER",
  this: "THIS",
  true: "TRUE",
  var: "VAR",
  while: "WHILE"
}

function scanTokens(source: string, error: lox.runErrorHandlerFn): scanner.token[] {
	const tokens: scanner.token[] = [];
	let line = 1;
	let idx = 0; // global cursor
	let start = idx; // start of current token
	let lineStart = idx; // start of current line
	function isAtEnd() {
		return !(idx < source.length);
	}
	function addToken(type: scanner.tokenType, literal?: unknown) {
		tokens.push({ type, lexeme: source.slice(start, idx), literal })
	}
	function advance() {
		const c = source[idx];
		idx++;
		return c;
	}
	function match(expected: char) {
		if (isAtEnd()) return false;
		if (source[idx] !== expected) return false;
		idx++;
		return true;
	}
	function peek() {
		if (isAtEnd()) return NULL_CHAR;
		return source[idx];
	}
	function peekNext() {
		if (idx + 1 >= source.length) return NULL_CHAR;
		return source[idx + 1];
	}
	function skip() {}
	function newline() { line++; lineStart = idx; }
	function slash() {
		if (match('/')) {
			// comment - goes to end of line
			while (peek() != '\n' && !isAtEnd()) advance();
		} else {
			addToken("SLASH");
		}
	}
	function string(startLine: number, lineStart: number) {
		while (peek() != '"' && !isAtEnd()) {
			if (peek() == '\n') newline();
			advance();
		}
		if (isAtEnd()) {
			return error({
				message: "unterminated string",
				line: startLine,
				column: start - lineStart,
				idx: start
			});
		}
		advance(); // closing quote
		addToken("STRING", source.slice(start + 1, idx - 1));
	}
	function number() {
		while (isDigit(peek())) advance();
		if (peek() == '.' && isDigit(peekNext())) {
			advance(); // point
			while (isDigit(peek())) advance();
		}
		addToken("NUMBER", parseFloat(source.slice(start, idx)));
	}
	function identifier() {
		let c;
		while ((c = peek(), isAlpha(c) || isDigit(c) || c == '_')) advance();
		addToken(keywords[source.slice(start, idx)] || "IDENTIFIER");
	}
	function scanToken() {
		const charIdx = idx;
		const charLine = line;
		const c = advance();
		switch(c) {
		// Ignore whitespace.
			case ' ':
      			case '\r':
      			case '\t': return skip();
      			case '\n': return newline();
case '(': return addToken("LEFT_PAREN")
case ')': return addToken("RIGHT_PAREN")
case '{': return addToken("LEFT_BRACE")
case '}': return addToken("RIGHT_BRACE")
case ',': return addToken("COMMA")
case '.': return addToken("DOT")
case '-': return addToken("MINUS")
case '+': return addToken("PLUS")
case ';': return addToken("SEMICOLON")
case '*': return addToken("STAR")
case '!': return addToken(match('=') ? "BANG_EQUAL" : "BANG")
case '=': return addToken(match('=') ? "EQUAL_EQUAL" : "EQUAL")
case '<': return addToken(match('=') ? "LESS_EQUAL" : "LESS")
case '>': return addToken(match('=') ? "GREATER_EQUAL" : "GREATER")
case '/': return slash()
case '"': return string(line, lineStart)
		default:
			if (isDigit(c)) {
				return number();
			} else if (isAlpha(c) || c == '_') {
				return identifier();
			}
			return error({
				message: "unexpected character",
				line: charLine,
				column: charIdx - lineStart,
				idx: charIdx
			})
		}

	}
	while (!isAtEnd()) {
		start = idx;
		scanToken();
	}
	tokens.push({ type: "EOF", lexeme: null });
	return tokens;
}

export const scanner = {
	scanTokens
};
