import { describe, expect, it } from "vitest";
import {
  decodePayload,
  encodeLang,
  encodePayload,
  InvalidPayloadError,
  isLangDeliverable,
  mathSchema,
  type A2uiPayload,
} from "@gloomy/a2ui-spec";

// Tests live here because packages/a2ui-spec has no test runner of its own;
// apps/api is the primary consumer of encode (apps/web consumes decode).

const quiz: A2uiPayload = {
  component: "Quiz",
  props: {
    question: "What links blocks in a blockchain?",
    choices: [
      { id: "a", label: "The previous block's hash" },
      { id: "b", label: "A shared password" },
    ],
    correctChoiceId: "a",
    explanation: "Each block stores the previous block's hash.",
  },
};

describe("payload-link", () => {
  it("round-trips a payload, including non-ASCII text", () => {
    const payload: A2uiPayload = {
      ...quiz,
      props: { ...quiz.props, explanation: "Chaîne de blocs — 区块链 ✓" },
    };
    const decoded = decodePayload(encodePayload(payload));
    expect(decoded).toEqual(payload);
  });

  it("produces URL-safe output (no + / = characters)", () => {
    const encoded = encodePayload(quiz);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejects garbage input", () => {
    expect(() => decodePayload("not!!valid@@base64")).toThrow(InvalidPayloadError);
    expect(() => decodePayload("aGVsbG8")).toThrow(InvalidPayloadError); // "hello"
  });

  it("rejects an unknown component", () => {
    const tampered = encodePayload({
      component: "EvilComponent",
      props: {},
    } as unknown as A2uiPayload);
    expect(() => decodePayload(tampered)).toThrow(/Unknown component/);
  });

  it("rejects schema-invalid props for a known component", () => {
    const tampered = encodePayload({
      component: "Quiz",
      props: { question: 42 },
    } as unknown as A2uiPayload);
    expect(() => decodePayload(tampered)).toThrow(/schema validation/);
  });
});

// The current (v2) deliverable contract: an OpenUI Lang program instead of
// {component, props} - see docs/openui-migration.md.
describe("payload-link (OpenUI Lang, v2)", () => {
  const lang =
    'root = Stack([intro, quiz])\nintro = TextContent("Blockchain basics", "large-heavy")\nquiz = Quiz("What links blocks in a blockchain?", [{"id":"a","label":"The previous block\'s hash"},{"id":"b","label":"A shared password"}], "a", "Chaîne de blocs — 区块链 ✓")';

  it("round-trips a Lang payload, including non-ASCII text", () => {
    const decoded = decodePayload(encodeLang(lang));
    expect(isLangDeliverable(decoded)).toBe(true);
    expect(decoded).toEqual({ v: 2, lang });
  });

  it("produces URL-safe output (no + / = characters)", () => {
    const encoded = encodeLang(lang);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("is distinguishable from a legacy {component, props} payload", () => {
    const legacyDecoded = decodePayload(encodePayload(quiz));
    const langDecoded = decodePayload(encodeLang(lang));
    expect(isLangDeliverable(legacyDecoded)).toBe(false);
    expect(isLangDeliverable(langDecoded)).toBe(true);
  });

  it("rejects a v2 payload with an empty lang string", () => {
    expect(() => decodePayload(encodeLang(""))).toThrow(InvalidPayloadError);
    expect(() => decodePayload(encodeLang("   "))).toThrow(InvalidPayloadError);
  });

  it("still decodes a pre-migration legacy {component, props} link", () => {
    const decoded = decodePayload(encodePayload(quiz));
    expect(isLangDeliverable(decoded)).toBe(false);
    expect(decoded).toEqual(quiz);
  });
});

describe("mathSchema", () => {
  it("accepts a LaTeX string with an optional display flag", () => {
    expect(mathSchema.safeParse({ latex: "E = mc^2" }).success).toBe(true);
    expect(
      mathSchema.safeParse({ latex: "E = mc^2", display: true }).success,
    ).toBe(true);
  });

  it("rejects a non-string latex value", () => {
    expect(mathSchema.safeParse({ latex: 42 }).success).toBe(false);
  });
});
