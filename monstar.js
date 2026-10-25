
const welcomeOverlay = document.getElementById("welcomeOverlay");
const playButton = document.getElementById("playButton");

// keeps the playground locked until you press play
const playground = document.querySelector("main");

if (welcomeOverlay && playButton) {
  playground.inert = true;

  playButton.addEventListener("click", () => {
    welcomeOverlay.classList.add("hidden");
    playground.inert = false;
  });
}

const monsters = document.querySelectorAll(".monster");

const stage = document.querySelector(".monster-stage");

// buttons for pausing and resetting everything
const pauseAllButton = document.getElementById("pauseAllButton");
const resetButton = document.getElementById("resetButton");

let allPaused = false;

// all the Monstars follow the same 10-second loop
// each recording needs to start on the same beat
const LOOP_DURATION = 10;
const SYNC_TOLERANCE = 0.12;
let bandStartTime = null;
let bandPausedPosition = 0;

function getBandPosition() {
  if (bandStartTime === null || allPaused) return bandPausedPosition;
  return ((performance.now() - bandStartTime) / 1000) % LOOP_DURATION;
}

function startBandTimeline() {
  if (bandStartTime === null && !allPaused) {
    bandStartTime = performance.now() - bandPausedPosition * 1000;
  }
}

function syncMonsterToBand(state) {
  if (bandStartTime === null && !allPaused) startBandTimeline();

  const target = getBandPosition();
  const audio = state.audio;

  // makes sure the sound stays within the audio file
  const safeTarget = Number.isFinite(audio.duration)
    ? Math.min(target, Math.max(0, audio.duration - 0.02))
    : target;

  try {
    audio.currentTime = safeTarget;
  } catch (error) {
    console.warn("Could not seek Monstar audio:", error);
  }
}

function playMonsterInSync(state) {
  syncMonsterToBand(state);

  state.audio.play().catch((error) => {
    console.warn("Audio could not play:", error);
  });
}

// browser audio can sometimes go slightly out of sync
// checks for bigger timing differences without constantly restarting the sound
setInterval(() => {
  if (allPaused || bandStartTime === null) return;

  const target = getBandPosition();

  monsterStates.forEach((state) => {
    if (
      !state.active ||
      !state.playing ||
      state.audio.paused ||
      state.audio.readyState < 1
    ) return;

    const current = state.audio.currentTime % LOOP_DURATION;
    const difference = Math.abs(current - target);
    const circularDifference = Math.min(
      difference,
      LOOP_DURATION - difference
    );

    if (circularDifference > SYNC_TOLERANCE) {
      syncMonsterToBand(state);
    }
  });
}, 500);


// setting up the Web Audio API
// the Monstars all use the same audio context
const AudioContextClass =
  window.AudioContext || window.webkitAudioContext;

let audioContext = null;

function getAudioContext() {
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch((error) => {
      console.warn("Audio context could not resume:", error);
    });
  }

  return audioContext;
}

// each staircase level changes the volume, sound and animation
// these positions match the yellow staircase
const steps = [
  {
    name: "top",
    start: 0.52,
    end: 0.65,
    feet: 0.585,
    volume: 1,
    filterFrequency: 18000,
  },
  {
    name: "middle",
    start: 0.65,
    end: 0.86,
    feet: 0.72,
    volume: 0.65,
    filterFrequency: 6500,
  },
  {
    name: "bottom",
    start: 0.84,
    end: 1,
    feet: 0.905,
    volume: 0.3,
    filterFrequency: 1200,
  },
];

// small position fixes for Monstars with different SVG sizes
const monsterStepOffsets = {
  guitar: 0.02,
  duckler: 0.025,
};

// tracks which Monstars are active and playing
const monsterStates = new Map();

// saves where each Monstar started for the reset button
const monsterStartingPositions = new Map();

// gives each Monstar its own audio filter
function connectMonsterAudio(state) {
  if (state.filter) return;

  const context = getAudioContext();

  if (!context) return;

  const source = context.createMediaElementSource(state.audio);
  const filter = context.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.value = 18000;
  filter.Q.value = 0.707;

  source.connect(filter);
  filter.connect(context.destination);

  state.source = source;
  state.filter = filter;
}

// changes how the sound feels depending on the step
function updateMonsterTone(state, step) {
  connectMonsterAudio(state);

  if (!state.filter || !audioContext) return;

  const currentTime = audioContext.currentTime;

  state.filter.frequency.cancelScheduledValues(currentTime);
  state.filter.frequency.setTargetAtTime(
    step.filterFrequency,
    currentTime,
    0.08
  );
}

