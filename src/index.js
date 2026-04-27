import antlr4 from 'antlr4';
import GrammarLexer from './parser/GrammarLexer.js';
import GrammarParser from './parser/GrammarParser.js';
import GrammarVisitor from './parser/GrammarVisitor.js';
import { ParseError, ErrorCollector } from './errors.js';

class HtmlGenerator extends GrammarVisitor {
    visitProg(ctx) {
        return ctx.element().map(e => this.visit(e)).join('');
    }

    visitElementBlock(ctx) {
        const tag = ctx.ID().getText();

        const shorthands = ctx.shorthand().map(s => this.visit(s));
        const classes = shorthands.filter(s => s.type === 'class').map(s => s.value);
        const id = shorthands.find(s => s.type === 'id')?.value;

        const shorthandAttrs = [
            id ? `id="${id}"` : null,
            classes.length ? `class="${classes.join(' ')}"` : null,
        ].filter(Boolean).join(' ');

        const attrs = ctx.attribute().map(a => this.visit(a)).join(' ');
        const allAttrs = [shorthandAttrs, attrs].filter(Boolean).join(' ');

        const content = ctx.STRING() ? ctx.STRING().getText().replace(/"/g, '') : '';
        const children = ctx.element().map(e => this.visit(e)).join('');

        if (children) {
            return `<${tag}${allAttrs ? ' ' + allAttrs : ''}>${children}</${tag}>`;
        } else if (content) {
            return `<${tag}${allAttrs ? ' ' + allAttrs : ''}>${content}</${tag}>`;
        } else {
            return `<${tag}${allAttrs ? ' ' + allAttrs : ''}/>`;
        }
    }

    visitClassShorthand(ctx) {
        return { type: 'class', value: ctx.ID().getText() };
    }

    visitIdShorthand(ctx) {
        return { type: 'id', value: ctx.ID().getText() };
    }

    visitAttribute(ctx) {
        const key = ctx.ID().getText();
        const value = ctx.STRING().getText();
        return `${key}=${value}`;
    }
}

export function parseInput(input) {
    const chars = new antlr4.InputStream(input);
    const lexer = new GrammarLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new GrammarParser(tokens);

    const collector = new ErrorCollector();
    lexer.removeErrorListeners();
    lexer.addErrorListener(collector);
    parser.removeErrorListeners();
    parser.addErrorListener(collector);

    parser.buildParseTrees = true;
    const tree = parser.prog();

    if (collector.errors.length > 0) {
        throw new ParseError(collector.errors);
    }

    return new HtmlGenerator().visit(tree);
}
