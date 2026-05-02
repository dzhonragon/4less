import { BaseGenerator } from './base.js';
import type { ElementNode, TextSegment } from '../core/types.js';

// HTML attributes that must be renamed for React
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
  generate(nodes: ElementNode[]): string {
    if (nodes.length === 1) {
      return this.renderElement(nodes[0]);
    }
    const children = nodes.map(n => this.renderElement(n)).join(', ');
    return `React.createElement(React.Fragment, null, ${children})`;
  }

  private renderElement(node: ElementNode): string {
    const props = this.buildProps(node);
    const propsArg = props ? `, ${props}` : ', null';

    if (node.children.length > 0) {
      const children = node.children.map(c => this.renderElement(c)).join(', ');
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

  private buildProps(node: ElementNode): string {
    const props: string[] = [];

    if (node.id) {
      props.push(`id: ${JSON.stringify(node.id)}`);
    }

    if (node.classes.length > 0) {
      props.push(`className: ${JSON.stringify(node.classes.join(' '))}`);
    }

    for (const [key, value] of Object.entries(node.attributes)) {
      const reactKey = REACT_PROP_MAP[key] ?? key;
      props.push(`${reactKey}: ${JSON.stringify(value)}`);
    }

    if (props.length === 0) return '';
    return `{ ${props.join(', ')} }`;
  }
}
