const monsters = document.querySelectorAll(".monster");
const stage = document.querySelector(".monster-stage");

// 100 BPM = one beat every 600 milliseconds
const beatLength = 600;

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

  // audio

  const soundFile = monster.dataset.sound;
  const audio = new Audio(soundFile);

  audio.loop = true;

  let isPlaying = false;

  // gets the beat pattern from the HTML
  const beatPattern = monster.dataset.pattern
    .split(",")
    .map(Number);

  let currentBeat = 0;
  let beatTimer = null;

  audio.addEventListener("error", () => {
    console.error(`Could not load audio: ${soundFile}`);
  });

  // timed animation

  function triggerAnimation() {
    // this checks if this beat belongs to the Monstar

    if (beatPattern.includes(currentBeat)) {
      monster.classList.remove("beat");

      // lets the animation restart each time

      void monster.offsetWidth;

      monster.classList.add("beat");
    }

    // moves through beats 1, 2, 3 and 4
    currentBeat = (currentBeat + 1) % 4;
  }

  function startTimedAnimation() {
    currentBeat = 0;

    // this function triggers the first beat straight away
    triggerAnimation();

    beatTimer = setInterval(() => {
      triggerAnimation();
    }, beatLength);
  }

  function stopTimedAnimation() {
    clearInterval(beatTimer);

    beatTimer = null;

    currentBeat = 0;

    monster.classList.remove("beat");
  }

  // dragging function

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

    // this if function ensures it separates clicking from dragging
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

    // clicking turns the Monstar on or off

    if (!hasMoved) {
      if (isPlaying) {
        audio.pause();

        audio.currentTime = 0;

        isPlaying = false;

        stopTimedAnimation();

        console.log(`${monster.alt} stopped`);
      } else {
        try {
          // starts the sound and timed animation together
          await audio.play();

          isPlaying = true;

          startTimedAnimation();

          console.log(`${monster.alt} started`);
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