import exec from "execa";

interface GitOptions {
  context: string;
  execOptions?: exec.SyncOptions;
}

class Git {
  private executeOptions: exec.SyncOptions;

  public version: string = "";
  public installed: boolean = false;

  constructor(options: GitOptions) {
    // 执行指令时的配置
    this.executeOptions = Object.assign(
      { cwd: options.context, stdio: "inherit" },
      options.execOptions || {}
    );

    // 判断是否有git指令
    try {
      const ret = exec.commandSync("git --version");
      this.version = ret.stdout;
      this.installed = true;
    } catch (error) {
      this.installed = false;
    }
  }

  private _run(args: string[] = []) {
    return exec.sync("git", args, this.executeOptions);
  }

  /**
   * 初始化git工程
   */
  public init() {
    return this._run(["init"]);
  }

  /**
   * 设置远程仓库
   * @param {string} remoteRepoUrl 远程地址
   */
  public setRemote(remoteRepoUrl: string) {
    return this._run(["remote", "add", "origin", remoteRepoUrl]);
  }

  /**
   * 切换指定分支
   * @param {string} branch 分支名
   */
  checkout(branch: string) {
    return this._run(["checkout", "-b", branch]);
  }

  /**
   * 拉取指定分支
   * @param {string} branch 分支名
   */
  pull(branch: string = "master") {
    return this._run(["pull", "origin", branch]);
  }

  /**
   * 将指定文件增加到缓存区
   * @param {Array<string>} files
   */
  add(files: string[] = []) {
    return this._run(["add", ...files]);
  }

  /**
   * 提交变更
   * @param {string} message 提交信息
   */
  commit(message = "", ...args: string[]) {
    return this._run(["commit", "-m", message, ...args]);
  }

  /**
   * 推送代码到指定分支
   * @param {string} branch 分支名
   */
  push(branch: string) {
    return this._run(["push", "origin", branch]);
  }

  /**
   * 比对指定文件
   * @param {string} file 文件路径
   */
  diff(file: string) {
    return this._run(["diff", "origin/master", "--", file]);
  }

  /**
   * fetch
   */
  fetch() {
    return this._run(["fetch", "--all"]);
  }

  /**
   * reset到指定点
   * 默认为远端master
   * @param {*} ref 重置点
   */
  reset(ref: string = "origin/master") {
    return this._run(["reset", "--hard", ref]);
  }
}

export default Git;
