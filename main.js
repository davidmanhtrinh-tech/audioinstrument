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

window.addEventListener("mousedown", function () {});

//Dialog logic//
introDialog.showModal();
introCloseButton.addEventListener("click", function closeIntroDialog() {
  introDialog.close();
  toneInit();
});

//whenever dialog closes, initialise the audio system
introDialog.addEventListener("close", toneInit);
//we put the whole function inside the event listener instead as its only called there//

//Tone//
//Run to setup our audio systems//
function toneInit() {
  synth.connect(Tone.destination);
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
  synth.triggerAttackRelease(note);
}

function endNote(e) {
  let keyPressed = e.target;
  let note = keyPressed.dataset.note;
  synth.triggerAttackRelease(note);
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
