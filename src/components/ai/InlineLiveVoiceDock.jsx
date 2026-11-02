import VoiceDock from "../voice/VoiceDock.jsx";

/**
 * Backward-compatible wrapper for InlineLiveVoiceDock.
 * Forwards props to the redesigned VoiceDock.
 */
export default function InlineLiveVoiceDock(props) {
  return <VoiceDock {...props} />;
}