// adds the glowing steps and little music notes
const stepGlowElements = new Map();
steps.forEach((step) => {
  const glow = document.createElement("div");
  glow.className = `step-drop-glow step-drop-glow--${step.name}`;
  glow.setAttribute("aria-hidden", "true");
  stage.appendChild(glow);
  stepGlowElements.set(step.name, glow);
});
let highlightedStep = null;

function getStepFromPosition(monster) {
  const stageBox = stage.getBoundingClientRect();
  const monsterBox = monster.getBoundingClientRect();
  const relativeY = (monsterBox.bottom - stageBox.top) / stageBox.height;
  return steps.find((step) => relativeY >= step.start && relativeY < step.end);
}

function highlightStep(step) {
  const name = step ? step.name : null;
  if (highlightedStep === name) return;
  highlightedStep = name;
  stepGlowElements.forEach((glow, stepName) => {
    glow.classList.toggle("is-highlighted", stepName === name);
  });
}

function clearStepHighlight() {
  highlightStep(null);
}

function createMusicalNoteBurst(monster) {
  const monsterBox = monster.getBoundingClientRect();
  const stageBox = stage.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "musical-note-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = `${monsterBox.left - stageBox.left + monsterBox.width / 2}px`;
  burst.style.top = `${monsterBox.top - stageBox.top}px`;
  const symbols = ["♪", "♫", "♪", "♬"];
  const colors = ["#ffe572", "#ff9fcb", "#81e5ff", "#a9ff8c"];
  symbols.forEach((symbol, index) => {
    const note = document.createElement("span");
    note.className = "musical-burst-note";
    note.textContent = symbol;
    note.style.color = colors[index];
    note.style.setProperty("--note-x", `${[-52, -18, 24, 57][index]}px`);
    note.style.setProperty("--note-y", `${[-65, -95, -82, -58][index]}px`);
    note.style.animationDelay = `${index * 0.07}s`;
    burst.appendChild(note);
  });
  stage.appendChild(burst);
  setTimeout(() => burst.remove(), 1300);
}

// the beat is set to 120 BPM, with different speeds for each step
const BEAT_DURATION = 60 / 120;
const stepBeatCounts = { top: 1, middle: 2, bottom: 4 };

function syncMonsterAnimation(monster) {
  const state = monsterStates.get(monster);
  if (!state || !state.active || !state.playing || allPaused) return;
  const beatCount = stepBeatCounts[state.step.name];
  const cycleDuration = BEAT_DURATION * beatCount;
  const offset = getBandPosition() % cycleDuration;
  // keeps the movement lined up with the music
  monster.style.animation = "none";
  void monster.offsetWidth;
  monster.style.animation = "";
  monster.style.animationDelay = `${-offset}s`;
  monster.style.animationPlayState = "running";
}

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

  // saves each Monstar’s starting position
  monsterStartingPositions.set(monster, {
    left: monster.style.left,
    top: monster.style.top,
    right: monster.style.right,
    bottom: monster.style.bottom,
    zIndex: monster.style.zIndex,
  });

  const audio = new Audio(monster.dataset.sound);
  audio.loop = true;
  audio.volume = 0;

  const state = {
    audio: audio,
    active: false,
    playing: false,
    step: null,
    source: null,
    filter: null,
  };

  monsterStates.set(monster, state);

  // lines up the audio if it finishes loading late
  audio.addEventListener("loadedmetadata", () => {
    if (state.active && state.playing && !allPaused) {
      syncMonsterToBand(state);
    }
  });

  // all the Monstars start off dark and silent
  monster.classList.add("inactive");

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

    const distance = Math.hypot(
      event.clientX - startX,
      event.clientY - startY
    );

    // tells the difference between a click and a drag
    if (distance < 6 && !hasMoved) return;

    hasMoved = true;

    const stageBox = stage.getBoundingClientRect();

    let newX = event.clientX - stageBox.left - offsetX;
    let newY = event.clientY - stageBox.top - offsetY;

    // stops the Monstars from being dragged outside the stage
    newX = Math.max(
      0,
      Math.min(newX, stageBox.width - monster.offsetWidth)
    );

    newY = Math.max(
      0,
      Math.min(newY, stageBox.height - monster.offsetHeight)
    );

    monster.style.left = `${newX}px`;
    monster.style.top = `${newY}px`;

    monster.style.bottom = "auto";
    monster.style.right = "auto";

    highlightStep(getStepFromPosition(monster));
  });

  monster.addEventListener("pointerup", (event) => {
    if (!isDragging) return;

    isDragging = false;

    if (monster.hasPointerCapture(event.pointerId)) {
      monster.releasePointerCapture(event.pointerId);
    }

    monster.style.zIndex = "10";
    clearStepHighlight();

    if (hasMoved) {
      checkStep(monster);
    } else if (state.active) {
      toggleSound(monster);
    }
  });

  monster.addEventListener("pointercancel", () => {
    isDragging = false;

    monster.style.zIndex = "10";
    clearStepHighlight();
  });

  monster.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});

