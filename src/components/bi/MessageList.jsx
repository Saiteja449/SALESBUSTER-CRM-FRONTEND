import UserMessage from "./UserMessage.jsx";
import AssistantMessage from "./AssistantMessage.jsx";
import FollowUpChips from "./FollowUpChips.jsx";
import TypingCard from "./TypingCard.jsx";
import ErrorCard from "./ErrorCard.jsx";
import LimitCard from "./LimitCard.jsx";
import JumpToLatest from "./JumpToLatest.jsx";

export default function MessageList({
  scrollRef,
  messages = [],
  loading = false,
  error = null,
  limitError = null,
  options = [],
  onSelectOption,
  onRegenerate,
  onRetry,
  onStop,
  onSpeak,
  onStopSpeaking,
  onConfirmEmailReport,
  speakingMessageId,
  isScrolledUp = false,
  onJumpToLatest,
}) {
  const latestAssistantIdx = messages.reduce(
    (acc, m, idx) => (m.role === "assistant" ? idx : acc),
    -1
  );

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
      <div className="max-w-3xl sm:max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          const isSpeakingThis = speakingMessageId === m.id;
          const isLatestAssistant = idx === latestAssistantIdx;

          return (
            <div key={m.id || idx} className="w-full">
              {isUser ? (
                <UserMessage
                  message={m}
                  onSpeak={onSpeak}
                  onStopSpeaking={onStopSpeaking}
                  isSpeaking={isSpeakingThis}
                />
              ) : (
                <>
                  <AssistantMessage
                    message={m}
                    onRegenerate={onRegenerate}
                    onSpeak={onSpeak}
                    onStopSpeaking={onStopSpeaking}
                    onConfirmEmailReport={onConfirmEmailReport}
                    isSpeaking={isSpeakingThis}
                    showAvatar={idx === 0 || messages[idx - 1]?.role !== "assistant"}
                  />
                  {/* Follow-up chips ONLY after the latest assistant message */}
                  {isLatestAssistant && options && options.length > 0 && (
                    <div className="ml-11">
                      <FollowUpChips
                        options={options}
                        onSelectOption={onSelectOption}
                        disabled={loading}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Loading Skeleton */}
        {loading && <TypingCard onStop={onStop} />}

        {/* 429 Daily Limit Card */}
        {limitError && <LimitCard limitInfo={limitError} />}

        {/* Error Card */}
        {error && !limitError && (
          <ErrorCard error={error} onRetry={onRetry} />
        )}

        {/* Floating Jump to latest */}
        <JumpToLatest visible={isScrolledUp} onClick={onJumpToLatest} />

        {/* Live Region for Screen Readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {loading
            ? "Analyzing CRM data..."
            : messages.length > 0 && messages[messages.length - 1].role === "assistant"
            ? "New answer from BI Analyst received"
            : ""}
        </div>
      </div>
    </div>
  );
}
