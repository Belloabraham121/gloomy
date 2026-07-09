import { Lab } from "@/components/Lab";

export default function Page() {
  const hasLlmKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
  );
  return <Lab hasLlmKey={hasLlmKey} />;
}