// checks which step a Monstar has been dropped onto
function checkStep(monster) {
  const selectedStep = getStepFromPosition(monster);
  if (selectedStep) {
    activateMonster(monster, selectedStep);
    createMusicalNoteBurst(monster);
  } else {
    deactivateMonster(monster);
  }
}

// turns the Monstar on when it lands on a step
function activateMonster(monster, step) {
  const state = monsterStates.get(monster);

  const stageBox = stage.getBoundingClientRect();

  state.active = true;
  state.playing = true;
  state.step = step;

  // lines up Guitar and Duckler so their feet sit properly
  let verticalOffset = 0;

  if (monster.classList.contains("guitar")) {
    verticalOffset = monsterStepOffsets.guitar;
  } else if (monster.classList.contains("duckler")) {
    verticalOffset = monsterStepOffsets.duckler;
  }

  // places the Monstar neatly on the yellow step
  const targetY =
    stageBox.height * (step.feet + verticalOffset) -
    monster.offsetHeight;

  monster.style.top = `${targetY}px`;
  monster.style.bottom = "auto";

  monster.classList.remove("inactive", "paused");
  monster.classList.add("active");

  monster.dataset.step = step.name;

  // changes the volume and tone based on the step
  state.audio.volume = step.volume;
  updateMonsterTone(state, step);

  // plays the sound if it is not already playing
  if (state.audio.paused && !allPaused) {
    playMonsterInSync(state);
  }

  // keeps the Monstar paused if everything is paused
  if (allPaused) {
    state.audio.pause();
    monster.style.animationPlayState = "paused";
  } else {
    syncMonsterAnimation(monster);
  }
}

// click a Monstar to pause or play its sound
function toggleSound(monster) {
  const state = monsterStates.get(monster);

  if (!state.active) return;

  // stops individual clicks while everything is paused
  if (allPaused) return;

  if (state.playing) {
    state.audio.pause();
    state.playing = false;

    monster.classList.remove("active");
    monster.classList.add("paused");
  } else {
    state.audio.volume = state.step.volume;
    updateMonsterTone(state, state.step);

    playMonsterInSync(state);

    state.playing = true;

    monster.classList.remove("paused");
    monster.classList.add("active");
    syncMonsterAnimation(monster);
  }
}

// taking a Monstar off the steps turns it off
function deactivateMonster(monster) {
  const state = monsterStates.get(monster);

  state.audio.pause();
  state.audio.currentTime = 0;
  state.audio.volume = 0;

  state.active = false;
  state.playing = false;
  state.step = null;

  monster.classList.remove("active", "paused");
  monster.classList.add("inactive");

  monster.style.animationPlayState = "";
  monster.style.animationDelay = "";

  delete monster.dataset.step;

  if (![...monsterStates.values()].some((other) => other.active)) {
    bandStartTime = null;
    bandPausedPosition = 0;
  }
}

// pauses or plays all the Monstars together
function toggleAllSounds() {
  if (!allPaused) {
    // remembers where the music stopped
    bandPausedPosition = getBandPosition();
    allPaused = true;
    bandStartTime = null;
  } else {
    allPaused = false;
    getAudioContext();

    // picks up the music from where it was paused
    if (
      [...monsterStates.values()].some(
        (state) => state.active && state.playing
      )
    ) {
      startBandTimeline();
    }
  }

  monsters.forEach((monster) => {
    const state = monsterStates.get(monster);

    if (!state.active) return;

    if (allPaused) {
      // only pauses the Monstars that are playing
      if (state.playing) {
        state.audio.pause();
        monster.style.animationPlayState = "paused";
      }
    } else {
      // only resumes the Monstars that were playing
      if (state.playing) {
        state.audio.volume = state.step.volume;
        updateMonsterTone(state, state.step);

        playMonsterInSync(state);

        syncMonsterAnimation(monster);
      }
    }
  });

  if (pauseAllButton) {
    pauseAllButton.textContent = allPaused
      ? "RESUME ALL"
      : "PAUSE ALL";

    pauseAllButton.setAttribute(
      "aria-pressed",
      String(allPaused)
    );
  }
}

