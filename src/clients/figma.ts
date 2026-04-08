import type { HttpClient } from '../http.js';
import type {
  FigmaUser,
  FigmaFile,
  FigmaNodesResponse,
  FigmaImageExportResponse,
  FigmaComponentsResponse,
  FigmaStylesResponse,
  FigmaVariablesResponse,
  FigmaCommentsResponse,
  FigmaVersionsResponse,
  FigmaTeamProjectsResponse,
  FigmaProjectFilesResponse,
  FigmaNode,
  FigmaComponent,
} from '../types/figma.js';

export interface GetFileOptions {
  version?: string;
  depth?: number;
  geometry?: string;
}

export interface GetImagesOptions {
  format?: 'png' | 'svg' | 'jpg' | 'pdf';
  scale?: number;
  svgIncludeId?: boolean;
  svgSimplifyStroke?: boolean;
}

export interface AddCommentOptions {
  clientMeta?: { x: number; y: number };
}

export interface FigmaClient {
  getMe(): Promise<FigmaUser>;
  getFile(fileKey: string, opts?: GetFileOptions): Promise<FigmaFile>;
  getNodes(fileKey: string, nodeIds: string[], opts?: { depth?: number }): Promise<FigmaNodesResponse>;
  getImages(fileKey: string, nodeIds: string[], opts?: GetImagesOptions): Promise<FigmaImageExportResponse>;
  getComponents(fileKey: string): Promise<FigmaComponentsResponse>;
  getTeamComponents(teamId: string): Promise<FigmaComponentsResponse>;
  getStyles(fileKey: string): Promise<FigmaStylesResponse>;
  getTeamStyles(teamId: string): Promise<FigmaStylesResponse>;
  getVariables(fileKey: string): Promise<FigmaVariablesResponse>;
  getComments(fileKey: string): Promise<FigmaCommentsResponse>;
  addComment(fileKey: string, message: string, opts?: AddCommentOptions): Promise<FigmaCommentsResponse>;
  getVersions(fileKey: string): Promise<FigmaVersionsResponse>;
  getTeamProjects(teamId: string): Promise<FigmaTeamProjectsResponse>;
  getProjectFiles(projectId: string): Promise<FigmaProjectFilesResponse>;
  getFileByPages(fileKey: string): Promise<FigmaFile>;
  listFrames(fileKey: string): Promise<FigmaNode[]>;
  searchComponents(fileKey: string, query: string): Promise<FigmaComponent[]>;
}

export function createFigmaClient(http: HttpClient): FigmaClient {
  return {
    async getMe() {
      return http.request<FigmaUser>({ path: '/v1/me' });
    },

    async getFile(fileKey, opts) {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (opts?.version) query.version = opts.version;
      if (opts?.depth !== undefined) query.depth = opts.depth;
      if (opts?.geometry) query.geometry = opts.geometry;
      return http.request<FigmaFile>({ path: `/v1/files/${fileKey}`, query });
    },

    async getNodes(fileKey, nodeIds, opts) {
      const query: Record<string, string | number | boolean | undefined> = {
        ids: nodeIds.join(','),
      };
      if (opts?.depth !== undefined) query.depth = opts.depth;
      return http.request<FigmaNodesResponse>({
        path: `/v1/files/${fileKey}/nodes`,
        query,
      });
    },

    async getImages(fileKey, nodeIds, opts) {
      const query: Record<string, string | number | boolean | undefined> = {
        ids: nodeIds.join(','),
      };
      if (opts?.format) query.format = opts.format;
      if (opts?.scale !== undefined) query.scale = opts.scale;
      if (opts?.svgIncludeId !== undefined) query.svg_include_id = opts.svgIncludeId;
      if (opts?.svgSimplifyStroke !== undefined) query.svg_simplify_stroke = opts.svgSimplifyStroke;
      return http.request<FigmaImageExportResponse>({ path: `/v1/images/${fileKey}`, query });
    },

    async getComponents(fileKey) {
      return http.request<FigmaComponentsResponse>({ path: `/v1/files/${fileKey}/components` });
    },

    async getTeamComponents(teamId) {
      return http.request<FigmaComponentsResponse>({ path: `/v1/teams/${teamId}/components` });
    },

    async getStyles(fileKey) {
      return http.request<FigmaStylesResponse>({ path: `/v1/files/${fileKey}/styles` });
    },

    async getTeamStyles(teamId) {
      return http.request<FigmaStylesResponse>({ path: `/v1/teams/${teamId}/styles` });
    },

    async getVariables(fileKey) {
      return http.request<FigmaVariablesResponse>({ path: `/v1/files/${fileKey}/variables/local` });
    },

    async getComments(fileKey) {
      return http.request<FigmaCommentsResponse>({ path: `/v1/files/${fileKey}/comments` });
    },

    async addComment(fileKey, message, opts) {
      const body: Record<string, unknown> = { message };
      if (opts?.clientMeta) body.client_meta = opts.clientMeta;
      return http.request<FigmaCommentsResponse>({
        method: 'POST',
        path: `/v1/files/${fileKey}/comments`,
        body,
      });
    },

    async getVersions(fileKey) {
      return http.request<FigmaVersionsResponse>({ path: `/v1/files/${fileKey}/versions` });
    },

    async getTeamProjects(teamId) {
      return http.request<FigmaTeamProjectsResponse>({ path: `/v1/teams/${teamId}/projects` });
    },

    async getProjectFiles(projectId) {
      return http.request<FigmaProjectFilesResponse>({ path: `/v1/projects/${projectId}/files` });
    },

    async getFileByPages(fileKey) {
      // Fetch skeleton with pages + their direct children (depth=2)
      // to avoid V8 string limit on large files
      const skeleton = await this.getFile(fileKey, { depth: 2 });
      const pages = skeleton.document.children ?? [];

      // Fetch each top-level child's full subtree individually
      for (const page of pages) {
        const children = page.children ?? [];
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const response = await this.getNodes(fileKey, [child.id]);
          const nodeData = response.nodes[child.id];
          if (nodeData?.document) {
            children[i] = nodeData.document as FigmaNode;
          }
        }
      }

      return skeleton;
    },

    async listFrames(fileKey) {
      // Frames are direct children of pages — depth=2 is sufficient
      const file = await this.getFile(fileKey, { depth: 2 });
      const frames: FigmaNode[] = [];
      const stack: FigmaNode[] = [file.document];
      while (stack.length) {
        const node = stack.pop()!;
        if (node.type === 'FRAME') frames.push(node);
        if (node.children?.length) stack.push(...node.children);
      }
      return frames;
    },

    async searchComponents(fileKey, query) {
      const response = await this.getComponents(fileKey);
      const q = query.toLowerCase();
      return response.meta.components.filter(c => c.name.toLowerCase().includes(q));
    },
  };
}
