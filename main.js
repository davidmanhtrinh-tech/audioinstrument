//Browser loads the HTML page - Browser then loads the JS - Open the dialogue - User interacts and closes the dialogue - Audio system loads - User clicks sound button//

//Find our dialogue//

const introDialog = document.getElementById("intro-dialogue");

//Locating the close button

const introCloseButton = document.getElementById("intro-dialog-close");

//Show the found element in our browser modals//

////console.log(introDialog);

//Find our test button//

const testButton = document.getElementById("test-button");

//find my key button for test//

const key = document.getElementById("key-test");

//init our synth//

const synth = new Tone.PolySynth().toDestination();

//is the user currently holding down the key

let mouseButtonHeld = false;

//if user holds down key, set to truem then if they let it up, set to false

window.addEventListener("mousedown", function () {
  mouseButtonHeld = true;
});

window.addEventListener("mouseup", function () {
  mouseButtonHeld = false;
});

//Dialog logic//

introDialog.showModal();

introCloseButton.addEventListener("click", async function closeIntroDialog() {
  introDialog.close();

  await toneInit();
});

//whenever dialog closes, initialise the audio system

introDialog.addEventListener("close", toneInit);

//we put the whole function inside the event listener instead as its only called there//

//Tone//

//Run to setup our audio systems//

async function toneInit() {
  await Tone.start();

  console.log("Tone audio started");
}

// do something when this button is clicked//

testButton.addEventListener("click", playNote);

// function that runs when clicked//

function playNote() {
  // Play a note for a duration//

  synth.triggerAttackRelease("c4", "8n");
}

function playDataNoteD(e) {
  let buttonClicked = e.target;

  //console.log(buttonClicked);

  let note = buttonClicked.dataset.note;

  //console.log(e.note);

  synth.triggerAttackRelease(note, "8n");
}

function startNote(e) {
  //find key that was click - so let key pressed

  let keyPressed = e.target;

  //find the note associated with the key

  let note = keyPressed.dataset.note;

  synth.triggerAttack(note);
}

function endNote(e) {
  let keyPressed = e.target;

  let note = keyPressed.dataset.note;

  synth.triggerRelease(note);
}

key.addEventListener("mousedown", startNote);

key.addEventListener("mouseup", endNote);

key.addEventListener("mouseleave", endNote);

//if user is holding mouse button

key.addEventListener("mouseenter", function (e) {
  if (mouseButtonHeld === true) {
    startNote(e);
  }
});

//key.addEventListener("click", playNoteD);

//testButton.addEventListener("click", playDataNoteD);

//finding the string monster

const onnMonster = document.getElementById("onn-monster");

let monsterDragging = false;

let monsterOffsetX = 0;

let monsterOffsetY = 0;

//dragging component

onnMonster.addEventListener("pointerdown", function (e) {
  monsterDragging = true;
});

//when i click the button, i want to play audio file

const playButton = document.getElementById("play-button");

const randomButton = document.getElementById("random-time");

const audioTrack = document.getElementById("audio-track");

function playAudio() {
  if (audioTrack.paused === true) {
    audioTrack.play();
  } else {
    audioTrack.pause();
  }
}

function randomTime() {
  let trackLength = audioTrack.duration;

  //make sure the audio duration has loaded before choosing a random time

  if (!isNaN(trackLength) && trackLength > 0) {
    audioTrack.currentTime = trackLength * Math.random();
  }
}

randomButton.addEventListener("click", randomTime);

playButton.addEventListener("click", playAudio);

//set slider to change oscilliator

const oscSlider = document.getElementById("osc-range");

function changeOsc(e) {
  console.log(e.target.value);

  if (e.target.value > 50) {
    synth.set({
      oscillator: {
        type: "square",
      },
    });
  } else {
    synth.set({
      oscillator: {
        type: "sine",
      },
    });
  }
}

oscSlider.addEventListener("change", changeOsc);

//spatial control section

const flowerImage = document.getElementById("flower-painting");

flowerImage.addEventListener("mouseenter", startNote);

flowerImage.addEventListener("mouseleave", endNote);

function pitchBend(e) {
  console.log(e.offsetX);

  synth.set({
    detune: e.offsetX,
  });
}

flowerImage.addEventListener("mousemove", pitchBend);

//what is the current
let currentInstant = Temporal.Now.Instant();

//find our time now
let timeZone = Temporal.Now.timeZone.Id();
console.log(timeZone);

//convert to local time
let currentTime = currentInstant.toZoneDateTimeISD();
console.log(currentTime);
//convert to plain time
let plainTime = Temporal.PlainTime.from(currentTime);
console.log(plainTime.minutes);

if (plainTime.minute > 54) {
  audioTrack.playbackRate = 0.5;
}
