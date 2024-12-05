const questionsPerPhase = {
  1: 8,
  2: 12,
  3: 14,
  4: 14,
  5: 10,
  6: 2,
};

const truthsToUnlockDare = 2;
const maxTruthsBeforeDarePrompt = 5;

const phasePrompts = {
  1: "Game's over! We're just going to start again.",
  2: "Let's talk more about you two 💘",
  3: "Time to heat things up a little 😍",
  4: "Let's get a little naughty 🫦",
  5: "Wanna get even naughtier???",
  6: "OK, last few questions! Dares only!",
};

window.addEventListener('load', () => {
  const buttonContainer = document.querySelector('.button-container');
  const staticCard = document.querySelector('.static-card');
  const dareButton = document.getElementById('dareBtn');
  const truthButton = document.getElementById('truthBtn');

  // Hide buttons and static card initially
  buttonContainer.style.display = 'none';
  staticCard.style.display = 'none';

  // Set initial card position
  const card = document.getElementById('card');
  card.style.transform = 'translateX(-150%)'; // Off-screen to the left
  card.style.visibility = 'hidden';

  // **Enable Dare button by default**
  dareButton.disabled = false;
  dareButton.classList.add('button-active'); // Style as active
  dareButton.classList.remove('button-disabled');

  // Enable Truth button for Phase 1 (lock only in Phase 6)
  truthButton.disabled = false;
  truthButton.classList.remove('button-disabled');

  // Update card color for the current phase
  updateCardColor();

  console.log("Initial game setup complete. Dare button unlocked.");
});

// UPDATE: Ensure the static card slides into view properly
document.getElementById('playGameButton').addEventListener('click', () => {
  document.getElementById('playGameButton').style.display = 'none'; // Hide the Play Game button

  // Slide in truth/dare buttons from the top
  const buttonContainer = document.querySelector('.button-container');
  buttonContainer.style.display = 'flex'; // Show the buttons
  buttonContainer.style.transform = 'translateY(-100%)'; // Start off-screen
  setTimeout(() => {
    buttonContainer.style.transform = 'translateY(0)'; // Slide in from the top
  }, 100);

  // Ensure static card has transition for sliding effect
  const staticCard = document.querySelector('.static-card');
  staticCard.style.display = 'block'; // Show the static card
  staticCard.style.transition = 'transform 0.5s ease'; // <-- ADD: Slide transition
  staticCard.style.transform = 'translateY(250%)'; // Start off-screen
  setTimeout(() => {
    staticCard.style.transform = 'translateY(0)'; // Slide in from the bottom
  }, 300);
});

let isCardVisible = false;

let questions = []; // Store all questions
let askedQuestions = {}; // Track asked questions by type and phase
let truthCounter = 0;
let dareCounter = 0;
let questionsCounter = 0;
let currentPhase = 1;
let truthsSinceLastDare = 0;
let dareUnlocked = false;
let dareUnlockAnnounced = false; // Track if the dare unlock has been announced
let dareUnlockReady = false; // Track if the requirement for unlocking Dare has been met

function updateCardColor() {
  const phaseImages = {
    1: 'url("https://static.wixstatic.com/media/3b702c_3fcbc70251f64fc88caf50eba7f2f05f~mv2.jpg")',
    2: 'url("https://static.wixstatic.com/media/3b702c_9302224a572145d0ac44ffb9aa17151c~mv2.jpg")',
    3: 'url("https://static.wixstatic.com/media/3b702c_bf492d70307548ee82e959b5e7e70467~mv2.jpg")',
    4: 'url("https://static.wixstatic.com/media/3b702c_ff094898c4d54c18939c86e3ba484cf2~mv2.jpg")',
    5: 'url("https://static.wixstatic.com/media/3b702c_939880108c5842038cf65371f95a8ce6~mv2.jpg")',
    6: 'url("https://static.wixstatic.com/media/3b702c_939880108c5842038cf65371f95a8ce6~mv2.jpg")'
  };

  const cardBack = document.querySelector('.card-back');
  const staticCard = document.querySelector('.static-card');
  const currentImage = phaseImages[currentPhase] || 'none'; // Default to none if no image is set

  // Set the background image only on the back of the card and static card
  cardBack.style.backgroundImage = currentImage;
  staticCard.style.backgroundImage = currentImage;

  console.log(`Card background updated for Phase: ${currentPhase}`);
}

