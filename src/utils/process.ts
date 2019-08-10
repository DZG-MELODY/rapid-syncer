import console from "rapid-console";
import execa from "execa";
import { errorHandler, ErrorLevel } from "../eventHandlers/errorHandler";

export const execSyncProcess = (
  processTag: string,
  processHandler: (...args: string[]) => execa.ExecaSyncReturnValue
) => {
  if (processTag) console.info(`${processTag}...`);
  try {
    const ret = processHandler();
    if (ret.failed) {
      errorHandler({
        type: ErrorLevel.ERROR,
        message: ret.exitCodeName,
        exit: true
      });
    }
  } catch (error) {
    errorHandler({
      type: ErrorLevel.ERROR,
      message: error.message,
      exit: true
    });
  }
  if (processTag) console.success(`${processTag} success`);
};

export const execAsyncProcess = async (
  processTag: string,
  processHandler: (...args: string[]) => Promise<any>,
  ...args: string[]
) => {
  if (processTag) console.info(`${processTag}...`);
  try {
    const ret = await processHandler(...args);
    if (ret.all) console.plain(ret.all);
  } catch (error) {
    errorHandler({
      type: ErrorLevel.ERROR,
      message: error.message,
      exit: true
    });
  }
  if (processTag) console.success(`${processTag} success`);
};
