import {
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
  Assignment,
  Block,
} from "./ast";
import { asNotUndefined } from "./util";

export class ParseError extends Error {
  constructor(public error: LoxError) {
    super();
  }
}

class Parser {
  private idx = 0;
  private tokens: LoxToken[];
  private errorHandler: LoxErrorHandler;
  private startOfStatement: LoxToken;
  private startOfExpression: LoxToken;

  constructor(tokens: LoxToken[], errorHandler: LoxErrorHandler) {
    this.tokens = tokens;
    this.errorHandler = errorHandler;
    this.startOfStatement = this.tokens[0];
    this.startOfExpression = this.tokens[0];
  }

  error(err: LoxError) {
    this.errorHandler(err);
    return new ParseError(err);
  }

  peek() {
    return this.tokens[this.idx];
  }

  isAtEnd() {
    return this.peek().type === "EOF";
  }

  // consumes the current token and returns it
  advance() {
    if (this.isAtEnd()) {
      throw new Error("at EOF - cannot advance");
    }
    const next = this.peek();
    this.idx++;
    return next;
  }

  previous() {
    return this.tokens[this.idx - 1];
  }

  // returns true if the current token is of the given type
  check(type: LoxTokenType) {
    return this.peek().type === type;
  }

  match(...types: LoxTokenType[]): boolean {
    const isMatch = types.some((type) => this.check(type));
    if (isMatch) {
      this.advance();
    }
    return isMatch;
  }

  expression() {
    if (!this.isAtEnd()) {
      this.startOfExpression = this.peek();
    }
    return this.assignment();
  }

  assignment(): Expression {
    const l = this.equality();
    if (this.match("EQUAL")) {
      if (l instanceof VariableReference) {
        const r = this.expression();
        return new Assignment(l.name, r);
      }
      throw this.error({
        message: "left side of assignment is invalid",
        location: this.previous().start,
      });
    }
    return l;
  }

  equality() {
    let left = this.comparison();
    while (this.match("BANG_EQUAL") || this.match("EQUAL_EQUAL")) {
      const op = this.previous();
      const right = this.comparison();
      left = new Binary(op, left, right);
    }
    return left;
  }

  comparison() {
    let left = this.term();
    while (
      this.match("GREATER") ||
      this.match("GREATER_EQUAL") ||
      this.match("LESS") ||
      this.match("LESS_EQUAL")
    ) {
      const op = this.previous();
      const right = this.term();
      left = new Binary(op, left, right);
    }
    return left;
  }

  term() {
    let left = this.factor();
    while (this.match("MINUS") || this.match("PLUS")) {
      const op = this.previous();
      const right = this.factor();
      left = new Binary(op, left, right);
    }
    return left;
  }

  factor() {
    let left = this.unary();
    while (this.match("SLASH") || this.match("STAR")) {
      const op = this.previous();
      const right = this.unary();
      left = new Binary(op, left, right);
    }
    return left;
  }

  unary(): Expression {
    if (this.match("MINUS") || this.match("BANG")) {
      return new Unary(this.previous(), this.unary());
    }
    return this.primary();
  }

  primary() {
    if (this.match("TRUE")) return new Literal(true);
    if (this.match("FALSE")) return new Literal(false);
    if (this.match("NIL")) return new Literal(null);
    if (this.match("NUMBER") || this.match("STRING")) {
      return new Literal(asNotUndefined(this.previous().literal));
    }
    if (this.match("IDENTIFIER")) {
      return new VariableReference(this.previous());
    }
    if (this.match("LEFT_PAREN")) {
      const start = this.previous();
      const expr: Expression = this.expression();
      if (this.match("RIGHT_PAREN")) {
        return new Parenthesized(expr);
      } else {
        throw this.error({
          message: `expected closing ')' but found '${
            this.peek().lexeme ?? "EOF"
          }'`,
          location: start.start,
          label: "opened here",
        });
      }
    }
    if (this.isAtEnd()) {
      throw this.error({
        message: "reached end of input while parsing expression",
        location: this.startOfExpression.start,
        label: "expression started here",
      });
    } else if (this.peek().start.idx === this.startOfExpression.start.idx) {
      throw this.error({
        message: `expected start of expression but found '${
          this.peek().lexeme
        }'`,
        location: this.peek().start,
      });
    } else if (this.peek().type === "SEMICOLON") {
      throw this.error({
        message: "unexpected statement terminator while parsing expression",

        location: this.startOfExpression.start,
        label: "expression started here",
      });
    } else {
      throw this.error({
        message: `unexpected token '${this.peek().lexeme}'`,
        location: this.peek().start,
      });
    }
  }

