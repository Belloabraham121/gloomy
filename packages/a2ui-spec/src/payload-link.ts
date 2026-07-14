import { a2uiRegistry, type A2uiComponentName, type A2uiPayload } from "./index.js";

/**
 * Stateless deliverable links: a payload is base64url-encoded straight into
 * a URL, so a deliverable renders forever with no storage behind it.
 * Self-contained on purpose - this package compiles with lib:["ES2022"]
 * (no DOM, no @types/node), so no btoa / Buffer / TextEncoder. UTF-8
 * safety comes from encodeURIComponent, whose output is pure ASCII.
 *
 * Versioned payload shape (see docs/openui-migration.md):
 * - v2 `{ v: 2, lang }` - an OpenUI Lang program, the current contract.
 *   Rendered via OpenUI's <Renderer library={extendedLibrary} .../>.
 * - legacy (no `v` field) `{ component, props }` - the pre-OpenUI single
 *   tool-call contract. Old `/d?p=...` links (from before this migration,
 *   e.g. already-delivered OKX marketplace tasks) must keep decoding and
 *   rendering, so this shape is still accepted by `decodePayload` and
 *   rendered by apps/web's legacy direct-component fallback path.
 */

export class InvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPayloadError";
  }
}

/** An OpenUI Lang program payload - the current deliverable contract. */
export interface LangDeliverable {
  v: 2;
  lang: string;
}

/** Either the current Lang payload or a pre-migration `{component, props}` one. */
export type A2uiDeliverable = LangDeliverable | A2uiPayload;

export function isLangDeliverable(
  payload: A2uiDeliverable,
): payload is LangDeliverable {
  return (payload as LangDeliverable).v === 2;
}

const MAX_LANG_LENGTH = 100_000;

const B64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function asciiToBase64Url(ascii: string): string {
  let out = "";
  for (let i = 0; i < ascii.length; i += 3) {
    const b0 = ascii.charCodeAt(i);
    const b1 = i + 1 < ascii.length ? ascii.charCodeAt(i + 1) : undefined;
    const b2 = i + 2 < ascii.length ? ascii.charCodeAt(i + 2) : undefined;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 !== undefined) out += B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 !== undefined) out += B64[b2 & 63];
  }
  return out;
}

function base64UrlToAscii(encoded: string): string {
  let out = "";
  let buffer = 0;
  let bits = 0;
  for (const char of encoded) {
    const value = B64.indexOf(char);
    if (value < 0) {
      throw new InvalidPayloadError("Payload contains invalid characters");
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return out;
}

/** Encodes the current (v2, OpenUI Lang) deliverable contract. */
export function encodeLang(lang: string): string {
  const payload: LangDeliverable = { v: 2, lang };
  return asciiToBase64Url(encodeURIComponent(JSON.stringify(payload)));
}

/**
 * Encodes the legacy `{component, props}` contract. Kept only so existing
 * callers/tests exercising the pre-migration shape still pass, and so any
 * code path that still hands this function a validated legacy payload
 * keeps working; new code should call `encodeLang`.
 */
export function encodePayload(payload: A2uiPayload): string {
  return asciiToBase64Url(encodeURIComponent(JSON.stringify(payload)));
}

function decodeLegacyPayload(parsed: object): A2uiPayload {
  if (!("component" in parsed) || !("props" in parsed)) {
    throw new InvalidPayloadError(
      "Payload must be { v: 2, lang } or legacy { component, props }",
    );
  }
  const { component, props } = parsed as { component: unknown; props: unknown };
  if (typeof component !== "string" || !(component in a2uiRegistry)) {
    throw new InvalidPayloadError(`Unknown component: ${String(component)}`);
  }
  const name = component as A2uiComponentName;
  const result = a2uiRegistry[name].schema.safeParse(props);
  if (!result.success) {
    throw new InvalidPayloadError(
      `Props failed ${name} schema validation: ${result.error.message}`,
    );
  }
  return { component: name, props: result.data } as A2uiPayload;
}

/**
 * Decodes AND validates - the result is safe to render. Throws
 * InvalidPayloadError on anything that isn't a well-formed v2 Lang payload
 * or a well-formed legacy `{component, props}` payload for a known
 * component.
 */
export function decodePayload(encoded: string): A2uiDeliverable {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(base64UrlToAscii(encoded)));
  } catch (err) {
    if (err instanceof InvalidPayloadError) throw err;
    throw new InvalidPayloadError("Payload is not valid encoded JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new InvalidPayloadError(
      "Payload must be { v: 2, lang } or legacy { component, props }",
    );
  }

  if ("v" in parsed && (parsed as { v: unknown }).v === 2) {
    const { lang } = parsed as unknown as { lang: unknown };
    if (typeof lang !== "string" || lang.trim().length === 0) {
      throw new InvalidPayloadError("v2 payload must have a non-empty string 'lang'");
    }
    if (lang.length > MAX_LANG_LENGTH) {
      throw new InvalidPayloadError("v2 payload 'lang' exceeds the maximum allowed length");
    }
    return { v: 2, lang };
  }

  return decodeLegacyPayload(parsed);
}
