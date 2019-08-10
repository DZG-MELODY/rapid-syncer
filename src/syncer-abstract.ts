import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import console from 'rapid-console';
import fse from 'fs-extra';

import { GitServer } from './gitServer/gitServer';
import { GitServerOptions, GitServerFactory } from './gitServer';
import GitShell from './gitShell';
import { execSyncProcess } from './utils/process';
import {
  errorHandler,
  ErrorInfo,
  ErrorLevel
} from './eventHandlers/errorHandler';

export interface SyncerOptions {
  context: string;
  syncTag: string;
  workspaceDirName: string;
  repositoryDirName: string;
  repositoryUrl: string;
  gitServer: GitServerOptions;
}

export abstract class Syncer extends EventEmitter {
  private readonly context: string;
  private readonly syncTag: string;
  private readonly workspaceDir: string;
  private readonly repositoryDir: string;
  private readonly logFile: string;
  private readonly repositoryUrl: string;
  private readonly userName: string;
  private readonly osPlatform: string;
  private gitShell: GitShell;
  private gitServer: GitServer;

  protected abstract get _branchName(this: Syncer): string;
  protected abstract get _commitMessage(this: Syncer): string;
  protected abstract get _addFiles(): string[];
  protected abstract _diff(): boolean;

  get hasBootstrap() {
    return fse.pathExistsSync(this.logFile);
  }

  get hasInitGit() {
    return (
      fse.pathExistsSync(this.repositoryDir) &&
      fse.pathExistsSync(path.join(this.repositoryDir, '.git'))
    );
  }

  constructor(options: SyncerOptions) {
    super();
    this.context = options.context;
    this.syncTag = options.syncTag;
    this.workspaceDir = path.join(this.context, options.workspaceDirName);
    this.repositoryDir = path.join(
      this.workspaceDir,
      options.repositoryDirName
    );
    this.logFile = path.join(
      this.workspaceDir,
      `${this.syncTag}-sync-history.json`
    );

    this.repositoryUrl = options.repositoryUrl;

    this.userName = os.userInfo().username;
    this.osPlatform = os.platform();

    this.on('error', errorHandler);

    this.gitShell = new GitShell({
      context: this.context,
      execOptions: {
        stdio: 'inherit'
      }
    });

    if (!this.gitShell.installed) {
      this._errorHandle({
        type: ErrorLevel.ERROR,
        message: 'git is not installed',
        exit: true
      });
    }

    this.gitServer = GitServerFactory.createGitServer(options.gitServer);
  }

  public bootstrap() {
    console.info('create workspace...');
    fse.mkdirpSync(this.repositoryDir);

    console.info('update git ignore...');
    const gitIgnorePath = path.join(this.context, '.gitignore');
    const appendVersion = `${this.workspaceDir}/${this.repositoryDir}/`;
    const appendLog = `${this.workspaceDir}/${this.syncTag}-sync-history.json`;
    if (fse.pathExistsSync(gitIgnorePath)) {
      let ignore: string = fse.readFileSync(gitIgnorePath, {
        encoding: 'string'
      });
      if (ignore.indexOf(appendVersion) < 0) {
        ignore += `\n`;
        ignore += appendVersion;
      }
      if (ignore.indexOf(appendLog) < 0) {
        ignore += `\n`;
        ignore += appendLog;
      }
      fse.writeFileSync(gitIgnorePath, ignore);
    } else {
      fse.writeFileSync(gitIgnorePath, `${appendVersion}\n${appendLog}`);
    }

    console.info('create log file');
    if (!fse.pathExistsSync(this.logFile)) {
      fse.writeJSONSync(
        this.logFile,
        {
          createTime: Date.now()
        },
        { spaces: 2 }
      );
    }
  }

  public reset() {
    fse.removeSync(this.repositoryDir);
    fse.removeSync(this.logFile);
  }

  public syncLocal() {
    if (this.hasInitGit) {
      this._syncLocalRepoWithoutInit();
    } else {
      this._syncLocalRepoWithInit();
    }
  }

  public syncRemote() {
    if (this.hasInitGit) {
      this._errorHandle({
        type: ErrorLevel.ERROR,
        message:
          'there is no git repo in workspace, please init and sync-local first',
        exit: true
      });
    }
    this._syncLocalRepoWithoutInit();
    const hasDiff = this._diff();
    if (!hasDiff) {
      this._errorHandle({
        type: ErrorLevel.WARNING,
        message: 'there is no change in dependencies',
        exit: true
      });
    }

    // 创建需要合并的远程分支名
    const remoteBranchToMerge = `${this._branchName}-${Date.now()}`;

    this._syncRemoteRepo(remoteBranchToMerge);

    // 创建合并请求
    // this.gitServer.createMR(remoteBranchToMerge, "master");
  }

  protected _errorHandle(error: ErrorInfo) {
    return this.emit('error', error);
  }

  /**
   * 初始化并同步本地repo
   */
  protected _syncLocalRepoWithInit() {
    // git初始化
    execSyncProcess('git init', () => this.gitShell.init());
    // 设置远程仓库
    execSyncProcess('get set remote', () =>
      this.gitShell.setRemote(this.repositoryUrl)
    );
    // 切换新分支
    execSyncProcess(`git checkout branch [${this._branchName}]`, () =>
      this.gitShell.checkout(this._branchName)
    );
    // 从远程拉取
    execSyncProcess('git pull from master', () => this.gitShell.pull('master'));
  }

  /**
   * 不初始化，直接同步本地repo
   */
  protected _syncLocalRepoWithoutInit() {
    // fetch 变更
    execSyncProcess('git fetch all', () => this.gitShell.fetch());
    // 重置到远程
    execSyncProcess('git reset to master', () => this.gitShell.reset());
    // 从远程拉取
    execSyncProcess('git pull from master', () => this.gitShell.pull('master'));
  }

  /**
   * 同步当前信息到远程的指定分支
   * @param {string} destBranch 目标分支名
   */
  protected _syncRemoteRepo(destBranch: string) {
    // git初始化
    execSyncProcess('git add', () => this.gitShell.add(this._addFiles));
    // git提交
    execSyncProcess('git commit', () =>
      this.gitShell.commit(this._commitMessage)
    );
    // git推送
    execSyncProcess('git push', () =>
      this.gitShell.push(`${this._branchName}:${destBranch}`)
    );
  }
}
