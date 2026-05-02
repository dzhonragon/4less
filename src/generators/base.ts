import type { AstNode } from '../core/types.js';

export abstract class BaseGenerator {
  abstract generate(nodes: AstNode[]): string;
}
