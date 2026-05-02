export interface ErrorLocation {
  line: number;
  col: number;
  message: string;
}

export class ParseError extends Error {
  readonly errors: ErrorLocation[];

  constructor(errors: ErrorLocation[]) {
    super(errors.map(e => `line ${e.line}:${e.col} ${e.message}`).join('\n'));
    this.name = 'ParseError';
    this.errors = errors;
  }
}
