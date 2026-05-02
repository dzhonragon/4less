export type TokenType =
  | 'ID'
  | 'STRING'
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

export interface ElementNode {
  type: 'element';
  tag: string;
  id: string | null;
  classes: string[];
  attributes: Record<string, string>;
  text: string | null;
  children: ElementNode[];
}
