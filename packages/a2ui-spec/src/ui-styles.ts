/**
 * Document / composition styles gloomy can force (or auto-pick) when the
 * model generates OpenUI Lang. Shared by apps/web (chips) and apps/api
 * (system-prompt injection + cache key scoping).
 */
export const UI_STYLE_IDS = [
  "auto",
  "report",
  "pitch",
  "dashboard",
  "lesson",
  "form",
] as const;

export type UiStyleId = (typeof UI_STYLE_IDS)[number];

export interface UiStyleOption {
  id: UiStyleId;
  label: string;
  /** Short hint shown under chip / empty-state suggestions. */
  hint: string;
}

export const UI_STYLE_OPTIONS: readonly UiStyleOption[] = [
  { id: "auto", label: "Auto", hint: "Pick the best layout for the ask" },
  { id: "report", label: "Report", hint: "Full written document with sections" },
  { id: "pitch", label: "Pitch", hint: "Slide-style carousel / deck" },
  { id: "dashboard", label: "Dashboard", hint: "Metrics, charts, and tables" },
  { id: "lesson", label: "Lesson", hint: "Teach with diagrams, quizzes, steps" },
  { id: "form", label: "Form", hint: "Collect input, then continue the chat" },
] as const;

export function isUiStyleId(value: unknown): value is UiStyleId {
  return (
    typeof value === "string" &&
    (UI_STYLE_IDS as readonly string[]).includes(value)
  );
}

export function normalizeUiStyle(value: unknown): UiStyleId {
  return isUiStyleId(value) ? value : "auto";
}

/**
 * Appended to the OpenUI system prompt for non-`auto` styles so the model
 * structures the Lang program as that document type. `auto` returns null —
 * the base prompt already covers freestyle composition.
 */
export function stylePromptBlock(style: UiStyleId): string | null {
  switch (style) {
    case "auto":
      return null;
    case "report":
      return `### Forced composition style: REPORT
Build a full multi-section report as the root Stack (not a one-component answer).
Typical shape:
- Title (TextContent large-heavy) + one-paragraph executive summary (MarkDownRenderer or TextContent)
- 3–6 sections via Accordion/AccordionItem or Card/CardHeader stacks — each section has prose + supporting Chart/Table/Callout/ListBlock when useful
- Optional closing Buttons/FollowUpBlock with continue_conversation actions for natural next questions ("Dive into methodology", "Summarize risks")
Use Tables/Charts with real numbers when grounded data is present; never invent figures.`;
    case "pitch":
      return `### Forced composition style: PITCH DECK
Structure the answer as a short pitch deck.
Prefer Carousel of slide Stacks (or Tabs/TabItem if Carousel doesn't fit), ~5–8 slides covering: problem, solution, how it works, market/audience, traction or proof, ask/next step.
Each slide: short headline (TextContent large-heavy) + 1–3 supporting lines + optional Chart/Image/TagBlock — keep slides skimable, not essay-length.
Close with Buttons that open a URL or continue_conversation ("Ask about pricing", "Show a demo walkthrough").`;
    case "dashboard":
      return `### Forced composition style: DASHBOARD
Root Stack (column) that reads as an operational dashboard:
- Header row (title + TagBlock status/tags)
- KPI strip (TextContent / Tag values — no fake precision)
- 1–3 Charts (BarChart/LineChart/AreaChart/PieChart as appropriate)
- Supporting Table for the underlying rows
- Optional Callout for alerts or caveats
When grounded PDF/CSV context exists, use ONLY its numbers. Prefer Charts + Table over teaching components unless the user asks to learn.`;
    case "lesson":
      return `### Forced composition style: LESSON
Teach the topic interactively:
- Title + short intro
- Prefer gloomy teaching components (Diagram, StepThrough, Quiz, Simulation, FormulaStepper, Math) nested in Stack wrappers where layout parents require it
- Optionally add MarkDownRenderer prose and OpenUI Charts when numbers help
End with a Quiz or FollowUpBlock continue_conversation prompts so the learner can go deeper.`;
    case "form":
      return `### Forced composition style: FORM
Lead with a clear Form (Form/FormControl/Label/Input/TextArea/Select/CheckBoxGroup/RadioGroup/DatePicker/Slider as needed) that collects what you need next.
Include Buttons whose action continues the conversation (continue_conversation) with a humanFriendly message summarizing or requesting the next generation ("Generate the report from these answers").
Surround the form with brief instructions (TextContent/Callout). Do not fake a completed report in the same turn — collect input first.`;
    default:
      return null;
  }
}
