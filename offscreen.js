// Offscreen document used for playing Adhan and Quran Radio audio.
// The service worker requests playback here because audio playback needs a DOM context.

let currentAudio = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PLAY_ADHAN_SOUND") {
    playAudio(chrome.runtime.getURL("adhan.mp3"))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.warn("Offscreen playback failed:", error);
        sendResponse({ ok: false, error: error.message || "Failed to play audio." });
      });

    return true;
  }

  if (message?.action === "playRadioOffscreen") {
    playAudio(message.url)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.warn("Offscreen radio playback failed:", error);
        sendResponse({ ok: false, error: error.message || "Failed to play radio." });
      });

    return true;
  }

  if (message?.action === "stopAudioOffscreen") {
    stopAudio();
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

async function playAudio(url) {
  stopAudio();

  currentAudio = new Audio(url);
  currentAudio.preload = "auto";
  currentAudio.loop = false;

  try {
    await currentAudio.play();
  } catch (error) {
    // If autoplay is blocked, the service worker keeps working and the error is logged.
    throw error;
  }
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}