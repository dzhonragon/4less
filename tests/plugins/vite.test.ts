import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import plugin from '../../src/plugins/vite.js';

describe('Vite Plugin', () => {
  const testDir = './test-4less-plugin';
  const testFile = `${testDir}/test.4l`;

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true });
  });

  it('resolveId accepts .4l files', () => {
    const p = plugin();
    expect(p.resolveId?.('page.4l')).toBe('page.4l');
    expect(p.resolveId?.('page.tsx')).toBeUndefined();
  });

  it('load compiles .4l files to HTML export', () => {
    const p = plugin();
    writeFileSync(testFile, 'h1 "Hello"');

    const result = p.load?.(testFile);
    expect(result).toBeDefined();
    expect(result).toContain('export default');
    expect(result).toContain('<h1>Hello</h1>');
  });

  it('load handles multiple elements with Fragment-like structure', () => {
    const p = plugin();
    writeFileSync(testFile, 'h1 "A" p "B"');

    const result = p.load?.(testFile);
    expect(result).toContain('<h1>A</h1>');
    expect(result).toContain('<p>B</p>');
  });

  it('load handles complex 4less syntax', () => {
    const p = plugin();
    writeFileSync(testFile, 'h1 "Hello" p "World"');

    const result = p.load?.(testFile);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('<h1>Hello</h1>');
    expect(result).toContain('<p>World</p>');
  });

  it('load throws on invalid 4less syntax', () => {
    const p = plugin();
    writeFileSync(testFile, '{ invalid }');

    expect(() => p.load?.(testFile)).toThrow();
  });

  it('load ignores non-.4l files', () => {
    const p = plugin();
    const result = p.load?.('page.tsx');
    expect(result).toBeNull();
  });

  it('generated code is valid ES module', () => {
    const p = plugin();
    writeFileSync(testFile, 'button "Click" onclick:"handleClick"');

    const code = p.load?.(testFile) as string;
    expect(code).toMatch(/^export default/);

    // Verify it's valid JSON (the HTML is JSON-stringified)
    const match = code.match(/export default (.+);$/);
    expect(match).toBeTruthy();
    if (match) {
      const jsonString = match[1];
      expect(() => JSON.parse(jsonString)).not.toThrow();
    }
  });
});
