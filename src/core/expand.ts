import type { AstNode, CondNode, ElementNode, TextSegment } from './types.js';
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
      if (expanded.length !== 1) {
        throw new ParseError([{ line: 0, col: 0, message: `component in conditional must expand to a single root element` }]);
      }
      let elseBody: AstNode | null = null;
      if (node.elseBody !== null) {
        const expandedElse = expandNode(node.elseBody, registry, props, expanding);
        if (expandedElse.length === 1) {
          elseBody = expandedElse[0];
        } else if (expandedElse.length > 1) {
          throw new ParseError([{ line: 0, col: 0, message: `component in else-branch must expand to a single root element` }]);
        }
      }
      return [{ ...node, body: expanded[0], elseBody }];
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
    text: node.text ? substituteSegments(node.text, props) : null,
    attributes: Object.fromEntries(
      Object.entries(node.attributes).map(([k, segs]) => [k, substituteSegments(segs, props)])
    ),
    children: node.children.flatMap(c => expandNode(c, registry, props, expanding)),
  };
}

function substituteSegments(segments: TextSegment[], props: Record<string, string>): TextSegment[] {
  return segments.map(seg =>
    seg.kind === 'var' && seg.name in props
      ? { kind: 'literal', value: props[seg.name] }
      : seg
  );
}
