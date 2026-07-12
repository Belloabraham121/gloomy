import { describe, expect, it } from "vitest";
import {
  decodePayload,
  encodePayload,
  InvalidPayloadError,
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
