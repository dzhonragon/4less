import { describe, it, expect } from 'vitest';
import { parseInput } from '../src/index.js';
import { ParseError } from '../src/errors.js';

describe('self-closing tags', () => {
    it('renders an element with no content or children as self-closing', () => {
        expect(parseInput('div')).toBe('<div/>');
    });

    it('renders meta with a single attribute as self-closing', () => {
        expect(parseInput('meta charset:"UTF-8"')).toBe('<meta charset="UTF-8"/>');
    });

    it('renders multiple attributes on a self-closing tag', () => {
        expect(parseInput('link rel:"stylesheet" href:"style.css"')).toBe(
            '<link rel="stylesheet" href="style.css"/>'
        );
    });
});

describe('text content', () => {
    it('wraps text in opening and closing tags', () => {
        expect(parseInput('h1 "Hello"')).toBe('<h1>Hello</h1>');
    });

    it('handles text with spaces', () => {
        expect(parseInput('p "some longer text here"')).toBe('<p>some longer text here</p>');
    });

    it('strips the surrounding quotes from the string literal', () => {
        expect(parseInput('title "My Page"')).toBe('<title>My Page</title>');
    });
});

describe('attributes with text content', () => {
    it('applies attributes and wraps text content', () => {
        expect(parseInput('a "Home" href:"/"')).toBe('<a href="/">Home</a>');
    });

    it('handles multiple attributes alongside text content', () => {
        expect(parseInput('input "label" type:"text" name:"field"')).toBe(
            '<input type="text" name="field">label</input>'
        );
    });
});

describe('nested elements', () => {
    it('renders a single child element inside a parent', () => {
        expect(parseInput('div { span "text" }')).toBe('<div><span>text</span></div>');
    });

    it('renders siblings inside a parent', () => {
        expect(parseInput('ul { li "one" li "two" li "three" }')).toBe(
            '<ul><li>one</li><li>two</li><li>three</li></ul>'
        );
    });

    it('handles deep nesting', () => {
        expect(parseInput('section { article { p "deep" } }')).toBe(
            '<section><article><p>deep</p></article></section>'
        );
    });

    it('keeps parent attributes when there are children', () => {
        expect(parseInput('div class:"box" { span "hi" }')).toBe(
            '<div class="box"><span>hi</span></div>'
        );
    });
});

describe('multiple root elements', () => {
    it('concatenates two root elements', () => {
        expect(parseInput('h1 "Title"\np "Body"')).toBe('<h1>Title</h1><p>Body</p>');
    });

    it('builds a full head and body structure', () => {
        const input = `
            head {
                meta charset:"UTF-8"
                title "Page"
                link rel:"stylesheet" href:"style.css"
            }
            body {
                div class:"container" {
                    h1 "Hello"
                    p "World"
                }
            }
        `;
        expect(parseInput(input)).toBe(
            '<head>' +
                '<meta charset="UTF-8"/>' +
                '<title>Page</title>' +
                '<link rel="stylesheet" href="style.css"/>' +
            '</head>' +
            '<body>' +
                '<div class="container">' +
                    '<h1>Hello</h1>' +
                    '<p>World</p>' +
                '</div>' +
            '</body>'
        );
    });
});

describe('class shorthand', () => {
    it('converts .class to a class attribute', () => {
        expect(parseInput('div.container')).toBe('<div class="container"/>');
    });

    it('joins multiple classes with a space', () => {
        expect(parseInput('div.foo.bar')).toBe('<div class="foo bar"/>');
    });

    it('works alongside regular attributes', () => {
        expect(parseInput('input.field type:"text"')).toBe('<input class="field" type="text"/>');
    });

    it('works with text content', () => {
        expect(parseInput('p.lead "intro text"')).toBe('<p class="lead">intro text</p>');
    });

    it('works with children', () => {
        expect(parseInput('div.wrapper { span "hi" }')).toBe('<div class="wrapper"><span>hi</span></div>');
    });
});

describe('id shorthand', () => {
    it('converts #id to an id attribute', () => {
        expect(parseInput('div#main')).toBe('<div id="main"/>');
    });

    it('combines id and class shorthands, id first', () => {
        expect(parseInput('div#app.container')).toBe('<div id="app" class="container"/>');
    });

    it('works with regular attributes and text', () => {
        expect(parseInput('section#hero "Welcome" role:"banner"')).toBe(
            '<section id="hero" role="banner">Welcome</section>'
        );
    });
});

describe('error reporting', () => {
    it('throws a ParseError for unexpected tokens', () => {
        expect(() => parseInput('{ orphan }')).toThrow(ParseError);
    });

    it('includes line and column info in the error message', () => {
        expect(() => parseInput('{ orphan }')).toThrow(/line 1:\d+/);
    });

    it('throws a ParseError when a string is unclosed', () => {
        expect(() => parseInput('div "unclosed')).toThrow(ParseError);
    });

    it('reports multiple errors at once', () => {
        try {
            parseInput('@invalid ##bad');
        } catch (err) {
            expect(err).toBeInstanceOf(ParseError);
            expect(err.errors.length).toBeGreaterThan(0);
        }
    });
});
