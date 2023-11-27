type LoxTokenType =
  | "EOF"
  // Single-character tokens
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "COMMA"
  | "DOT"
  | "MINUS"
  | "PLUS"
  | "SEMICOLON"
  | "SLASH"
  | "STAR"
  // One or two character tokens
  | "BANG"
  | "BANG_EQUAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "GREATER"
  | "GREATER_EQUAL"
  | "LESS"
  | "LESS_EQUAL"
  // Literals
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  // Keywords
  | "AND"
  | "CLASS"
  | "ELSE"
  | "FALSE"
  | "FUN"
  | "FOR"
  | "IF"
  | "NIL"
  | "OR"
  | "PRINT"
  | "RETURN"
  | "SUPER"
  | "THIS"
  | "TRUE"
  | "VAR"
  | "WHILE";

type LoxLocation = {
  line: number; // line number in the program
  column: number; // column index in the line
  idx: number; // global index in the source string
};

type LoxValue = number | string | boolean | null; // internal value representation

type LoxToken = {
  type: TokenType;
  lexeme: string;
  literal?: Value;
  start: Location;
};

type LoxError = {
  message: string;
  location: LoxLocation;
  label?: string;
};

type LoxErrorHandler = (error: LoxError) => void;