const sheetId = '1QryjPq_jJ_jDxL9FuCOBNfi_SiSTxWcqKrKSgsaqVdw'; // Your Google Sheet ID
const apiKey = 'AIzaSyC5k56w2rvKqGbvkP5RZlVHvf_8SLJV0bw'; // Your Google Sheets API key
const sheetURL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/TruthDareGameTab!A:D?key=${apiKey}`;

// Fetch the questions from the Google Sheet
fetch(sheetURL)
  .then(response => response.json())
  .then(data => {
    questions = data.values.slice(1)
      .filter(row => row[0] && row[1] && row[2] && row[3])
      .map(row => ({
        id: row[0],
        content: row[1],
        type: row[2],
        phase: row[3]
      }));
  })
  .catch(error => console.error('Error fetching the data:', error));

// Event listeners for Truth and Dare buttons
document.getElementById('truthBtn').addEventListener('click', () => handleQuestion('Truth'));
document.getElementById('dareBtn').addEventListener('click', () => handleQuestion('Dare'));

function handleQuestion(type) {
  try {
    const question = getRandomQuestion(type, currentPhase);

    if (!question) return; // Skip further logic if no question is returned

    document.querySelector('.type-label').innerText = question.type;
    document.querySelector('.inner-text-box').innerText = question.content;
    storeAskedQuestion(type, currentPhase, question.id);
    showCard();

    questionsCounter++;

    if (currentPhase === 6) {
      unlockDare(); // Ensure Dare is always unlocked in Phase 6
    } else {
      if (type.toLowerCase() === 'truth') {
        truthCounter++;
        truthsSinceLastDare++;

        if (!dareUnlocked && truthsSinceLastDare >= truthsToUnlockDare) {
          dareUnlockReady = true;
        }
      } else if (type.toLowerCase() === 'dare') {
        dareCounter++;
        truthsSinceLastDare = 0;
      }
    }

    const phaseQuestionLimit = questionsPerPhase[currentPhase] || 1;
    if (questionsCounter >= phaseQuestionLimit) {
      document.getElementById('card').addEventListener('click', () => handlePhaseTransition(), { once: true });
    } else {
      document.getElementById('card').addEventListener('click', hideCard, { once: true });
    }
  } catch (error) {
    document.getElementById('errorDisplay').innerText = error.message;
  }
}

// If no questions are available, skip to the next phase
function getRandomQuestion(type, phase) {
  const filteredQuestions = questions.filter(q => q.type && q.type.toLowerCase() === type.toLowerCase() && q.phase == phase);
  const usedQuestions = askedQuestions[type]?.[phase] || [];
  const availableQuestions = filteredQuestions.filter(q => !usedQuestions.includes(q.id));

  // Check if there are no available questions
  if (availableQuestions.length === 0) {
    // Automatically transition to the next phase if out of questions
    handlePhaseTransition();
    return null; // No question to return, skip to the next phase
  }

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
}

function storeAskedQuestion(type, phase, id) {
  if (!askedQuestions[type]) askedQuestions[type] = {};
  if (!askedQuestions[type][phase]) askedQuestions[type][phase] = [];
  askedQuestions[type][phase].push(id);
  sessionStorage.setItem('askedQuestions', JSON.stringify(askedQuestions));
}

// Show the animated card with a slide and flip effect
function showCard() {
  const card = document.getElementById('card');
  const buttonContainer = document.querySelector('.button-container');

  // ADD: Update the card color based on the current phase
  updateCardColor(); // <-- Add this to update the card color

  // Slide buttons up out of view
  buttonContainer.style.transform = 'translateY(-100%)';

  // Slide card into view and flip simultaneously
  setTimeout(() => {
    card.style.visibility = 'visible';
    card.style.transform = 'translateX(0) rotateY(0deg)'; // Slide and flip together
    isCardVisible = true;
  }, 300);
}

// When the card is clicked, hide it and show the buttons again
function hideCard() {
  const card = document.getElementById('card');
  const buttonContainer = document.querySelector('.button-container');
  const truthButton = document.getElementById('truthBtn');

  // Animate the card out of view
  card.style.transform = 'translateX(-150%) rotateY(0deg)';

  setTimeout(() => {
    // Reset card visibility and buttons
    card.style.visibility = 'hidden';
    card.style.transition = 'transform 0.5s, visibility 0.5s';
    card.style.transform = 'translateX(-150%) rotateY(180deg)';

    // Re-enable buttons for the next interaction
    buttonContainer.style.transform = 'translateY(0)';

    // Lock Truth button for Phase 6
    if (currentPhase === 6) {
      truthButton.disabled = true;
      truthButton.classList.add('button-disabled');
    }
  }, 1000); // Match animation timing
}

// Reset Dare button color to gray when sliding back in
function resetDareButtonColor() {
  const dareButton = document.getElementById('dareBtn');
  if (currentPhase === 6) {
    // Skip resetting Dare for Phase 6
    return;
  }
  dareButton.classList.remove('button-active'); // Remove active styling
  dareButton.classList.add('button-disabled'); // Add disabled styling
  dareButton.disabled = true; // Disable the button
}

// Animated unlock of Dare button
function unlockDareAnimated() {
    const dareButton = document.getElementById('dareBtn');
    dareButton.classList.remove('button-disabled'); // Remove disabled styling
    dareButton.classList.add('button-active'); // Add active styling
    dareButton.disabled = false; // Enable the button
}

function handlePhaseTransition() {
  const card = document.getElementById('card');
  const buttonContainer = document.querySelector('.button-container');
  const staticCard = document.querySelector('.static-card');
  const nextPhaseScreen = document.getElementById('nextPhaseScreen');
  const phasePrompt = document.getElementById('phasePrompt');

  // Validate all elements exist
  if (!card || !buttonContainer || !staticCard || !nextPhaseScreen || !phasePrompt) {
    console.error("Missing critical elements during phase transition.");
    return;
  }

  // Hide the card and buttons
  card.style.transform = 'translateX(-150%) rotateY(0deg)';
  buttonContainer.style.transform = 'translateY(-100%)';
  staticCard.style.transform = 'translateY(250%)'; // Slide static card out

  // Display the next phase prompt
  setTimeout(() => {
    const nextPhase = currentPhase + 1 > 6 ? 1 : currentPhase + 1;
    const promptMessage = phasePrompts[nextPhase] || "Get ready for the next challenge!";
    phasePrompt.innerText = promptMessage;

    nextPhaseScreen.style.display = 'block';

    // Advance to the next phase on click
    nextPhaseScreen.addEventListener(
      'click',
      () => {
        nextPhaseScreen.style.display = 'none';
        resetForNextPhase();
      },
      { once: true }
    );
  }, 1000); // Match animation timing
}

function lockDare() {
  const dareButton = document.getElementById('dareBtn');
  dareButton.classList.add('button-disabled'); // Use the class to apply the gray color
  dareButton.classList.remove('button-active'); // Ensure the active style is removed
  dareButton.disabled = true; // Disable the Dare button
}

function resetForNextPhase() {
  truthCounter = 0;
  dareCounter = 0;
  questionsCounter = 0;

  currentPhase++;
  if (currentPhase > 6) currentPhase = 1; // Loop back to Phase 1

  console.log(`Resetting for Phase ${currentPhase}`);

  const truthButton = document.getElementById('truthBtn');
  const dareButton = document.getElementById('dareBtn');
  const staticCard = document.querySelector('.static-card');
  const buttonContainer = document.querySelector('.button-container');
  const card = document.getElementById('card');

  // Phase 6: Lock Truth button, keep Dare active
  if (currentPhase === 6) {
    truthButton.disabled = true;
    truthButton.classList.add('button-disabled');
  } else {
    // Other phases: Enable both buttons
    truthButton.disabled = false;
    truthButton.classList.remove('button-disabled');
  }

  // Ensure Dare button is always active
  dareButton.disabled = false;
  dareButton.classList.add('button-active');
  dareButton.classList.remove('button-disabled');

  // Reset static card visibility
  staticCard.style.display = 'block';
  staticCard.style.transition = 'transform 0.5s ease';
  staticCard.style.transform = 'translateY(0)';

  // Reset button container visibility
  buttonContainer.style.display = 'flex';
  buttonContainer.style.transform = 'translateY(0)';

  // Reset card position
  card.style.visibility = 'hidden';
  card.style.transform = 'translateX(-150%) rotateY(180deg)';

  // Update card background based on the new phase
  updateCardColor();

  console.log(`UI reset complete for Phase ${currentPhase}`);
}

function unlockDare() {
  console.log(`Unlocking Dare: Phase ${currentPhase}, TruthsSinceLastDare: ${truthsSinceLastDare}`);
  const dareButton = document.getElementById('dareBtn');
  dareButton.classList.add('button-active'); // Apply the active styling with the class
  dareButton.classList.remove('button-disabled'); // Ensure the disabled style is removed
  dareButton.disabled = false; // Enable the button
}

document.getElementById('resetSessionButton').addEventListener('click', () => {
  // Clear session storage and reset tracking variables
  sessionStorage.clear();
  truthCounter = 0;
  dareCounter = 0;
  questionsCounter = 0;
  isCardVisible = false;
  currentPhase = 1; // Reset to phase 1
  askedQuestions = {};

  // Reset UI elements
  const truthButton = document.getElementById('truthBtn');
  const dareButton = document.getElementById('dareBtn');
  const card = document.getElementById('card');
  const buttonContainer = document.querySelector('.button-container');
  const staticCard = document.querySelector('.static-card');

  // Enable Dare button
  dareButton.disabled = false;
  dareButton.classList.add('button-active');
  dareButton.classList.remove('button-disabled');

  // Enable Truth button for Phase 1
  truthButton.disabled = false;
  truthButton.classList.remove('button-disabled');

  // Reset card and buttons visibility
  buttonContainer.style.display = 'none';
  card.style.visibility = 'hidden';
  card.style.transform = 'translateX(-150%)'; // Move off-screen as at start
  staticCard.style.display = 'none';

  // Reset Play Game button visibility
  document.getElementById('playGameButton').style.display = 'block';

  // Reset card color for Phase 1
  updateCardColor();

  console.log("Session has been reset. Dare button unlocked.");
});
