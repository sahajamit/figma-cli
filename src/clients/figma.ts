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
  getNodes(fileKey: string, nodeIds: string[]): Promise<FigmaNodesResponse>;
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

    async getNodes(fileKey, nodeIds) {
      return http.request<FigmaNodesResponse>({
        path: `/v1/files/${fileKey}/nodes`,
        query: { ids: nodeIds.join(',') },
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

    async listFrames(fileKey) {
      const file = await this.getFile(fileKey);
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
