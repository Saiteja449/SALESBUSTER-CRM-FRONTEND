import { memo } from "react";
import { Bot, Volume2 } from "lucide-react";
import FormattedAIResponse from "../ai/FormattedAIResponse.jsx";
import AnswerActions from "./AnswerActions.jsx";
import SourcesRow from "./SourcesRow.jsx";
import EmailConfirmationCard from "./EmailConfirmationCard.jsx";

function AssistantMessageComponent({
  message,
  onRegenerate,
  onSpeak,
  onStopSpeaking,
  onConfirmEmailReport,
  isSpeaking = false,
  showAvatar = true,
}) {
  const { id, content, toolsUsed, modelUsed, timestamp, isVoice, emailDraft } = message;

  return (
    <div
      data-message-id={id}
      className="flex items-start gap-3.5 pt-2 group animate-in fade-in duration-200"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
        {showAvatar && <Bot className="w-4 h-4" />}
      </div>

      {/* Main Content Card */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            BI Analyst
            {isVoice && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
                <Volume2 className="w-2.5 h-2.5" /> Spoken
              </span>
            )}
          </span>
          {timestamp && (
            <span className="text-[10px] text-text-secondary">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <FormattedAIResponse content={content} />

        {/* Confirmation Mail Data Card */}
        {emailDraft && (
          <div className="mt-3.5 max-w-2xl">
            <EmailConfirmationCard
              draft={emailDraft}
              onConfirm={onConfirmEmailReport}
            />
          </div>
        )}

        {/* Sources Row (collapsible) */}
        <SourcesRow toolsUsed={toolsUsed} modelUsed={modelUsed} />

        {/* Message Actions */}
        <AnswerActions
          messageId={id}
          content={content}
          onRegenerate={onRegenerate}
          isSpeaking={isSpeaking}
          onSpeak={onSpeak}
          onStopSpeaking={onStopSpeaking}
        />
      </div>
    </div>
  );
}

export const AssistantMessage = memo(AssistantMessageComponent);
export default AssistantMessage;
