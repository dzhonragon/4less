import { BaseGenerator } from './base.js';
import type { AstNode } from '../core/types.js';

export class JsonGenerator extends BaseGenerator {
  constructor(private indent: number = 2) {
    super();
  }

  generate(nodes: AstNode[]): string {
    return JSON.stringify(nodes, null, this.indent);
  }
}
