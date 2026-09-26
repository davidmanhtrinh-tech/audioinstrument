const monsters = document.querySelectorAll(".monster");
const stage = document.querySelector(".monster-stage");

const monsterData = new Map();

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

// makes the audio loop

  const soundFile = monster.dataset.sound;

  const audio = new Audio(soundFile);

  audio.loop = true;

  let isPlaying = false;

  audio.addEventListener("error", () => {
    console.error(`Could not load audio: ${soundFile}`);
  });

  monsterData.set(monster, {
    audio: audio,
    getIsPlaying: () => isPlaying
  });

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

 // separates clicking from dragging

  monster.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const moveX = Math.abs(event.clientX - startX);
    const moveY = Math.abs(event.clientY - startY);

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

    // Keeping the Monstars within its space 

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

// updates the sound when the Monstars move

    updateSpatialRelationships();
  });

  // Pointer up

  monster.addEventListener("pointerup", async (event) => {
    isDragging = false;

    monster.releasePointerCapture(event.pointerId);

    monster.style.zIndex = "10";

    // Click without dragging = sound on/off

    if (!hasMoved) {
      if (isPlaying) {
        audio.pause();

        audio.currentTime = 0;

        isPlaying = false;

        monster.classList.remove("playing");

        console.log(`${monster.alt} stopped`);
      } else {
        try {
          updateSpatialRelationships();

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

  // Pointer cancel

  monster.addEventListener("pointercancel", () => {
    isDragging = false;

    monster.style.zIndex = "10";
  });

  monster.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});

// Spatial relationship
function updateSpatialRelationships() {
  monsters.forEach((monster) => {
    const currentData = monsterData.get(monster);

    if (!currentData) return;

    const monsterBox = monster.getBoundingClientRect();

    const monsterCenterX =
      monsterBox.left + monsterBox.width / 2;

    const monsterCenterY =
      monsterBox.top + monsterBox.height / 2;

    let nearestDistance = Infinity;

    // Compare this Monstar with every other Monstar

    monsters.forEach((otherMonster) => {
      if (otherMonster === monster) return;

      const otherBox =
        otherMonster.getBoundingClientRect();

      const otherCenterX =
        otherBox.left + otherBox.width / 2;

      const otherCenterY =
        otherBox.top + otherBox.height / 2;

      const horizontalDistance =
        monsterCenterX - otherCenterX;

      const verticalDistance =
        monsterCenterY - otherCenterY;

      const distance = Math.sqrt(
        horizontalDistance * horizontalDistance +
        verticalDistance * verticalDistance
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
      }
    });

  // stops the volume from going above or below the values I want

    
      //At or below this distance, the Monstar reaches full volume.
  

    const closeDistance = 150;

    // At or beyond this distance, the Monstar reaches minimum volume.
   

    const farDistance = 650;

    const minimumVolume = 0.2;
    const maximumVolume = 1;

    let proximity =
      1 -
      (nearestDistance - closeDistance) /
        (farDistance - closeDistance);

    proximity = Math.max(
      0,
      Math.min(1, proximity)
    );

    const volume =
      minimumVolume +
      proximity *
        (maximumVolume - minimumVolume);

    currentData.audio.volume = volume;

    console.log(
      `${monster.alt} | nearest Monstar: ${Math.round(nearestDistance)}px | volume: ${volume.toFixed(2)}`
    );
  });
}

// checks their starting positions when the page loads

updateSpatialRelationships();