import "./index.scss";

function attachToggleViewFaq(questionEl: HTMLElement) {
  const questionTextEl = questionEl
    .getElementsByClassName("question")
    .item(0) as HTMLElement;

  const crossButtonEl = questionEl
    .getElementsByClassName("close-button")
    .item(0) as HTMLElement;

  if (!questionTextEl || !crossButtonEl) {
    return;
  }

  questionTextEl.classList.add("closed");

  crossButtonEl.addEventListener("click", () => {
    if (crossButtonEl.classList.contains("rotated")) {
      crossButtonEl.classList.remove("rotated");
      questionTextEl.classList.add("closed");
    } else {
      crossButtonEl.classList.add("rotated");
      questionTextEl.classList.remove("closed");
    }
  });
}

function attachPlayButton(selector: string) {
  const playElements = Array.from(
    document.getElementsByClassName(selector)
  ) as HTMLElement[];

  playElements.forEach((el: HTMLElement) => {
    const videoEl = el.parentElement?.getElementsByTagName("video")?.item(0);

    let plays = false;

    el.addEventListener("click", () => {
      if (!videoEl) {
        return;
      }
      if (plays) {
        (videoEl as HTMLVideoElement).pause();
        el.classList.remove("playing");
      } else {
        (videoEl as HTMLVideoElement).play();
        el.classList.add("playing");
      }

      plays = !plays;
    });
  });
}

function attachTabs(buttonsSelector: string, tabsSelector: string[]) {
  let activeTab = 0;

  const buttonsContainer = document.getElementById(buttonsSelector);
  if (!buttonsContainer) {
    return;
  }

  const tabs = tabsSelector
    .map((selector) => document.getElementById(selector))
    .filter((el) => !!el) as HTMLElement[];

  const buttons = Array.from(buttonsContainer.children) as HTMLElement[];

  function updateTabs() {
    tabs.forEach((tab, i) => {
      if (i === activeTab) {
        tab.style.display = "flex";
      } else {
        tab.style.display = "none";
      }
    });

    buttons.forEach((button, i) => {
      if (i === activeTab) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  buttons.forEach((button, i) => {
    button.addEventListener("click", () => {
      activeTab = i;

      updateTabs();
    });
  });

  updateTabs();
}

window.addEventListener("DOMContentLoaded", () => {
  const questionsElements = Array.from(
    document.getElementsByClassName("faqQuestion")
  );

  questionsElements.forEach((question) => {
    attachToggleViewFaq(question as HTMLElement);
  });

  const videoForeground = document.getElementById("videoForeground");

  const mainContainerEl = document.getElementById("mainContainer");

  const toggleMuteEl = document.getElementById("toggleMute");

  // (document.getElementById("mainVideo") as HTMLVideoElement).pause();

  if (mainContainerEl && videoForeground && toggleMuteEl) {
    let muted = true;

    toggleMuteEl.addEventListener("click", () => {
      muted = !muted;
      (document.getElementById("mainVideo") as HTMLVideoElement).muted = muted;
    });

    const videoContainerEl = document.getElementById("videoContainer");

    mainContainerEl.addEventListener("scroll", (ev) => {
      const scrollTop = (ev.target as HTMLElement).scrollTop;

      const backgroundOpacity = Math.min(
        Math.max(0, window.innerHeight - scrollTop) / window.innerHeight,
        0.5
      );

      let firstTriggered = false;

      const paralax = Math.min(scrollTop / window.innerHeight, 1);

      videoContainerEl!.style.top = `${-(100 - paralax * 100)}px`;
      videoContainerEl!.style.minHeight = `${window.innerHeight * paralax}px)`;
      videoContainerEl!.style.height = `${window.innerHeight * paralax}px)`;

      function pauseOnStart() {
        (document.getElementById("mainVideo") as HTMLVideoElement).autoplay =
          false;
        (
          document.getElementById("mainVideo") as HTMLVideoElement
        ).removeEventListener("play", pauseOnStart);
      }

      (
        document.getElementById("mainVideo") as HTMLVideoElement
      ).addEventListener("", pauseOnStart);

      if (paralax > 0.5) {
        toggleMuteEl.style.opacity = "1";
        toggleMuteEl.style.display = "block";
      } else {
        toggleMuteEl.style.opacity = "0";
        toggleMuteEl.style.display = "none";
      }

      if (backgroundOpacity < 0.00001) {
        if (!firstTriggered) {
          (document.getElementById("mainVideo") as HTMLVideoElement).autoplay =
            true;
          // (document.getElementById("mainVideo") as HTMLVideoElement).muted =
          // false;
          firstTriggered = true;
        }
      }

      videoForeground.style.backgroundColor = `rgba(0, 0, 0, ${backgroundOpacity})`;
    });
  }

  attachPlayButton("playButton");

  attachTabs("showcases", ["case-1", "case-2"]);

  attachTabs("docs", ["doc-1", "doc-2"]);
});
