export interface IRequest {
  getHttp(params: object): Promise<any>;
  postHttp(params: object): Promise<any>;
}

export abstract class GitServer {
  abstract createMR(branch: string, name: string): void;
}
