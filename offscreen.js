// Offscreen document used only for playing Adhan audio.
// The service worker requests playback here because audio playback needs a DOM context.

let audioElement = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PLAY_ADHAN_SOUND") {
    playAdhanSound()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.warn("Offscreen playback failed:", error);
        sendResponse({ ok: false, error: error.message || "Failed to play audio." });
      });

    return true;
  }

  return false;
});

async function playAdhanSound() {
  if (!audioElement) {
    audioElement = new Audio(chrome.runtime.getURL("adhan.mp3"));
    audioElement.preload = "auto";
    audioElement.loop = false;
  }

  audioElement.currentTime = 0;

  try {
    await audioElement.play();
  } catch (error) {
    // If autoplay is blocked, the service worker keeps working and the error is logged.
    throw error;
  }
}