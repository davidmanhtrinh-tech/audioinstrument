const monsters = document.querySelectorAll(".monster");
const stage = document.querySelector(".monster-stage");

// 100 BPM = one beat every 600 milliseconds
const beatLength = 600;

// one shared beat for all of the Monstars
let currentBeat = 0;

// keeps track of each Monstar and its sound
const monsterData = new Map();

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

  // Audio component

  const soundFile = monster.dataset.sound;
  const audio = new Audio(soundFile);

  // makes the audio loop
  audio.loop = true;

  const beatPattern = monster.dataset.pattern
    .split(",")
    .map(Number);

  monsterData.set(monster, {
    audio: audio,
    isPlaying: false,
    beatPattern: beatPattern
  });

  audio.addEventListener("error", () => {
    console.error(`Could not load audio: ${soundFile}`);
  });

  // Dragging function

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

    let newX = event.clientX - stageBox.left - offsetX;
    let newY = event.clientY - stageBox.top - offsetY;

    // keeps the Monstars inside the stage

    const monsterWidth = monster.offsetWidth;
    const monsterHeight = monster.offsetHeight;

    const maximumX = stageBox.width - monsterWidth;
    const maximumY = stageBox.height - monsterHeight;

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
      const data = monsterData.get(monster);

      // turns the Monstar off
      if (data.isPlaying) {
        data.audio.pause();
        data.audio.currentTime = 0;

        data.isPlaying = false;

        monster.classList.remove("playing");
        monster.classList.remove("beat");

        console.log(`${monster.alt} stopped`);
      }

      // turns the Monstar on

      else {
        try {

          // it starts from the beginning of its loop

          data.audio.currentTime = 0;

          await data.audio.play();

          data.isPlaying = true;

          monster.classList.add("playing");

          console.log(`${monster.alt} joined the shared rhythm`);
        } catch (error) {
          console.error(
            `Could not play ${soundFile}`,
            error
          );
        }
      }
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

// The Monstars will have a shared rhythm

function sharedBeat() {
  monsterData.forEach((data, monster) => {
    // only checks Monstars that are playing

    if (!data.isPlaying) return;

    // checks if the Monstar should move on this beat

    if (data.beatPattern.includes(currentBeat)) {
      monster.classList.remove("beat");

      // lets the animation restart

      void monster.offsetWidth;

      monster.classList.add("beat");
    }
  });

  // moves through beats 1, 2, 3 and 4

  currentBeat = (currentBeat + 1) % 4;
}

// starts one clock that every single Monstar uses

sharedBeat();

setInterval(() => {
  sharedBeat();
}, beatLength);