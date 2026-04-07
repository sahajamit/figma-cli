// Design token extraction — ported from figma-mcp-free/packages/design-tokens
// Extracts colors, spacing, sizes, typography, and shadows from Figma file data
// and outputs them in W3C Design Tokens Community Group format.

export interface TokenValue<T = string> { value: T; type?: string }

export interface DesignTokens {
  $schema?: string;
  color?: Record<string, TokenValue>;
  size?: Record<string, TokenValue<number | string>>;
  spacing?: Record<string, TokenValue<number | string>>;
  typography?: Record<string, { value: {
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    letterSpacing?: number;
    fontWeight?: number;
  } }>;
  shadow?: Record<string, { value: string }>;
}

interface AnyNode {
  id: string;
  name: string;
  type: string;
  children?: AnyNode[];
  fills?: Array<{ type: string; visible?: boolean; color?: { r: number; g: number; b: number; a?: number } }>;
  absoluteBoundingBox?: { width?: number; height?: number };
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  fontSize?: number;
  lineHeightPx?: number;
  fontWeight?: number;
  fontFamily?: string;
  letterSpacing?: number;
  effects?: Array<{
    type: string;
    visible?: boolean;
    color?: { r: number; g: number; b: number; a?: number };
    offset?: { x: number; y: number };
    radius?: number;
    spread?: number;
  }>;
}

function toHex(n: number): string {
  const s = Math.max(0, Math.min(255, Math.round(n))).toString(16);
  return s.length === 1 ? '0' + s : s;
}

function figmaColorToHex(c: { r: number; g: number; b: number; a?: number }): string {
  const r = toHex(c.r * 255);
  const g = toHex(c.g * 255);
  const b = toHex(c.b * 255);
  const a = c.a === undefined || c.a >= 1 ? '' : toHex(c.a * 255);
  return a ? `#${r}${g}${b}${a}` : `#${r}${g}${b}`;
}

