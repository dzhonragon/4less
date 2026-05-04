export type TokenType =
  | 'ID'
  | 'STRING'
  | 'VAR'
  | 'DOT'
  | 'HASH'
  | 'COLON'
  | 'LBRACE'
  | 'RBRACE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string | null;
  line: number;
  col: number;
}

export type TextSegment =
  | { kind: 'literal'; value: string }
  | { kind: 'var'; name: string };

export type VarValue = string | string[] | boolean;
export type VarsMap = Record<string, VarValue>;

export type AstNode = ElementNode | LoopNode | CondNode | ComponentDefNode | ComponentCallNode;

export interface ComponentDefNode {
  type: 'component_def';
  name: string;
  body: AstNode[];
}

export interface ComponentCallNode {
  type: 'component_call';
  name: string;
  props: Record<string, string>;
  line: number;
  col: number;
}

export interface LoopNode {
  type: 'loop';
  variable: string;
  iterable: string;
  body: ElementNode;
}

export interface CondNode {
  type: 'cond';
  condition: string;
  body: AstNode;
}

export interface ElementNode {
  type: 'element';
  tag: string;
  id: string | null;
  classes: string[];
  attributes: Record<string, string>;
  text: TextSegment[] | null;
  children: AstNode[];
}
