const monsters = document.querySelectorAll(".monster");
const stage = document.querySelector(".monster-stage");

// 100 BPM = 600ms per beat
const beatLength = 600;

// 4 beats = one bar
const beatsPerBar = 4;
const barLength = beatLength * beatsPerBar;

let masterTimer = null;
let masterStarted = false;

// keeps track of Monstars waiting for the next bar
const queuedMonsters = new Set();

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

  // AUDIO

  const soundFile = monster.dataset.sound;
  const audio = new Audio(soundFile);

  audio.loop = true;

  let isPlaying = false;
  let isQueued = false;

  audio.addEventListener("error", () => {
    console.error(`Could not load audio: ${soundFile}`);
  });

  // stores the audio and states on the Monstar
  monster.audioData = {
    audio: audio,

    getIsPlaying: () => isPlaying,

    setIsPlaying: (value) => {
      isPlaying = value;
    },

    getIsQueued: () => isQueued,

    setIsQueued: (value) => {
      isQueued = value;
    }
  };

  // DRAGGING

  monster.addEventListener("pointerdown", (event) => {
    isDragging = true;

    hasMoved = false;

    startX = event.clientX;
    startY = event.clientY;

    const monsterBox = monster.getBoundingClientRect();

    offsetX = event.clientX - monsterBox.left;
    offsetY = event.clientY - monsterBox.top;

    monster.setPointerCapture(event.pointerId);

    monster.style.zIndex = "1000";
  });

  monster.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const moveX = Math.abs(event.clientX - startX);
    const moveY = Math.abs(event.clientY - startY);

    // separates clicking from dragging
    if (moveX > 5 || moveY > 5) {
      hasMoved = true;
    }

    if (!hasMoved) return;

    const stageBox = stage.getBoundingClientRect();

    let newX =
      event.clientX -
      stageBox.left -
      offsetX;

    let newY =
      event.clientY -
      stageBox.top -
      offsetY;

    // keeps the Monstars inside the stage

    const monsterWidth = monster.offsetWidth;
    const monsterHeight = monster.offsetHeight;

    const maximumX =
      stageBox.width - monsterWidth;

    const maximumY =
      stageBox.height - monsterHeight;

    newX = Math.max(0, Math.min(maximumX, newX));
    newY = Math.max(0, Math.min(maximumY, newY));

    monster.style.left = `${newX}px`;
    monster.style.top = `${newY}px`;

    monster.style.bottom = "auto";
    monster.style.right = "auto";
  });

  monster.addEventListener("pointerup", async (event) => {
    isDragging = false;

    monster.releasePointerCapture(event.pointerId);

    monster.style.zIndex = "10";

    if (!hasMoved) {

      // it stops the Monstar if it is already playing

      if (isPlaying) {
        audio.pause();

        audio.currentTime = 0;

        isPlaying = false;

        monster.classList.remove("playing");

        console.log(`${monster.alt} stopped`);

        return;
      }

      // this here removes the Monstar from the queue if clicked again

      if (isQueued) {
        queuedMonsters.delete(monster);

        isQueued = false;

        monster.classList.remove("queued");

        console.log(`${monster.alt} removed from queue`);

        return;
      }

      // Ensuring the first Monstar starts straight away

      if (!masterStarted) {
        try {
          await audio.play();

          isPlaying = true;

          monster.classList.add("playing");

          startMasterClock();

          console.log(
            `${monster.alt} started the master loop`
          );
        } catch (error) {
          console.error(
            `Could not play ${soundFile}`,
            error
          );
        }

        return;
      }

      // every Monstar after the first waits for the next timed bar

      queuedMonsters.add(monster);

      isQueued = true;

      monster.classList.add("queued");

      console.log(
        `${monster.alt} is waiting for the next bar`
      );
    }
  });

  monster.addEventListener("pointercancel", () => {
    isDragging = false;

    monster.style.zIndex = "10";
  });

  monster.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});

// MASTER CLOCK

function startMasterClock() {
  masterStarted = true;

  masterTimer = setInterval(() => {
    startQueuedMonsters();
  }, barLength);
}

// Ensuring it starts everything waiting in the queue

async function startQueuedMonsters() {
  if (queuedMonsters.size === 0) return;

  const monstersToStart = [...queuedMonsters];

  queuedMonsters.clear();

  for (const monster of monstersToStart) {
    const data = monster.audioData;

    if (!data) continue;

    try {
      data.audio.currentTime = 0;

      await data.audio.play();

      data.setIsPlaying(true);
      data.setIsQueued(false);

      monster.classList.remove("queued");
      monster.classList.add("playing");

      console.log(
        `${monster.alt} started on the new bar`
      );
    } catch (error) {
      data.setIsQueued(false);

      monster.classList.remove("queued");

      console.error(
        `Could not start ${monster.alt}`,
        error
      );
    }
  }
}