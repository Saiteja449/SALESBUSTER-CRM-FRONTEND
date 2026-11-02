import VoiceShell from "../voice/VoiceShell.jsx";

/**
 * Backward-compatible wrapper for GeminiLiveVoiceModal.
 * Forwards props to the redesigned VoiceShell.
 */
export default function GeminiLiveVoiceModal(props) {
  return <VoiceShell {...props} />;
}
