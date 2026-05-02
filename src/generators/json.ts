import { BaseGenerator } from '../generator.js';
import type { ElementNode } from '../types.js';

export class JsonGenerator extends BaseGenerator {
  constructor(private indent: number = 2) {
    super();
  }

  generate(nodes: ElementNode[]): string {
    return JSON.stringify(nodes, null, this.indent);
  }
}
