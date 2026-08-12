//Browser loads the HTML page - Browser then loads the JS - Open the dialogue - User interacts and closes the dialogue - Audio system loads - User clicks sound button//
//Find our dialogue
const introDialog = document.getElementById("intro-dialogue");
//Locating the close button
const introCloseButton = document.getElementById("intro-dialog-close");
//Show the found element in our browser modals
//console.log(introDialog);
//Find our test button//
const testButton = document.getElementById("test-button");

//init our synth//
const synth = new Tone.Synth().toDestination();

//Dialog logic
introDialog.showModal();
introCloseButton.addEventListener("click", function closeIntroDialog() {
  introDialog.close();
});

// do something when this button is clicked//
testButton.addEventListener("click", playNote);

// function that runs when clicked//
function playNote() {
  // Play a note for a duration//
  synth.triggerAttackRelease("C4", "8n");
}
