import type { ElementNode } from '../core/types.js';

export abstract class BaseGenerator {
  abstract generate(nodes: ElementNode[]): string;
}