  checkStatementTermination() {
    if (!this.match("SEMICOLON")) {
      // TODO: improve error by keeping track of end of tokens
      if (!this.isAtEnd()) {
        throw this.error({
          message: `expected semicolon to end statement but found '${
            this.peek().lexeme
          }'`,
          location: this.peek().start,
        });
      } else {
        throw this.error({
          message: "missing semicolon",
          location: this.startOfStatement.start,
          label: "statement started here",
        });
      }
    }
  }

  expressionStatement() {
    const expr = this.expression();
    this.checkStatementTermination();
    return new ExpressionStatement(expr);
  }

  printStatement() {
    const expr = this.expression();
    this.checkStatementTermination();
    return new PrintStatement(expr);
  }

  block() {
    const start = this.previous();
    const statements: Declaration[] = [];
    while (!this.isAtEnd() && !this.check("RIGHT_BRACE")) {
      statements.push(this.declaration());
    }
    if (!this.match("RIGHT_BRACE")) {
      throw this.error({
        message: `expected closing '}' but found '${
          this.peek().lexeme ?? "EOF"
        }'`,
        location: start.start,
        label: "opened here",
      });
    }
    return statements;
  }

  statement() {
    if (!this.isAtEnd()) {
      this.startOfStatement = this.peek();
    }
    if (this.match("PRINT")) {
      return this.printStatement();
    } else if (this.match("LEFT_BRACE")) {
      return new Block(this.block());
    }
    return this.expressionStatement();
  }

  declaration() {
    if (!this.match("VAR")) return this.statement();
    // variable declaration
    if (!this.match("IDENTIFIER")) {
      throw this.error({
        message: `expected an identifier but found '${this.peek().lexeme}'`,
        location: this.peek().start,
      });
    }
    const name = this.previous();
    let initializer: Expression | undefined;
    if (this.match("EQUAL")) {
      initializer = this.expression();
    }
    this.checkStatementTermination();
    return new VariableDeclaration(name, initializer);
  }

  synchronize() {
    // After a semicolon, we’re probably finished with a statement.
    // Most statements start with a keyword—for, if, return, var, etc.
    // When the next token is any of those, we’re probably about to
    // start a statement.
    if (!this.isAtEnd()) {
      this.advance();
    }
    while (!this.isAtEnd()) {
      if (this.previous().type === "SEMICOLON") return;
      switch (this.peek().type) {
        case "VAR":
        case "PRINT":
          return;
      }
      this.advance();
    }
  }

  declarations() {
    const decls: Declaration[] = [];
    while (!this.isAtEnd()) {
      try {
        decls.push(this.declaration());
      } catch (err) {
        if (err instanceof ParseError) {
          this.synchronize();
        } else {
          throw err;
        }
      }
    }
    return decls;
  }

  parse() {
    const program = this.declarations();
    if (!this.isAtEnd()) {
      throw this.error({
        message: `unexpected token: '${this.peek().lexeme}'`,
        location: this.peek().start,
      });
    }
    return program;
  }
}

export const parser = {
  parse: (tokens: LoxToken[], errorHandler: LoxErrorHandler) =>
    new Parser(tokens, errorHandler).parse(),
  parseExpression: (tokens: LoxToken[]) =>
    new Parser(tokens, () => {}).expression(),
};
