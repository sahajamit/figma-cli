// ── User ────────────────────────────────────────────────────────────────────

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email: string;
}

// ── Nodes & Files ───────────────────────────────────────────────────────────

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: Array<{ type: string; visible?: boolean; color?: FigmaColor }>;
  characters?: string;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  strokes?: Array<{ type: string; visible?: boolean; color?: FigmaColor }>;
  strokeWeight?: number;
  strokeAlign?: string;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  fontSize?: number;
  lineHeightPx?: number;
  fontWeight?: number;
  fontFamily?: string;
  letterSpacing?: number;
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  layoutPositioning?: 'AUTO' | 'ABSOLUTE';
  effects?: Array<{
    type: string;
    visible?: boolean;
    color?: FigmaColor;
    offset?: { x: number; y: number };
    radius?: number;
    spread?: number;
  }>;
}

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  schemaVersion: number;
}

export interface FigmaNodesResponse {
  name: string;
  lastModified: string;
  nodes: Record<string, { document: FigmaNode; components: Record<string, unknown>; styles: Record<string, unknown> }>;
}

// ── Images ──────────────────────────────────────────────────────────────────

export interface FigmaImageExportResponse {
  err: string | null;
  images: Record<string, string | null>;
}

// ── Components ──────────────────────────────────────────────────────────────

export interface FigmaComponent {
  key: string;
  file_key: string;
  node_id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  containing_frame?: { name: string; nodeId: string };
}

export interface FigmaComponentsResponse {
  meta: { components: FigmaComponent[] };
}

// ── Styles ──────────────────────────────────────────────────────────────────

export interface FigmaStyle {
  key: string;
  file_key: string;
  node_id: string;
  style_type: string;
  name: string;
  description: string;
  thumbnail_url?: string;
}

export interface FigmaStylesResponse {
  meta: { styles: FigmaStyle[] };
}

// ── Variables ───────────────────────────────────────────────────────────────

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  variableIds: string[];
}

export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
  description?: string;
}

export interface FigmaVariablesResponse {
  meta: {
    variableCollections: Record<string, FigmaVariableCollection>;
    variables: Record<string, FigmaVariable>;
  };
}

// ── Comments ────────────────────────────────────────────────────────────────

export interface FigmaComment {
  id: string;
  message: string;
  created_at: string;
  resolved_at?: string;
  user: { handle: string; img_url: string };
  order_id?: number;
}

export interface FigmaCommentsResponse {
  comments: FigmaComment[];
}

// ── Versions ────────────────────────────────────────────────────────────────

export interface FigmaVersion {
  id: string;
  created_at: string;
  label: string;
  description: string;
  user: { handle: string; img_url: string };
}

export interface FigmaVersionsResponse {
  versions: FigmaVersion[];
}

// ── Projects ────────────────────────────────────────────────────────────────

export interface FigmaProject {
  id: number;
  name: string;
}

export interface FigmaTeamProjectsResponse {
  projects: FigmaProject[];
}

export interface FigmaProjectFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

export interface FigmaProjectFilesResponse {
  files: FigmaProjectFile[];
}
