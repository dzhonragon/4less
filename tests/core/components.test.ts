import { describe, it, expect } from 'vitest';
import { compile, parse, generate, expandComponents, ParseError, HtmlGenerator, ReactGenerator, VueGenerator, AstroGenerator } from '../../src/index.js';

describe('component definition and call', () => {
  it('defines a component and expands it', () => {
    expect(compile('component Badge { span.badge $text } Badge text:"new"')).toBe(
      '<span class="badge">new</span>'
    );
  });

  it('component with no props renders with placeholder vars', () => {
    expect(compile('component Icon { span.icon } Icon')).toBe('<span class="icon"></span>');
  });

  it('component definition is not emitted itself', () => {
    expect(compile('component Foo { div } ')).toBe('');
  });

  it('component called multiple times', () => {
    expect(compile('component Tag { span $label } Tag label:"a" Tag label:"b"')).toBe(
      '<span>a</span><span>b</span>'
    );
  });

  it('component can be defined after its call (forward reference)', () => {
    expect(compile('Badge text:"ok" component Badge { span.badge $text }')).toBe(
      '<span class="badge">ok</span>'
    );
  });
});

describe('component props', () => {
  it('substitutes a single prop', () => {
    expect(compile('component Btn { button $label } Btn label:"Click"')).toBe('<button>Click</button>');
  });

  it('substitutes multiple props', () => {
    expect(compile('component Link { a $text } Link text:"Home"')).toBe('<a>Home</a>');
  });

  it('unresolved prop renders as {{varName}} placeholder', () => {
    expect(compile('component Btn { button $label } Btn')).toBe('<button>{{label}}</button>');
  });

  it('prop takes priority over outer vars', () => {
    expect(compile('component Tag { span $color } Tag color:"red"', { color: 'blue' })).toBe(
      '<span>red</span>'
    );
  });
});

describe('component body structures', () => {
  it('multi-child body', () => {
    expect(compile('component Card { div { h2 $title p $body } } Card title:"Hi" body:"Txt"')).toBe(
      '<div><h2>Hi</h2><p>Txt</p></div>'
    );
  });

  it('component with classes and id', () => {
    expect(compile('component Alert { div.alert#msg $text } Alert text:"Watch out"')).toBe(
      '<div id="msg" class="alert">Watch out</div>'
    );
  });

  it('component body with loop inside', () => {
    expect(compile(
      'component List { ul { for item in items: li $item } } List',
      { items: ['a', 'b'] }
    )).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('component body with conditional inside', () => {
    expect(compile(
      'component Msg { div { if show: p $text } } Msg text:"Hi"',
      { show: true }
    )).toBe('<div><p>Hi</p></div>');
  });
});

describe('component composition', () => {
  it('component used as child of element', () => {
    expect(compile('component Tag { span $label } div { Tag label:"hi" }')).toBe(
      '<div><span>hi</span></div>'
    );
  });

  it('nested component calls another component', () => {
    expect(compile(
      'component Icon { span.icon $name } component Btn { button { Icon name:"star" span $label } } Btn label:"Go"'
    )).toBe('<button><span class="icon">star</span><span>Go</span></button>');
  });

  it('component called inside a conditional', () => {
    expect(compile(
      'component Msg { p $text } if show: Msg text:"Hello"',
      { show: true }
    )).toBe('<p>Hello</p>');
  });

  it('conditional hides component when false', () => {
    expect(compile(
      'component Msg { p $text } if show: Msg text:"Hello"',
      { show: false }
    )).toBe('');
  });
});

describe('component errors', () => {
  it('throws on unknown component', () => {
    expect(() => compile('Unknown prop:"x"')).toThrow(ParseError);
    expect(() => compile('Unknown prop:"x"')).toThrow("unknown component 'Unknown'");
  });

  it('throws on circular component reference', () => {
    expect(() => compile('component A { div { B } } component B { span { A } } A')).toThrow(ParseError);
    expect(() => compile('component A { div { B } } component B { span { A } } A')).toThrow('circular');
  });

  it('throws when component name starts with lowercase', () => {
    expect(() => parse('component btn { span }')).toThrow(ParseError);
    expect(() => parse('component btn { span }')).toThrow('uppercase');
  });

  it('throws helpful error when component used as for-loop body', () => {
    expect(() => parse('component Foo { span } for item in items: Foo')).toThrow(ParseError);
    expect(() => parse('component Foo { span } for item in items: Foo')).toThrow("'Foo' looks like a component");
  });
});

describe('component with all generators', () => {
  const src = 'component Btn { button.primary $label } Btn label:"Go"';

  it('HtmlGenerator', () => {
    expect(generate(parse(src), new HtmlGenerator())).toBe('<button class="primary">Go</button>');
  });

  it('ReactGenerator', () => {
    expect(generate(parse(src), new ReactGenerator())).toBe(
      "React.createElement('button', { className: \"primary\" }, \"Go\")"
    );
  });

  it('VueGenerator', () => {
    expect(generate(parse(src), new VueGenerator())).toBe(
      '<button class="primary">Go</button>'
    );
  });

  it('AstroGenerator', () => {
    expect(generate(parse(src), new AstroGenerator({ fragment: false }))).toBe(
      '<button class="primary">Go</button>'
    );
  });
});

describe('parse returns raw AST with component nodes', () => {
  it('parse returns component_def node', () => {
    const ast = parse('component Btn { button }');
    expect(ast).toHaveLength(1);
    expect(ast[0].type).toBe('component_def');
    if (ast[0].type === 'component_def') {
      expect(ast[0].name).toBe('Btn');
    }
  });

  it('parse returns component_call node', () => {
    const ast = parse('component Btn { button } Btn label:"OK"');
    expect(ast).toHaveLength(2);
    expect(ast[1].type).toBe('component_call');
    if (ast[1].type === 'component_call') {
      expect(ast[1].name).toBe('Btn');
      expect(ast[1].props).toEqual({ label: 'OK' });
    }
  });

  it('expandComponents removes defs and expands calls', () => {
    const ast = expandComponents(parse('component Btn { button $label } Btn label:"Go"'));
    expect(ast).toHaveLength(1);
    expect(ast[0].type).toBe('element');
    if (ast[0].type === 'element') {
      expect(ast[0].tag).toBe('button');
    }
  });
});
