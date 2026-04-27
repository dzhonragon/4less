import antlr4 from 'antlr4';

export class ParseError extends Error {
    constructor(errors) {
        super(errors.join('\n'));
        this.name = 'ParseError';
        this.errors = errors;
    }
}

export class ErrorCollector extends antlr4.error.ErrorListener {
    constructor() {
        super();
        this.errors = [];
    }

    syntaxError(recognizer, offendingSymbol, line, column, msg) {
        this.errors.push(`line ${line}:${column} ${msg}`);
    }
}