function normalizeName(s: string): string {
  return s
    .trim()
    .replace(/[^a-zA-Z0-9\-_\s/]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function collectColorTokens(root: AnyNode): Record<string, TokenValue> {
  const out: Record<string, TokenValue> = {};
  const stack: Array<{ node: AnyNode; path: string[] }> = [{ node: root, path: [normalizeName(root.name) || root.id] }];

  while (stack.length) {
    const { node, path } = stack.pop()!;
    const keyBase = path.filter(Boolean).join('/');
    const fills = node.fills;
    if (fills?.length) {
      let idx = 0;
      for (const f of fills) {
        if (!f || f.visible === false) continue;
        if (f.type === 'SOLID' && f.color) {
          const name = idx === 0 ? keyBase : `${keyBase}-${idx}`;
          out[name] = { value: figmaColorToHex(f.color), type: 'color' };
          idx++;
        }
      }
    }
    if (node.children?.length) {
      for (const child of node.children) {
        stack.push({ node: child as AnyNode, path: [...path, normalizeName(child.name) || child.id] });
      }
    }
  }
  return out;
}

function collectSpacingAndSizeTokens(root: AnyNode): { spacing: Record<string, TokenValue<number>>; size: Record<string, TokenValue<number>> } {
  const spacing: Record<string, TokenValue<number>> = {};
  const size: Record<string, TokenValue<number>> = {};
  const stack: Array<{ node: AnyNode; path: string[] }> = [{ node: root, path: [normalizeName(root.name) || root.id] }];

  while (stack.length) {
    const { node, path } = stack.pop()!;
    const keyBase = path.filter(Boolean).join('/');

    const paddings: Array<[string, number | undefined]> = [
      ['top', node.paddingTop], ['right', node.paddingRight],
      ['bottom', node.paddingBottom], ['left', node.paddingLeft],
    ];
    for (const [dir, v] of paddings) {
      if (typeof v === 'number' && isFinite(v) && v > 0) {
        spacing[`${keyBase}-padding-${dir}`] = { value: Math.round(v), type: 'spacing' };
      }
    }

    const bb = node.absoluteBoundingBox;
    if (bb?.width && isFinite(bb.width)) size[`${keyBase}-width`] = { value: Math.round(bb.width), type: 'dimension' };
    if (bb?.height && isFinite(bb.height)) size[`${keyBase}-height`] = { value: Math.round(bb.height), type: 'dimension' };

    if (node.children?.length) {
      for (const child of node.children) {
        stack.push({ node: child as AnyNode, path: [...path, normalizeName(child.name) || child.id] });
      }
    }
  }
  return { spacing, size };
}

function collectTypographyTokens(root: AnyNode): DesignTokens['typography'] {
  const out: NonNullable<DesignTokens['typography']> = {};
  const stack: Array<{ node: AnyNode; path: string[] }> = [{ node: root, path: [normalizeName(root.name) || root.id] }];

  while (stack.length) {
    const { node, path } = stack.pop()!;
    const keyBase = path.filter(Boolean).join('/');
    if (node.type === 'TEXT') {
      const value: Record<string, string | number> = {};
      if (typeof node.fontFamily === 'string') value.fontFamily = node.fontFamily;
      if (typeof node.fontSize === 'number') value.fontSize = Math.round(node.fontSize);
      if (typeof node.lineHeightPx === 'number') value.lineHeight = Math.round(node.lineHeightPx);
      if (typeof node.letterSpacing === 'number') value.letterSpacing = Math.round(node.letterSpacing);
      if (typeof node.fontWeight === 'number') value.fontWeight = Math.round(node.fontWeight);
      if (Object.keys(value).length) {
        out[keyBase] = { value } as DesignTokens['typography'] extends Record<string, infer V> ? V : never;
      }
    }
    if (node.children?.length) {
      for (const child of node.children) {
        stack.push({ node: child as AnyNode, path: [...path, normalizeName(child.name) || child.id] });
      }
    }
  }
  return out;
}

function collectShadowTokens(root: AnyNode): Record<string, { value: string }> {
  const out: Record<string, { value: string }> = {};
  const stack: Array<{ node: AnyNode; path: string[] }> = [{ node: root, path: [normalizeName(root.name) || root.id] }];

  while (stack.length) {
    const { node, path } = stack.pop()!;
    const keyBase = path.filter(Boolean).join('/');
    const effects = node.effects;
    if (effects?.length) {
      const parts: string[] = [];
      for (const e of effects) {
        if (!e || e.visible === false) continue;
        if (e.type !== 'DROP_SHADOW' && e.type !== 'INNER_SHADOW') continue;
        const inset = e.type === 'INNER_SHADOW' ? 'inset ' : '';
        const dx = Math.round(e.offset?.x ?? 0);
        const dy = Math.round(e.offset?.y ?? 0);
        const blur = Math.round(e.radius ?? 0);
        const spread = Math.round(e.spread ?? 0);
        const color = e.color ? figmaColorToHex(e.color).toLowerCase() : '#000000';
        parts.push(`${inset}${dx}px ${dy}px ${blur}px ${spread}px ${color}`);
      }
      if (parts.length) out[keyBase] = { value: parts.join(', ') };
    }
    if (node.children?.length) {
      for (const child of node.children) {
        stack.push({ node: child as AnyNode, path: [...path, normalizeName(child.name) || child.id] });
      }
    }
  }
  return out;
}

export function toDesignTokens(figmaFile: unknown): DesignTokens {
  const file = figmaFile as { document?: AnyNode };
  const tokens: DesignTokens = {
    $schema: 'https://design-tokens.github.io/community-group/format/module.v1.json',
  };

  if (file?.document) {
    const colors = collectColorTokens(file.document);
    if (Object.keys(colors).length) tokens.color = colors;

    const { spacing, size } = collectSpacingAndSizeTokens(file.document);
    if (Object.keys(spacing).length) tokens.spacing = spacing;
    if (Object.keys(size).length) tokens.size = size;

    const typography = collectTypographyTokens(file.document);
    if (typography && Object.keys(typography).length) tokens.typography = typography;

    const shadow = collectShadowTokens(file.document);
    if (Object.keys(shadow).length) tokens.shadow = shadow;
  }

  return tokens;
}
