import { useEffect } from "react";

interface Feedback {
  tone: "info" | "warning";
  message: string;
}

interface ActionFeedbackProps {
  actionHint: string;
  feedback: Feedback | null;
  onClear?: () => void;
}

export function ActionFeedback({ actionHint, feedback, onClear }: ActionFeedbackProps) {
  useEffect(() => {
    if (!feedback || !onClear) {
      return undefined;
    }
    const timeout = window.setTimeout(onClear, 3000);
    return () => window.clearTimeout(timeout);
  }, [feedback, onClear]);

  return (
    <div className="action-feedback-stack">
      <p className="action-hint">{actionHint}</p>
      {feedback ? (
        <p className={`action-feedback ${feedback.tone === "warning" ? "action-feedback--warning" : "action-feedback--info"}`}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
