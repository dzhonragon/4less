import type { AstNode, ElementNode, TextSegment } from './types.js';
import { ParseError } from '../errors.js';

type Registry = Map<string, AstNode[]>;

export function expandComponents(nodes: AstNode[]): AstNode[] {
  const registry: Registry = new Map();
  for (const node of nodes) {
    if (node.type === 'component_def') {
      registry.set(node.name, node.body);
    }
  }
  return nodes.flatMap(n => expandNode(n, registry, {}, new Set()));
}

function expandNode(
  node: AstNode,
  registry: Registry,
  props: Record<string, string>,
  expanding: ReadonlySet<string>,
): AstNode[] {
  switch (node.type) {
    case 'component_def':
      return [];

    case 'component_call': {
      if (expanding.has(node.name)) {
        throw new ParseError([{ line: node.line, col: node.col, message: `circular component reference: '${node.name}'` }]);
      }
      const body = registry.get(node.name);
      if (!body) {
        throw new ParseError([{ line: node.line, col: node.col, message: `unknown component '${node.name}'` }]);
      }
      const merged = { ...props, ...node.props };
      const next = new Set(expanding).add(node.name);
      return body.flatMap(n => expandNode(n, registry, merged, next));
    }

    case 'loop':
      return [{ ...node, body: expandElementNode(node.body, registry, props, expanding) }];

    case 'cond': {
      const expanded = expandNode(node.body, registry, props, expanding);
      if (expanded.length === 0) return [];
      if (expanded.length === 1) return [{ ...node, body: expanded[0] }];
      throw new ParseError([{ line: 0, col: 0, message: `component in conditional must expand to a single root element` }]);
    }

    case 'element':
      return [expandElementNode(node, registry, props, expanding)];
  }
}

function expandElementNode(
  node: ElementNode,
  registry: Registry,
  props: Record<string, string>,
  expanding: ReadonlySet<string>,
): ElementNode {
  return {
    ...node,
    text: node.text ? substituteProps(node.text, props) : null,
    children: node.children.flatMap(c => expandNode(c, registry, props, expanding)),
  };
}

function substituteProps(segments: TextSegment[], props: Record<string, string>): TextSegment[] {
  return segments.map(seg =>
    seg.kind === 'var' && seg.name in props
      ? { kind: 'literal', value: props[seg.name] }
      : seg
  );
}
