import { describe, expect, it } from "vitest";
import { decodePayload, type A2uiPayload } from "@gloomy/a2ui-spec";
import { buildDeliverable, isAuthorized } from "./agent-task.js";

const payload: A2uiPayload = {
  component: "StepThrough",
  props: {
    title: "How a block gets added",
    steps: [{ heading: "1. Broadcast", body: "A signed transaction is sent." }],
  },
};

describe("buildDeliverable", () => {
  it("builds an absolute viewUrl when a web origin is configured", () => {
    const { viewUrl, deliverMessage } = buildDeliverable(
      payload,
      "https://gloomy.example/",
    );
    expect(viewUrl).toMatch(/^https:\/\/gloomy\.example\/d\?p=[A-Za-z0-9_-]+$/);
    expect(deliverMessage).toContain(viewUrl);
    expect(deliverMessage).toContain("StepThrough");
  });

  it("falls back to a relative path without a web origin", () => {
    const { viewUrl } = buildDeliverable(payload, undefined);
    expect(viewUrl).toMatch(/^\/d\?p=/);
  });

  it("embeds a payload that decodes back to the original", () => {
    const { viewUrl } = buildDeliverable(payload, "https://gloomy.example");
    const encoded = new URL(viewUrl).searchParams.get("p");
    expect(encoded).toBeTruthy();
    expect(decodePayload(encoded!)).toEqual(payload);
  });
});

describe("isAuthorized", () => {
  it("allows everything when no key is configured", () => {
    expect(isAuthorized(undefined, undefined)).toBe(true);
    expect(isAuthorized(undefined, "anything")).toBe(true);
  });

  it("requires the exact key when configured", () => {
    expect(isAuthorized("secret", "secret")).toBe(true);
    expect(isAuthorized("secret", "wrong")).toBe(false);
    expect(isAuthorized("secret", undefined)).toBe(false);
  });
});
