import Pusher from "pusher-js";

// Initialize Pusher client
const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
});

/**
 * Subscribe to a Pusher channel by name.
 * If already subscribed, returns the existing channel.
 */
export const getChannel = (channelName) => {
  return pusher.subscribe(channelName);
};

/**
 * Unsubscribe from a Pusher channel.
 */
export const leaveChannel = (channelName) => {
  pusher.unsubscribe(channelName);
};

export default pusher;
