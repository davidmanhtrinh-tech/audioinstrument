
const welcomeOverlay = document.getElementById("welcomeOverlay");
const playButton = document.getElementById("playButton");

// prevents interaction with the playground until PLAY is pressed
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

// the three steps control volume and animation
// positions match the enlarged yellow staircase
const steps = [
  {
    name: "top",
    start: 0.52,
    end: 0.65,
    feet: 0.585,
    volume: 1,
  },
  {
    name: "middle",
    start: 0.65,
    end: 0.86,
    feet: 0.72,
    volume: 0.65,
  },
  {
    name: "bottom",
    start: 0.84,
    end: 1,
    feet: 0.905,
    volume: 0.3
  },
];

// keeps track of each Monstar and its audio
const monsterStates = new Map();

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

  const audio = new Audio(monster.dataset.sound);
  audio.loop = true;
  audio.volume = 0;

  const state = {
    audio: audio,
    active: false,
    playing: false,
    step: null,
  };

  monsterStates.set(monster, state);

  // Monstars begin darkened and silent
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

    // separates clicking from dragging
    if (distance < 6 && !hasMoved) return;

    hasMoved = true;

    const stageBox = stage.getBoundingClientRect();

    let newX = event.clientX - stageBox.left - offsetX;
    let newY = event.clientY - stageBox.top - offsetY;

    // keeps the Monstars inside the stage
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
  });

  monster.addEventListener("pointerup", (event) => {
    if (!isDragging) return;

    isDragging = false;

    if (monster.hasPointerCapture(event.pointerId)) {
      monster.releasePointerCapture(event.pointerId);
    }

    monster.style.zIndex = "10";

    if (hasMoved) {
      checkStep(monster);
    } else if (state.active) {
      toggleSound(monster);
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

// checks which step the Monstar is standing on
function checkStep(monster) {
  const stageBox = stage.getBoundingClientRect();
  const monsterBox = monster.getBoundingClientRect();

  const feetY = monsterBox.bottom - stageBox.top;
  const relativeY = feetY / stageBox.height;

  const selectedStep = steps.find(
    (step) =>
      relativeY >= step.start &&
      relativeY < step.end
  );

  if (selectedStep) {
    activateMonster(monster, selectedStep);
  } else {
    deactivateMonster(monster);
  }
}

// activates the Monstar when placed on a step
function activateMonster(monster, step) {
  const state = monsterStates.get(monster);

  const stageBox = stage.getBoundingClientRect();

  state.active = true;
  state.playing = true;
  state.step = step;

  // snaps the Monstar onto the bright yellow step surface
  const targetY =
    stageBox.height * step.feet - monster.offsetHeight;

  monster.style.top = `${targetY}px`;
  monster.style.bottom = "auto";

  monster.classList.remove("inactive", "paused");
  monster.classList.add("active");

  monster.dataset.step = step.name;

  state.audio.volume = step.volume;

  // starts the sound if it is not already playing
  if (state.audio.paused) {
    state.audio.play().catch((error) => {
      console.warn("Audio could not play:", error);
    });
  }
}

// clicking an active Monstar pauses or resumes its sound
function toggleSound(monster) {
  const state = monsterStates.get(monster);

  if (!state.active) return;

  if (state.playing) {
    state.audio.pause();
    state.playing = false;

    monster.classList.remove("active");
    monster.classList.add("paused");
  } else {
    state.audio.volume = state.step.volume;

    state.audio.play().catch((error) => {
      console.warn("Audio could not play:", error);
    });

    state.playing = true;

    monster.classList.remove("paused");
    monster.classList.add("active");
  }
}

// dragging the Monstar away from the steps deactivates it
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

  delete monster.dataset.step;
}
