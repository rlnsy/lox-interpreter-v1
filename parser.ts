import {
  Expression,
  Unary,
  Binary,
  Parenthesized,
  Literal,
} from "./expression";

export class ParseError extends Error {}

/**
 * If a parse error occurs (a user syntax error was detected) then
 * the error handler will be called and null returned.
 */
function parse(
  tokens: lox.Token[],
  errorHandler: lox.ParseErrorHandler,
): Expression | null {
  let idx = 0;

  function error(err: lox.ParseError) {
    errorHandler(err);
    return new ParseError();
  }

  function peek() {
    return tokens[idx];
  }

  function isAtEnd() {
    return peek().type === "EOF";
  }

  // consumes the current token and returns it
  function advance() {
    const next = peek();
    idx++;
    return next;
  }

  function previous() {
    return tokens[idx - 1];
  }

  // returns true if the current token is of the given type
  function check(type: lox.TokenType) {
    return peek().type === type;
  }

  function match(...types: lox.TokenType[]): boolean {
    const isMatch = types.some((type) => check(type));
    if (isMatch) {
      advance();
    }
    return isMatch;
  }

  function expression() {
    return equality();
  }

  function equality() {
    let left = comparison();
    while (match("BANG_EQUAL") || match("EQUAL_EQUAL")) {
      const op = previous();
      const right = comparison();
      left = new Binary(op, left, right);
    }
    return left;
  }

  function comparison() {
    let left = term();
    while (
      match("GREATER") ||
      match("GREATER_EQUAL") ||
      match("LESS") ||
      match("LESS_EQUAL")
    ) {
      const op = previous();
      const right = term();
      left = new Binary(op, left, right);
    }
    return left;
  }

  function term() {
    let left = factor();
    while (match("MINUS") || match("PLUS")) {
      const op = previous();
      const right = factor();
      left = new Binary(op, left, right);
    }
    return left;
  }

  function factor() {
    let left = unary();
    while (match("SLASH") || match("STAR")) {
      const op = previous();
      const right = unary();
      left = new Binary(op, left, right);
    }
    return left;
  }

  function unary(): Expression {
    if (match("MINUS") || match("BANG")) {
      return new Unary(previous(), unary());
    }
    return primary();
  }

  function primary() {
    if (match("TRUE")) return new Literal(true);
    if (match("FALSE")) return new Literal(false);
    if (match("NIL")) return new Literal(null);
    if (match("NUMBER") || match("STRING")) {
      return new Literal(previous().literal);
    }
    if (match("LEFT_PAREN")) {
      const expr: Expression = expression();
      if (match("RIGHT_PAREN")) {
        return new Parenthesized(expr);
      } else {
        throw error({
          message: `expected closing ')' but found '${peek().lexeme ?? "EOF"}'`,
        });
      }
    }
    if (isAtEnd()) {
      throw error({ message: "reached end of input while parsing expression" });
    } else {
      throw error({
        message: `expected an expression but found '${peek().lexeme}'`,
      });
    }
  }

  try {
    const expr = expression();
    if (!isAtEnd()) {
      throw error({ message: `unexpected token: '${peek().lexeme}'` });
    }
    return expr;
  } catch (error) {
    if (error instanceof ParseError) {
      return null;
    }
    throw error;
  }
}

export const parser = { parse };
