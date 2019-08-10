import console from "rapid-console";

export enum ErrorLevel {
  ERROR = "error",
  WARNING = "warning"
}

export interface ErrorInfo {
  type: ErrorLevel;
  message: string | string[];
  exit: boolean;
  exitCode?: number;
}

export function errorHandler(error: ErrorInfo) {
  const messages = Array.isArray(error.message)
    ? error.message
    : [error.message];

  messages.forEach(msg => {
    (console as any)[error.type](msg);
  });

  if (error.exit) process.exit(error.exitCode || 0);
}
