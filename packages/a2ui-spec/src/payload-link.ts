import { a2uiRegistry, type A2uiComponentName, type A2uiPayload } from "./index.js";

/**
 * Stateless deliverable links: a validated { component, props } payload is
 * base64url-encoded straight into a URL, so a deliverable renders forever
 * with no storage behind it. Self-contained on purpose - this package
 * compiles with lib:["ES2022"] (no DOM, no @types/node), so no btoa /
 * Buffer / TextEncoder. UTF-8 safety comes from encodeURIComponent, whose
 * output is pure ASCII.
 */

export class InvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPayloadError";
  }
}

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

export function encodePayload(payload: A2uiPayload): string {
  return asciiToBase64Url(encodeURIComponent(JSON.stringify(payload)));
}

/**
 * Decodes AND validates - the result is safe to render. Throws
 * InvalidPayloadError on anything that isn't a well-formed, schema-valid
 * payload for a known component.
 */
export function decodePayload(encoded: string): A2uiPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(base64UrlToAscii(encoded)));
  } catch (err) {
    if (err instanceof InvalidPayloadError) throw err;
    throw new InvalidPayloadError("Payload is not valid encoded JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("component" in parsed) ||
    !("props" in parsed)
  ) {
    throw new InvalidPayloadError("Payload must be { component, props }");
  }

  const { component, props } = parsed as { component: unknown; props: unknown };
  if (
    typeof component !== "string" ||
    !(component in a2uiRegistry)
  ) {
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
