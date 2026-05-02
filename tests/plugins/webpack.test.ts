import { describe, it, expect } from 'vitest';
import loader from '../../src/plugins/webpack.js';

// Simulate Webpack loader context
function runLoader(source: string, resourcePath = 'test.4l'): string {
  const ctx = { resourcePath };
  return loader.call(ctx, source);
}

describe('Webpack Loader', () => {
  it('compiles a simple element to an ES module', () => {
    const result = runLoader('h1 "Hello"');
    expect(result).toBe(`export default "<h1>Hello</h1>";`);
  });

  it('compiles nested elements', () => {
    const result = runLoader('div { p "World" }');
    expect(result).toBe(`export default "<div><p>World</p></div>";`);
  });

  it('compiles shorthands correctly', () => {
    const result = runLoader('div#app.container');
    expect(result).toContain('id=');
    expect(result).toContain('app');
    expect(result).toContain('container');
  });

  it('compiles void elements as self-closing', () => {
    const result = runLoader('meta charset:"UTF-8"');
    expect(result).toBe(`export default "<meta charset=\\"UTF-8\\"/>";`);
  });

  it('output is a valid ES module default export', () => {
    const result = runLoader('p "test"');
    expect(result).toMatch(/^export default /);
  });

  it('throws on invalid syntax with file path in message', () => {
    expect(() => runLoader('{ invalid }', 'src/page.4l')).toThrow('src/page.4l');
  });

  it('throws on invalid syntax with parse error details', () => {
    expect(() => runLoader('{ invalid }')).toThrow('4less compile error');
  });

  it('handles multi-line source', () => {
    const source = `div {\n  h1 "Title"\n  p "Body"\n}`;
    const result = runLoader(source);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<p>Body</p>');
  });
});
