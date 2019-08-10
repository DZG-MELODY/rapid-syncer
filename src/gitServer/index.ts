import Gitlab from "./gitlab";
import Github from "./github";
import { GitServer } from "./gitServer";

export enum GitServerType {
  GITHUB = "github",
  GITLAB = "gitlab",
  GIST = "gist"
}

export interface GitServerOptions {
  type: GitServerType;
  host: string;
  token: string;
  repositoryID: string;
}

export const GitServerFactory = {
  createGitServer(options: GitServerOptions): GitServer {
    switch (options.type) {
      case GitServerType.GITLAB:
        return new Gitlab();
      case GitServerType.GITHUB:
        return new Github();
      default:
        return new Gitlab();
    }
  }
};
