import antlr4 from "antlr4";
import GrammarLexer from "./parser/GrammarLexer.js";
import GrammarParser from "./parser/GrammarParser.js";
import GrammarVisitor from "./parser/GrammarVisitor.js";

class HtmlGenerator extends GrammarVisitor {
    visitProg(ctx) {
        // concatena tudo sem quebras de linha
        return ctx.element().map(e => this.visit(e)).join("");
    }

    visitElementBlock(ctx) {
        const tag = ctx.ID().getText();

        // atributos
        const attrs = ctx.attribute().map(attr => this.visit(attr)).join(" ");

        // conteúdo direto (STRING)
        const content = ctx.STRING() ? ctx.STRING().getText().replace(/"/g, "") : "";

        // filhos
        const children = ctx.element().map(e => this.visit(e)).join("");

        if (children) {
            return `<${tag}${attrs ? " " + attrs : ""}>${children}</${tag}>`;
        } else if (content) {
            return `<${tag}${attrs ? " " + attrs : ""}>${content}</${tag}>`;
        } else {
            return `<${tag}${attrs ? " " + attrs : ""}/>`;
        }
    }

    visitAttribute(ctx) {
        const key = ctx.ID().getText();
        const value = ctx.STRING().getText();
        return `${key}=${value}`;
    }
}

function parseInput(input) {
    const chars = new antlr4.InputStream(input);
    const lexer = new GrammarLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new GrammarParser(tokens);

    parser.buildParseTrees = true;
    const tree = parser.prog();

    const generator = new HtmlGenerator();
    return generator.visit(tree);
}

// Teste
const input = `
head {
    meta charset:"UTF-8"
    title "Pagina"
    link rel:"stylesheet" href:"style.css"
}
body {
    div class:"container" {
        h1 "Pirocada"
    }
}
`;

console.log(parseInput(input));
