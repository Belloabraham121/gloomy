import type { NextFunction, Request, RequestHandler, Response } from "express";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogFields = Record<string, unknown>;

function resolveMinLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw && raw in LEVEL_ORDER) return raw as LogLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

let minLevel = resolveMinLevel();

/** Re-read LOG_LEVEL (useful after dotenv / test setup). */
export function refreshLogLevel(): void {
  minLevel = resolveMinLevel();
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function formatError(err: unknown): LogFields {
  if (err instanceof Error) {
    return {
      err: err.message,
      ...(err.stack ? { stack: err.stack } : {}),
      ...(err.name !== "Error" ? { errName: err.name } : {}),
    };
  }
  return { err: String(err) };
}

function serializeFields(fields?: LogFields): string {
  if (!fields || Object.keys(fields).length === 0) return "";
  return Object.entries(fields)
    .map(([key, value]) => {
      if (value === undefined) return null;
      if (typeof value === "string") {
        return value.includes(" ") ? `${key}="${value}"` : `${key}=${value}`;
      }
      if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        return `${key}=${String(value)}`;
      }
      try {
        return `${key}=${JSON.stringify(value)}`;
      } catch {
        return `${key}=[unserializable]`;
      }
    })
    .filter((part): part is string => part !== null)
    .join(" ");
}

function write(level: LogLevel, scope: string, msg: string, fields?: LogFields): void {
  if (!shouldLog(level)) return;

  const ts = new Date().toISOString();
  const levelLabel = level.toUpperCase().padEnd(5);
  const extras = serializeFields(fields);
  const line = extras
    ? `${ts} ${levelLabel} [${scope}] ${msg} ${extras}`
    : `${ts} ${levelLabel} [${scope}] ${msg}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** Attach an Error (or unknown) as structured fields. */
  errorWith(msg: string, err: unknown, fields?: LogFields): void;
  child(scope: string): Logger;
}

export function createLogger(scope: string): Logger {
  return {
    debug(msg, fields) {
      write("debug", scope, msg, fields);
    },
    info(msg, fields) {
      write("info", scope, msg, fields);
    },
    warn(msg, fields) {
      write("warn", scope, msg, fields);
    },
    error(msg, fields) {
      write("error", scope, msg, fields);
    },
    errorWith(msg, err, fields) {
      write("error", scope, msg, { ...fields, ...formatError(err) });
    },
    child(childScope) {
      return createLogger(`${scope}:${childScope}`);
    },
  };
}

export const log = createLogger("api");

/**
 * Logs every finished HTTP request: method, path, status, duration.
 * Skips the noisy `/health` probe at debug unless it fails.
 */
export function requestLogger(): RequestHandler {
  const reqLog = log.child("http");
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const path = req.originalUrl || req.url;
      const fields = {
        method: req.method,
        path,
        status: res.statusCode,
        ms: Math.round(ms * 10) / 10,
      };

      if (path === "/health" && res.statusCode < 400) {
        reqLog.debug("request", fields);
        return;
      }

      if (res.statusCode >= 500) {
        reqLog.error("request", fields);
      } else if (res.statusCode >= 400) {
        reqLog.warn("request", fields);
      } else {
        reqLog.info("request", fields);
      }
    });
    next();
  };
}