// resets all the Monstars back to the beginning
function resetAllMonsters() {
  monsters.forEach((monster) => {
    const state = monsterStates.get(monster);
    const startingPosition = monsterStartingPositions.get(monster);

    // stops the sounds and starts them from zero
    state.audio.pause();
    state.audio.currentTime = 0;
    state.audio.volume = 0;

    state.active = false;
    state.playing = false;
    state.step = null;

    // makes the Monstars dark again
    monster.classList.remove("active", "paused");
    monster.classList.add("inactive");

    monster.style.animationPlayState = "";
    monster.style.animationDelay = "";

    delete monster.dataset.step;

    // moves the Monstars back to where they started
    monster.style.left = startingPosition.left;
    monster.style.top = startingPosition.top;
    monster.style.right = startingPosition.right;
    monster.style.bottom = startingPosition.bottom;
    monster.style.zIndex = startingPosition.zIndex;
  });

  clearStepHighlight();
  stage.querySelectorAll(".musical-note-burst").forEach((burst) => burst.remove());

  // resets the timing for the next play
  bandStartTime = null;
  bandPausedPosition = 0;

  // makes sure everything is no longer paused
  allPaused = false;

  if (pauseAllButton) {
    pauseAllButton.textContent = "PAUSE ALL";
    pauseAllButton.setAttribute("aria-pressed", "false");
  }
}

// makes the pause and reset buttons work
if (pauseAllButton) {
  pauseAllButton.addEventListener("click", toggleAllSounds);
}

if (resetButton) {
  resetButton.addEventListener("click", resetAllMonsters);
}


// adjusts the Monstars when the stage changes size
// keeps them lined up with the steps and on screen
let previousStageWidth = stage.clientWidth;
let previousStageHeight = stage.clientHeight;

function updateMonstarsForStageResize() {
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  if (!stageWidth || !stageHeight) return;

  monsters.forEach((monster) => {
    const state = monsterStates.get(monster);
    const maxLeft = Math.max(0, stageWidth - monster.offsetWidth);

    if (state.active && state.step) {
      const oldLeft = parseFloat(monster.style.left);
      if (Number.isFinite(oldLeft)) {
        const oldAvailableWidth = Math.max(1, previousStageWidth - monster.offsetWidth);
        const newAvailableWidth = Math.max(0, stageWidth - monster.offsetWidth);
        monster.style.left = `${Math.max(0, Math.min(newAvailableWidth, oldLeft / oldAvailableWidth * newAvailableWidth))}px`;
      } else {
        const visualLeft = monster.getBoundingClientRect().left - stage.getBoundingClientRect().left;
        monster.style.left = `${Math.max(0, Math.min(maxLeft, visualLeft))}px`;
      }

      let verticalOffset = 0;
      if (monster.classList.contains("guitar")) verticalOffset = monsterStepOffsets.guitar;
      else if (monster.classList.contains("duckler")) verticalOffset = monsterStepOffsets.duckler;
      monster.style.top = `${stageHeight * (state.step.feet + verticalOffset) - monster.offsetHeight}px`;
      monster.style.bottom = "auto";
    } else if (monster.style.top && monster.style.top !== "auto") {
      // keeps moved Monstars on screen when resizing
      const oldTop = parseFloat(monster.style.top);
      const oldLeft = parseFloat(monster.style.left);
      if (Number.isFinite(oldTop)) {
        monster.style.top = `${Math.max(0, Math.min(stageHeight - monster.offsetHeight, oldTop / Math.max(1, previousStageHeight) * stageHeight))}px`;
      }
      if (Number.isFinite(oldLeft)) {
        monster.style.left = `${Math.max(0, Math.min(maxLeft, oldLeft / Math.max(1, previousStageWidth) * stageWidth))}px`;
      }
    }
  });

  previousStageWidth = stageWidth;
  previousStageHeight = stageHeight;
  clearStepHighlight();
}

if (typeof ResizeObserver !== "undefined") {
  const stageResizeObserver = new ResizeObserver(updateMonstarsForStageResize);
  stageResizeObserver.observe(stage);
} else {
  window.addEventListener("resize", updateMonstarsForStageResize);
}
