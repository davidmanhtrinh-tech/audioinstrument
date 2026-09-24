const monsters = document.querySelectorAll(".monster");

const stage = document.querySelector(".monster-stage");

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

  // Selection of Audio files 
  const soundFile = monster.dataset.sound;

  const audio = new Audio(soundFile);

  // Make each Monstar's sound repeat continuously
  audio.loop = true;

  let isPlaying = false;

  // Tell us if an audio file cannot be found
  audio.addEventListener("error", () => {
    console.error(`Could not load audio: ${soundFile}`);
  });

  //Here I've incorporated spatial paremeteres for both volume and playback speed. 
  function updateSoundFromPosition() {
    const stageBox = stage.getBoundingClientRect();
    const monsterBox = monster.getBoundingClientRect();

    // Find the centre of the Monstar
    const monsterCenterX =
      monsterBox.left - stageBox.left + monsterBox.width / 2;

    const monsterCenterY =
      monsterBox.top - stageBox.top + monsterBox.height / 2;

    // Convert position into a value between 0 and 1
    let xPosition = monsterCenterX / stageBox.width;
    let yPosition = monsterCenterY / stageBox.height;

    // Prevent values from going outside the stage
    xPosition = Math.max(0, Math.min(1, xPosition));
    yPosition = Math.max(0, Math.min(1, yPosition));

    // I wanted the x-position to be the parameter for the playback speed, right being faster and left being slower. 

    const minimumSpeed = 0.6;
    const maximumSpeed = 1.4;

    const playbackSpeed =
      minimumSpeed +
      xPosition * (maximumSpeed - minimumSpeed);

    audio.playbackRate = playbackSpeed;

    // Y-positioning shall dictate the increase and decrease of volume, allowing certain sounds to dominate while others because subtle. 

    const minimumVolume = 0.15;
    const maximumVolume = 1;

    // Invert Y because 0 is the TOP of the browser
    const invertedY = 1 - yPosition;

    const volume =
      minimumVolume +
      invertedY * (maximumVolume - minimumVolume);

    audio.volume = volume;

    console.log(
      `${monster.alt} | Volume: ${volume.toFixed(2)} | Speed: ${playbackSpeed.toFixed(2)}x`
    );
  }

  // Give every Monstar its correct starting
  // volume and speed based on its starting position
  updateSoundFromPosition();

  // Pointer down

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

  // This is the dragging functions

  monster.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const moveX = Math.abs(event.clientX - startX);
    const moveY = Math.abs(event.clientY - startY);

    // A small threshold separates a click from a drag
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

    // Keeping monsters within the proximity of the stage

    const monsterWidth = monster.offsetWidth;
    const monsterHeight = monster.offsetHeight;

    const maximumX =
      stageBox.width - monsterWidth;

    const maximumY =
      stageBox.height - monsterHeight;

    newX = Math.max(0, Math.min(maximumX, newX));
    newY = Math.max(0, Math.min(maximumY, newY));

    // Move the Monstar
    monster.style.left = `${newX}px`;
    monster.style.top = `${newY}px`;

    monster.style.bottom = "auto";
    monster.style.right = "auto";

    // Update the sound continuously while dragging
    updateSoundFromPosition();
  });

  //Pointer up

  monster.addEventListener("pointerup", async (event) => {
    isDragging = false;

    monster.releasePointerCapture(event.pointerId);

    monster.style.zIndex = "10";

    // If the Monstar was clicked instead of dragged,
    // turn its sound on or off 
    if (!hasMoved) {
      if (isPlaying) {
        audio.pause();

        audio.currentTime = 0;

        isPlaying = false;

        monster.classList.remove("playing");

        console.log(`${monster.alt} stopped`);
      } else {
        try {
          // Make sure the latest position determines
          // the sound before playback begins
          updateSoundFromPosition();

          await audio.play();

          isPlaying = true;

          monster.classList.add("playing");

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

  // This is the pointer cancel 

  monster.addEventListener("pointercancel", () => {
    isDragging = false;

    monster.style.zIndex = "10";
  });

  // Prevent normal browser image dragging
  monster.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});