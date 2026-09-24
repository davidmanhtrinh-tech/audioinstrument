const monsters = document.querySelectorAll(".monster");
const stage = document.querySelector(".monster-stage");
const zones = document.querySelectorAll(".activation-zone");

monsters.forEach((monster) => {
  let isDragging = false;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  let hasMoved = false;

  // Audio files 
  const soundFile = monster.dataset.sound;

  const audio = new Audio(soundFile);

  audio.loop = true;

  let isPlaying = false;

  audio.addEventListener("error", () => {
    console.error(`Could not load audio: ${soundFile}`);
  });

  // These are the activation zones where the event of the track speed will adjust according to the certain space the Monstars are positioned in
  function checkActivationZone() {
    const monsterBox = monster.getBoundingClientRect();

    /*
      The centre of the Monstar determines which zone
      it currently belongs to.
    */

    const monsterCenterX =
      monsterBox.left + monsterBox.width / 2;

    const monsterCenterY =
      monsterBox.top + monsterBox.height / 2;

    let currentZone = null;

    zones.forEach((zone) => {
      const zoneBox = zone.getBoundingClientRect();

      const insideHorizontally =
        monsterCenterX >= zoneBox.left &&
        monsterCenterX <= zoneBox.right;

      const insideVertically =
        monsterCenterY >= zoneBox.top &&
        monsterCenterY <= zoneBox.bottom;

      if (insideHorizontally && insideVertically) {
        currentZone = zone;
      }
    });

    /*
      Remove the highlighted state from the zones.

      We then highlight only the zone currently
      occupied by this Monstar.
    */

    zones.forEach((zone) => {
      zone.classList.remove("active-zone");
    });

    if (currentZone) {
      const newSpeed = Number(currentZone.dataset.speed);

      audio.playbackRate = newSpeed;

      currentZone.classList.add("active-zone");

      console.log(
        `${monster.alt} entered ${currentZone.querySelector(".zone-label").textContent} zone — ${newSpeed}x speed`
      );
    } else {
      /*
        If the Monstar isn't inside a zone,
        return it to normal speed.
      */

      audio.playbackRate = 1;
    }
  }

  // Check where every Monstar begins
  checkActivationZone();

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

  // Dragging function
  monster.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const moveX = Math.abs(event.clientX - startX);
    const moveY = Math.abs(event.clientY - startY);

    // A small movement threshold separates clicking from dragging

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

    // Keep the Monstar inside the playground

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

    // Unlike P1A, the exact X/Y position does not continuously control a parameter. Instead, the Monstar's behaviour changes when it crosses into a discrete activation zone.//
  

    checkActivationZone();
  });

  //Pointer up 
  monster.addEventListener("pointerup", async (event) => {
    isDragging = false;

    monster.releasePointerCapture(event.pointerId);

    monster.style.zIndex = "10";

    //Clicking without dragging toggles the Monstar's sound.//
   

    if (!hasMoved) {
      if (isPlaying) {
        audio.pause();

        audio.currentTime = 0;

        isPlaying = false;

        monster.classList.remove("playing");

        console.log(`${monster.alt} stopped`);
      } else {
        try {
          //This helps check its current zone immediately before starting so it plays at the correct speed.//
          

          checkActivationZone();

          await audio.play();

          isPlaying = true;

          monster.classList.add("playing");

          console.log(
            `${monster.alt} started at ${audio.playbackRate}x speed`
          );
        } catch (error) {
          console.error(
            `Could not play ${soundFile}`,
            error
          );
        }
      }
    }
  });

  // Pointer cancel functions

  monster.addEventListener("pointercancel", () => {
    isDragging = false;

    monster.style.zIndex = "10";
  });

  // Prevent the browser's normal image dragging

  monster.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});