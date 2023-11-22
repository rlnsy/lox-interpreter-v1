import {
  Program,
  Expression,
  Unary,
  Binary,
  Parenthesized,
  Literal,
  ExpressionStatement,
  PrintStatement,
  Declaration,
  VariableDeclaration,
  VariableReference,
} from "./ast";
import { asNotUndefined } from "./util";

export class ParseError extends Error {}

/**
 * If a parse error occurs (a user syntax error was detected) then
 * the error handler will be called and null returned.
 */
function parse(tokens: lox.Token[], errorHandler: lox.ErrorHandler): Program {
  let idx = 0;

  function error(err: lox.Error) {
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
    if (isAtEnd()) {
      throw new Error("at EOF - cannot advance");
    }
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

  let startOfStatement: lox.Token = tokens[0];
  let startOfExpression: lox.Token = tokens[0];

  function expression() {
    if (!isAtEnd()) {
      startOfExpression = peek();
    }
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
      return new Literal(asNotUndefined(previous().literal));
    }
    if (match("IDENTIFIER")) {
      return new VariableReference(previous());
    }
    if (match("LEFT_PAREN")) {
      const start = previous();
      const expr: Expression = expression();
      if (match("RIGHT_PAREN")) {
        return new Parenthesized(expr);
      } else {
        throw error({
          message: `expected closing ')' but found '${peek().lexeme ?? "EOF"}'`,
          location: start.start,
          label: "opened here",
        });
      }
    }
    if (isAtEnd()) {
      throw error({
        message: "reached end of input while parsing expression",
        location: startOfExpression.start,
        label: "expression started here",
      });
    } else if (peek().start.idx === startOfExpression.start.idx) {
      throw error({
        message: `expected start of expression but found '${peek().lexeme}'`,
        location: peek().start,
      });
    } else if (peek().type === "SEMICOLON") {
      throw error({
        message: "unexpected statement terminator while parsing expression",

        location: startOfExpression.start,
        label: "expression started here",
      });
    } else {
      throw error({
        message: `unexpected token '${peek().lexeme}'`,
        location: peek().start,
      });
    }
  }

  function checkStatementTermination() {
    if (!match("SEMICOLON")) {
      // TODO: improve error by keeping track of end of tokens
      if (!isAtEnd()) {
        throw error({
          message: `expected semicolon to end statement but found '${
            peek().lexeme
          }'`,
          location: peek().start,
        });
      } else {
        throw error({
          message: "missing semicolon",
          location: startOfStatement.start,
          label: "statement started here",
        });
      }
    }
  }

  function expressionStatement() {
    const expr = expression();
    checkStatementTermination();
    return new ExpressionStatement(expr);
  }

  function printStatement() {
    const expr = expression();
    checkStatementTermination();
    return new PrintStatement(expr);
  }

  function statement() {
    if (!isAtEnd()) {
      startOfStatement = peek();
    }
    if (match("PRINT")) {
      return printStatement();
    }
    return expressionStatement();
  }

  function declaration() {
    if (!match("VAR")) return statement();
    // variable declaration
    if (!match("IDENTIFIER")) {
      throw error({
        message: `expected an identifier but found '${peek().lexeme}'`,
        location: peek().start,
      });
    }
    const name = previous();
    let initializer: Expression | undefined;
    if (match("EQUAL")) {
      initializer = expression();
    }
    checkStatementTermination();
    return new VariableDeclaration(name, initializer);
  }

  function synchronize() {
    // After a semicolon, we’re probably finished with a statement.
    // Most statements start with a keyword—for, if, return, var, etc.
    // When the next token is any of those, we’re probably about to
    // start a statement.
    if (!isAtEnd()) {
      advance();
    }
    while (!isAtEnd()) {
      if (previous().type === "SEMICOLON") return;
      switch (peek().type) {
        case "VAR":
        case "PRINT":
          return;
      }
      advance();
    }
  }

  function declarations() {
    const decls: Declaration[] = [];
    while (!isAtEnd()) {
      try {
        decls.push(declaration());
      } catch (err) {
        if (err instanceof ParseError) {
          synchronize();
        } else {
          throw err;
        }
      }
    }
    return decls;
  }

  const program = declarations();
  if (!isAtEnd()) {
    throw error({
      message: `unexpected token: '${peek().lexeme}'`,
      location: peek().start,
    });
  }
  return program;
}

export const parser = { parse };
