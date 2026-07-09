"use client";

import { useState } from "react";
import type { QuizProps } from "@gloomy/a2ui-spec";

export function Quiz({
  question,
  choices,
  correctChoiceId,
  explanation,
}: QuizProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hasAnswered = selectedId !== null;
  const isCorrect = selectedId === correctChoiceId;

  return (
    <div className="a2ui-card">
      <h3 className="a2ui-title">{question}</h3>
      <div className="a2ui-quiz-choices">
        {choices.map((choice) => {
          let choiceClass = "a2ui-quiz-choice";
          if (hasAnswered) {
            if (choice.id === correctChoiceId) {
              choiceClass += " correct";
            } else if (choice.id === selectedId) {
              choiceClass += " incorrect";
            }
          }
          return (
            <button
              key={choice.id}
              type="button"
              className={choiceClass}
              disabled={hasAnswered}
              onClick={() => setSelectedId(choice.id)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {hasAnswered && (
        <div className={`a2ui-quiz-feedback ${isCorrect ? "correct" : "incorrect"}`}>
          <strong>{isCorrect ? "Correct." : "Not quite."}</strong> {explanation}
        </div>
      )}
    </div>
  );
}
