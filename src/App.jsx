import { useEffect, useRef, useState } from "react";
import { pages } from "./data/pages";

const AUDIO_VOLUME = 0.65;
const FADE_DURATION = 300;
const FADE_STEP_MS = 30;
const SWIPE_THRESHOLD = 48;

export default function App() {
  const [pageIndex, setPageIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const preloadedAudioRef = useRef(new Map());
  const preloadedImagesRef = useRef(new Set());
  const fadeTimerRef = useRef(null);
  const switchTokenRef = useRef(0);
  const pageIndexRef = useRef(0);
  const isStartedRef = useRef(false);
  const touchStartXRef = useRef(null);

  const page = pages[pageIndex];

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  useEffect(() => {
    const audio = new Audio();

    // One shared audio element keeps playback stable and prevents overlaps.
    audio.loop = true;
    audio.preload = "auto";

    audioRef.current = audio;

    return () => {
      clearFadeTimer();
      audio.pause();
    };
  }, []);

  function clearFadeTimer() {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }

  function fadeAudio(audio, targetVolume, token) {
    clearFadeTimer();

    return new Promise((resolve) => {
      const startingVolume = audio.volume;
      const steps = Math.max(1, Math.round(FADE_DURATION / FADE_STEP_MS));

      if (startingVolume === targetVolume) {
        resolve();
        return;
      }

      let currentStep = 0;

      fadeTimerRef.current = window.setInterval(() => {
        if (switchTokenRef.current !== token) {
          clearFadeTimer();
          resolve();
          return;
        }

        currentStep += 1;

        const nextVolume = startingVolume + ((targetVolume - startingVolume) * currentStep) / steps;
        audio.volume = Math.max(0, Math.min(1, nextVolume));

        if (currentStep >= steps) {
          audio.volume = targetVolume;
          clearFadeTimer();
          resolve();
        }
      }, FADE_STEP_MS);
    });
  }

  function preloadTrack(index) {
    const nextPage = pages[index];

    if (!nextPage || preloadedAudioRef.current.has(nextPage.music)) {
      return;
    }

    const preloadAudio = new Audio();
    preloadAudio.preload = "auto";
    preloadAudio.src = nextPage.music;
    preloadAudio.load();

    preloadedAudioRef.current.set(nextPage.music, preloadAudio);
  }

  function preloadImage(index) {
    const nextPage = pages[index];

    if (!nextPage || preloadedImagesRef.current.has(nextPage.image)) {
      return;
    }

    const nextImage = new Image();
    nextImage.src = nextPage.image;

    preloadedImagesRef.current.add(nextPage.image);
  }

  async function switchTrack(nextIndex, options = {}) {
    const { fromUserAction = false } = options;
    const audio = audioRef.current;
    const nextPage = pages[nextIndex];

    if (!audio || !nextPage) {
      return;
    }

    if (!isStartedRef.current && !fromUserAction) {
      return;
    }

    const token = switchTokenRef.current + 1;
    const targetVolume = isMuted ? 0 : AUDIO_VOLUME;

    switchTokenRef.current = token;

    try {
      if (!audio.paused) {
        await fadeAudio(audio, 0, token);
      }

      audio.pause();
      audio.currentTime = 0;

      if (audio.src !== new URL(nextPage.music, window.location.origin).toString()) {
        audio.src = nextPage.music;
      }

      audio.load();
      audio.volume = 0;

      await audio.play();

      if (switchTokenRef.current !== token) {
        return;
      }

      await fadeAudio(audio, targetVolume, token);
    } catch {
      if (switchTokenRef.current === token) {
        audio.pause();
      }
    }
  }

  function goToPage(nextIndex) {
    const boundedIndex = Math.max(0, Math.min(pages.length - 1, nextIndex));

    if (boundedIndex === pageIndexRef.current) {
      return;
    }

    setPageIndex(boundedIndex);
  }

  function handleNextPage() {
    goToPage(pageIndexRef.current + 1);
  }

  function handlePreviousPage() {
    goToPage(pageIndexRef.current - 1);
  }

  async function handleStartExperience() {
    setIsStarted(true);
    isStartedRef.current = true;
    preloadTrack(pageIndexRef.current);
    preloadTrack(pageIndexRef.current + 1);
    preloadImage(pageIndexRef.current);
    preloadImage(pageIndexRef.current + 1);
    await switchTrack(pageIndexRef.current, { fromUserAction: true });
  }

  useEffect(() => {
    preloadTrack(pageIndex);
    preloadTrack(pageIndex + 1);
    preloadImage(pageIndex);
    preloadImage(pageIndex + 1);
  }, [pageIndex]);

  useEffect(() => {
    if (!isStartedRef.current) {
      return;
    }

    void switchTrack(pageIndex);
  }, [pageIndex]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !isStarted) {
      return;
    }

    const token = switchTokenRef.current || 1;
    void fadeAudio(audio, isMuted ? 0 : AUDIO_VOLUME, token);
  }, [isMuted, isStarted]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNextPage();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePreviousPage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleTouchStart(event) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;

    touchStartXRef.current = null;

    if (startX === null || endX === null) {
      return;
    }

    const deltaX = startX - endX;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return;
    }

    if (deltaX > 0) {
      handleNextPage();
      return;
    }

    handlePreviousPage();
  }

  return (
    <main
      className="viewer-shell"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!isStarted && (
        <div className="start-overlay">
          <button className="start-button" type="button" onClick={handleStartExperience}>
            Start Experience
          </button>
        </div>
      )}

      <div className="page-stage">
        <div className="page-frame">
          <img
            key={page.image}
            className="page-image"
            src={page.image}
            alt={`Page ${pageIndex + 1}`}
            draggable="false"
          />

          <div className="page-overlay">
            <button
              className="overlay-button overlay-button-top"
              type="button"
              onClick={() => setIsMuted((current) => !current)}
              disabled={!isStarted}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "unmute" : "mute"}
            </button>

            <div className="overlay-bottom">
              <button
                className="overlay-button"
                type="button"
                onClick={handlePreviousPage}
                disabled={pageIndex === 0}
              >
                previous
              </button>

              <p className="page-indicator">
                {pageIndex + 1} / {pages.length}
              </p>

              <button
                className="overlay-button"
                type="button"
                onClick={handleNextPage}
                disabled={pageIndex === pages.length - 1}
              >
                next
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
