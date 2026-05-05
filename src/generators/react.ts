import { BaseGenerator } from './base.js';
import type { AstNode, CondNode, ElementNode, LoopNode, TextSegment } from '../core/types.js';

const REACT_PROP_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  rowspan: 'rowSpan',
  colspan: 'colSpan',
  usemap: 'useMap',
  frameborder: 'frameBorder',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  enctype: 'encType',
  formaction: 'formAction',
  datetime: 'dateTime',
  accesskey: 'accessKey',
};

export class ReactGenerator extends BaseGenerator {
  generate(nodes: AstNode[]): string {
    if (nodes.length === 1) return this.renderNode(nodes[0]);
    const children = nodes.map(n => this.renderNode(n)).join(', ');
    return `React.createElement(React.Fragment, null, ${children})`;
  }

  private renderNode(node: AstNode): string {
    if (node.type === 'loop') return this.renderLoop(node);
    if (node.type === 'cond') return this.renderCond(node);
    if (node.type === 'element') return this.renderElement(node);
    throw new Error(`component node '${node.type}' must be expanded before generation`);
  }

  private renderLoop(node: LoopNode): string {
    const bodyExpr = this.renderElement(node.body);
    return `${node.iterable}.map((${node.variable}) => ${bodyExpr})`;
  }

  private renderCond(node: CondNode): string {
    const condExpr = node.negate ? `!${node.condition}` : node.condition;
    const bodyExpr = this.renderNode(node.body);
    if (node.elseBody != null) {
      const elseExpr = this.renderNode(node.elseBody);
      return `${condExpr} ? ${bodyExpr} : ${elseExpr}`;
    }
    return `${condExpr} ? ${bodyExpr} : null`;
  }

  private renderElement(node: ElementNode): string {
    const props = this.buildProps(node);
    const propsArg = props ? `, ${props}` : ', null';

    if (node.children.length > 0) {
      const children = node.children.map(c => this.renderNode(c)).join(', ');
      return `React.createElement('${node.tag}'${propsArg}, ${children})`;
    }

    if (node.text !== null) {
      const textArgs = this.renderTextArgs(node.text).join(', ');
      return `React.createElement('${node.tag}'${propsArg}, ${textArgs})`;
    }

    return `React.createElement('${node.tag}'${propsArg})`;
  }

  private renderTextArgs(segments: TextSegment[]): string[] {
    return segments.map(seg =>
      seg.kind === 'literal' ? JSON.stringify(seg.value) : seg.name
    );
  }

  /** Renders attribute TextSegment[] as a JS expression (string literal or template literal). */
  private renderAttrExpr(segments: TextSegment[]): string {
    if (segments.length === 1 && segments[0].kind === 'literal') {
      return JSON.stringify(segments[0].value);
    }
    const parts = segments.map(seg =>
      seg.kind === 'literal'
        ? seg.value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
        : `\${${seg.name}}`
    ).join('');
    return `\`${parts}\``;
  }

  private buildProps(node: ElementNode): string {
    const props: string[] = [];
    if (node.id) props.push(`id: ${JSON.stringify(node.id)}`);
    if (node.classes.length > 0) {
      props.push(`className: ${JSON.stringify(node.classes.join(' '))}`);
    }
    for (const [key, segs] of Object.entries(node.attributes)) {
      const reactKey = REACT_PROP_MAP[key] ?? key;
      props.push(`${reactKey}: ${this.renderAttrExpr(segs)}`);
    }
    if (props.length === 0) return '';
    return `{ ${props.join(', ')} }`;
  }
}
