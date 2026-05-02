import type { ElementNode } from './types.js';

export abstract class BaseGenerator {
  abstract generate(nodes: ElementNode[]): string;
}
