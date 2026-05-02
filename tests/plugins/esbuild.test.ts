import { describe, it, expect, vi, beforeEach } from 'vitest';
import esbuild4lessPlugin from '../../src/plugins/esbuild.js';

// Mock fs.readFileSync for controlled testing
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

import { readFileSync } from 'fs';
const mockReadFileSync = vi.mocked(readFileSync);

function getOnLoadHandler(plugin: ReturnType<typeof esbuild4lessPlugin>) {
  const handlers: Array<{ filter: RegExp; fn: (args: { path: string }) => unknown }> = [];
  const build = {
    onLoad: (options: { filter: RegExp }, fn: (args: { path: string }) => unknown) => {
      handlers.push({ filter: options.filter, fn });
    },
  };
  plugin.setup(build as never);
  return (path: string) => handlers[0].fn({ path });
}

describe('esbuild Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('plugin has correct name', () => {
    const plugin = esbuild4lessPlugin();
    expect(plugin.name).toBe('4less');
  });

  it('registers onLoad handler for .4l files', () => {
    const plugin = esbuild4lessPlugin();
    const build = { onLoad: vi.fn() };
    plugin.setup(build as never);
    expect(build.onLoad).toHaveBeenCalledWith(
      expect.objectContaining({ filter: /\.4l$/ }),
      expect.any(Function)
    );
  });

  it('compiles a simple element to an ES module', () => {
    mockReadFileSync.mockReturnValue('h1 "Hello"' as never);
    const handler = getOnLoadHandler(esbuild4lessPlugin());
    const result = handler('template.4l') as { contents: string; loader: string };
    expect(result.contents).toBe(`export default "<h1>Hello</h1>";`);
    expect(result.loader).toBe('js');
  });

  it('compiles nested elements', () => {
    mockReadFileSync.mockReturnValue('div { p "World" }' as never);
    const handler = getOnLoadHandler(esbuild4lessPlugin());
    const result = handler('template.4l') as { contents: string };
    expect(result.contents).toBe(`export default "<div><p>World</p></div>";`);
  });

  it('compiles shorthands correctly', () => {
    mockReadFileSync.mockReturnValue('div#app.container' as never);
    const handler = getOnLoadHandler(esbuild4lessPlugin());
    const result = handler('template.4l') as { contents: string };
    expect(result.contents).toContain('id=');
    expect(result.contents).toContain('app');
    expect(result.contents).toContain('container');
  });

  it('returns errors array on parse failure', () => {
    mockReadFileSync.mockReturnValue('{ invalid }' as never);
    const handler = getOnLoadHandler(esbuild4lessPlugin());
    const result = handler('src/page.4l') as { errors: Array<{ text: string }> };
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].text).toContain('4less compile error');
    expect(result.errors[0].text).toContain('src/page.4l');
  });

  it('output is a valid ES module default export', () => {
    mockReadFileSync.mockReturnValue('p "test"' as never);
    const handler = getOnLoadHandler(esbuild4lessPlugin());
    const result = handler('template.4l') as { contents: string };
    expect(result.contents).toMatch(/^export default /);
  });

  it('handles multi-line source', () => {
    mockReadFileSync.mockReturnValue(`div {\n  h1 "Title"\n  p "Body"\n}` as never);
    const handler = getOnLoadHandler(esbuild4lessPlugin());
    const result = handler('template.4l') as { contents: string };
    expect(result.contents).toContain('<h1>Title</h1>');
    expect(result.contents).toContain('<p>Body</p>');
  });
});
