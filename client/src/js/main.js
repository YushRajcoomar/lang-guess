// Initialize the map with world wrapping enabled
const map = L.map('map', {
  center: [20, 0],
  zoom: 3,  // Changed from 2 to 3
  minZoom: 2,
  maxZoom: 5,
  maxBounds: [[-90, -210], [90, 210]], // Wider bounds that allow wrapping
  maxBoundsViscosity: 0.5, // Softer bounds - allows some dragging
  worldCopyJump: true, // Allow the world to be copied for wrapping
  zoomControl: true,
  attributionControl: true
});

// Update the tile layer to allow wrapping
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19,
  noWrap: false
}).addTo(map);

// Game state
const game = {
  currentRound: 1,
  totalRounds: 5,
  score: 0,
  currentLanguage: null,
  audioElement: null,
  progressInterval: null,
  countries: [],
  previousLanguages: [], // Track previously played languages to avoid repeats
  selectedCountry: null // Add this to track the selected country
};

// Replace the hardcoded availableLanguages with an empty array
let availableLanguages = [];

// Add country borders using GeoJSON
fetch('src/assets/geojson/ne_10m_admin_0_countries.json')
  .then(response => response.json())
  .then(data => {
    // Create the country layers
    const geoJsonLayer = L.geoJSON(data, {
      style: {
        color: '#333333',
        weight: 1.5,
        fillOpacity: 0,
        opacity: 0.8
      },
      onEachFeature: (feature, layer) => {
        // Natural Earth uses different property names
        const countryName = feature.properties.NAME || feature.properties.ADMIN;
        const countryCode = feature.properties.ADM0_A3;
        
        // Store country data for later reference
        game.countries.push({
          code: countryCode,
          name: countryName,
          layer: layer
        });
        
        // Change to selectCountry instead of handleCountryGuess
        layer.on('click', (e) => {
          selectCountry(countryCode, countryName, layer);
        });
      }
    }).addTo(map);
    
    // Highlight countries with audio samples
    highlightAvailableCountries();
    
    // Initialize the UI only, but don't start a round yet
    updateUI();
  })
  .catch(error => console.error('Error loading GeoJSON data:', error));

// Highlight countries that have language samples
function highlightAvailableCountries() {
  // Collect all available country codes from languages
  const availableCountryCodes = availableLanguages
    .filter(lang => lang.country !== null) // Filter out languages with no country
    .map(lang => lang.country);
  
  // Iterate through countries and highlight those with available languages
  game.countries.forEach(country => {
    if (availableCountryCodes.includes(country.code)) {
      // Subtle highlight for available countries
      country.layer.setStyle({
        fillColor: '#3388ff',
        fillOpacity: 0.1
      });
    }
  });
}

// Handle country guess
function handleCountryGuess(countryCode, countryName, layer) {
  if (!game.currentLanguage) return;
  
  console.log(`User guessed: ${countryName} (${countryCode})`);
  
  // Highlight the selected country
  layer.setStyle({
    fillColor: '#ff7800',
    fillOpacity: 0.5
  });
  
  // Check if guess is correct
  const isCorrect = (countryCode === game.currentLanguage.countryCode);
  
  // Update score
  if (isCorrect) {
    game.score += 100;
  }
  
  // Show the result
  showResult(isCorrect, countryName);
  
  // Update the UI
  updateUI();
  
  // Disable further guessing until next round
  game.currentLanguage = null;
}

function getRandomLanguage() {
  const validLanguages = availableLanguages.filter(lang => 
    lang.id !== undefined && 
    lang.country && 
    lang.audio_dir
  );
  
  if (validLanguages.length === 0) {
    console.error("No valid languages found");
    return null;
  }
  
  const unusedLanguages = validLanguages.filter(lang => 
    !game.previousLanguages.includes(lang.id)
  );
  
  if (unusedLanguages.length === 0) {
    game.previousLanguages = [];
    return getRandomLanguage();
  }
  
  const randomIndex = Math.floor(Math.random() * unusedLanguages.length);
  const selectedLanguage = unusedLanguages[randomIndex];
  
  game.previousLanguages.push(selectedLanguage.id);
  
  return selectedLanguage;
}

// Update the playLanguageAudio function to work with the new UI
function playLanguageAudio(language, autoPlay = false) {
  if (!language) {
    console.error("Cannot play audio: No language provided");
    return;
  }
  
  if (game.audioElement) {
    stopAudio();
  }
  
  const playBtn = safeGetElement('play-btn');
  if (playBtn) {
    // Update to show loading state
    playBtn.disabled = true;
    playBtn.classList.add('loading');
    playBtn.innerHTML = '<span class="loading-icon">⏳</span>';
  }
  
  let audioNumber = Math.floor(Math.random() * 5) + 1;
  let audioPath = `${language.audio_dir}/${audioNumber}.wav`;
  
  fetch(audioPath)
    .then(response => {
      if (!response.ok) {
        throw new Error("WAV audio file not found");
      }
      return audioPath;
    })
    .then(finalPath => {
      game.audioElement = new Audio(finalPath);
      
      game.audioElement.addEventListener('timeupdate', updateProgressBar);
      game.audioElement.addEventListener('ended', () => {
        if (playBtn) {
          playBtn.classList.remove('playing');
          playBtn.innerHTML = '<span class="play-icon">▶</span><span class="pause-icon">❚❚</span>';
        }
      });
      
      if (playBtn) {
        playBtn.disabled = false;
        playBtn.classList.remove('loading');
        playBtn.innerHTML = '<span class="play-icon">▶</span><span class="pause-icon">❚❚</span>';
      }
      
      if (autoPlay && game.audioElement) {
        game.audioElement.play()
          .then(() => {
            if (playBtn) {
              playBtn.classList.add('playing');
            }
          })
          .catch(error => {
            console.error("Auto-play failed:", error);
          });
      }
    })
    .catch(error => {
      console.error("WAV audio failed to load:", error);
      if (playBtn) {
        playBtn.disabled = true;
        playBtn.innerHTML = '<span class="error-icon">❌</span>';
      }
    });
}

// Update progress bar
function updateProgressBar() {
  if (!game.audioElement) return;
  
  const progress = (game.audioElement.currentTime / game.audioElement.duration) * 100;
  document.getElementById('progress-bar').style.width = `${progress}%`;
}

// Update the stop audio function
function stopAudio() {
  if (game.audioElement) {
    game.audioElement.pause();
    game.audioElement.currentTime = 0;
    document.getElementById('progress-bar').style.width = '0%';
    
    const playBtn = safeGetElement('play-btn');
    if (playBtn) {
      playBtn.classList.remove('playing');
    }
  }
}

// Add a utility function to safely access DOM elements
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id '${id}' not found in the DOM`);
    return null;
  }
  return element;
}

// Update the startNewRound function for the new UI
function startNewRound() {
  // Reset the selected country
  game.selectedCountry = null;
  
  const selectedCountryElement = safeGetElement('selected-country');
  if (selectedCountryElement) {
    selectedCountryElement.textContent = 'Click a country';
  }
  
  const confirmBtn = safeGetElement('confirm-btn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
  }
  
  // Get a random language
  game.currentLanguage = getRandomLanguage();
  
  if (!game.currentLanguage) {
    console.error("Failed to get a language for this round");
    alert("Error: Could not load language data. Please refresh the page.");
    return;
  }
  
  console.log(`New round: ${game.currentLanguage.name}`);
  
  // Reset countries
  game.countries.forEach(country => {
    // Reset to default style
    country.layer.setStyle({
      fillOpacity: 0
    });
  });
  
  // Highlight available countries again
  highlightAvailableCountries();
  
  // Play the audio
  playLanguageAudio(game.currentLanguage);
  
  // Clear any previous feedback
  clearMapMessages();
  
  // Reset the checkbox
  const confirmCheckbox = safeGetElement('confirm-checkbox');
  const confirmContainer = safeGetElement('confirm-btn-container');
  
  if (confirmCheckbox && confirmContainer) {
    confirmCheckbox.checked = false;
    confirmCheckbox.disabled = true;
    confirmContainer.classList.add('disabled');
    confirmContainer.classList.remove('enabled');
  }
}

// Helper function to get country name by code
function getCountryNameByCode(code) {
  const country = game.countries.find(c => c.code === code);
  return country ? country.name : "Unknown";
}

// Update the UI
function updateUI() {
  // Update existing UI elements
  
  // Update navbar elements
  const scoreDisplay = document.getElementById('score-display');
  const roundDisplay = document.getElementById('round-display');
  
  if (scoreDisplay) {
    scoreDisplay.textContent = game.score;
  }
  
  if (roundDisplay) {
    roundDisplay.textContent = `${game.currentRound}/${game.totalRounds}`;
  }
}

// Update selectCountry function to work with the checkbox
function selectCountry(countryCode, countryName, layer) {
  // Reset styling on previously selected country (if any)
  if (game.selectedCountry) {
    game.selectedCountry.layer.setStyle({
      fillOpacity: 0
    });
  }
  
  // Highlight the selected country
  layer.setStyle({
    fillColor: '#3498db', // Blue for selection
    fillOpacity: 0.5
  });
  
  // Store the selected country
  game.selectedCountry = {
    code: countryCode,
    name: countryName,
    layer: layer
  };
  
  // Update UI to show selected country - now in the floating player
  const selectedCountryElement = safeGetElement('selected-country');
  if (selectedCountryElement) {
    selectedCountryElement.textContent = countryName;
  }
  
  // Enable the confirm checkbox
  const confirmCheckbox = safeGetElement('confirm-checkbox');
  const confirmContainer = safeGetElement('confirm-btn-container');
  
  if (confirmCheckbox && confirmContainer) {
    confirmCheckbox.disabled = false;
    confirmContainer.classList.remove('disabled');
    confirmContainer.classList.add('enabled');
  }
  
  // Enable the confirm button
  const confirmBtn = safeGetElement('confirm-btn');
  if (confirmBtn) {
    confirmBtn.disabled = false;
  }
}

// Add a function to handle the confirmed guess
function confirmGuess() {
  if (!game.selectedCountry || !game.currentLanguage) {
    console.log("Cannot confirm: No country selected or no language active");
    return;
  }
  
  const { code: countryCode, name: countryName, layer } = game.selectedCountry;
  
  console.log(`User confirmed guess: ${countryName} (${countryCode}) for language ${game.currentLanguage.name}`);
  console.log(`Comparing: User selected "${countryCode}" vs Language's "${game.currentLanguage.country}"`);
  
  const isCorrect = (countryCode === game.currentLanguage.country);
  
  console.log(`Guess is ${isCorrect ? 'CORRECT' : 'WRONG'}`);
  
  // Change color to indicate guess was submitted
  layer.setStyle({
    fillColor: '#ff7800', // Orange for submitted guess
    fillOpacity: 0.7
  });
  
  // Update score
  if (isCorrect) {
    game.score += 100;
  }
  
  // Display the result clearly
  showClearResult(isCorrect, countryName);
  
  // Update the UI
  updateUI();
  
  // Disable confirm checkbox to prevent multiple submissions
  const confirmCheckbox = safeGetElement('confirm-checkbox');
  const confirmContainer = safeGetElement('confirm-btn-container');
  
  if (confirmCheckbox && confirmContainer) {
    confirmCheckbox.disabled = true;
    confirmContainer.classList.remove('enabled');
    confirmContainer.classList.add('disabled');
    
    // Keep checkbox checked for visual confirmation
    confirmCheckbox.checked = true;
  }
  
  // Wait 2.5 seconds then advance to next round automatically
  setTimeout(() => {
    advanceToNextRound();
  }, 2500);
}

// Update the showClearResult function
function showClearResult(isCorrect, guessedCountry) {
  // Remove existing announcement if there is one
  const announcement = document.getElementById('announcement');
  if (announcement) {
    announcement.textContent = '';
    announcement.className = '';
  }
  
  // Clear any existing map messages
  clearMapMessages();
  
  // Get the selected country layer
  const { layer } = game.selectedCountry;
  
  if (isCorrect) {
    // Show "Correct!" on the selected country
    showMapMessage(layer, "Correct!", "correct-map-message");
    
    // Style the country green for correct
    layer.setStyle({
      fillColor: '#27ae60',
      fillOpacity: 0.7
    });
    
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#27ae60', '#2ecc71', '#1abc9c', '#3498db']
    });
    
    // Add a second burst for more excitement
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.2, y: 0.6 }
      });
      
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.8, y: 0.6 }
      });
    }, 250);
  } else {
    // For incorrect answers
    showMapMessage(layer, "Incorrect!", "incorrect-map-message");
    
    // Style the selected country red for wrong
    layer.setStyle({
      fillColor: '#e74c3c',
      fillOpacity: 0.7
    });
    
    // Shake the map for wrong answer feedback
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.classList.add('shake');
      setTimeout(() => {
        mapContainer.classList.remove('shake');
      }, 500);
    }
    
    // Show the correct country
    const correctCountry = game.countries.find(c => c.code === game.currentLanguage.country);
    
    if (correctCountry) {
      // Style the correct country
      correctCountry.layer.setStyle({
        fillColor: '#27ae60', // Green for the correct answer
        fillOpacity: 0.7
      });
      
      // Show bottom message with the correct answer
      showBottomMapMessage(
        `Correct answer: ${correctCountry.name} (${game.currentLanguage.name})`,
        "correct-answer-message"
      );
    } else {
      // Log error for debugging if country not found
      console.error(`Could not find country with code: ${game.currentLanguage.country}`);
      showBottomMapMessage(
        `Correct answer: Country code ${game.currentLanguage.country} (${game.currentLanguage.name})`,
        "correct-answer-message"
      );
    }
  }
}

// Update the showMapMessage function to add the explosion class
function showMapMessage(layer, message, className) {
  // Get the center of the layer
  const center = layer.getBounds().getCenter();
  
  // Create a new div element for the message
  const messageDiv = document.createElement('div');
  messageDiv.className = `map-message ${className}`;
  messageDiv.textContent = message;
  
  // Create a new marker with the custom div
  const marker = L.marker(center, {
    icon: L.divIcon({
      className: 'message-marker',
      html: messageDiv,
      iconSize: [120, 40],
      iconAnchor: [60, 20]
    })
  }).addTo(map);
  
  // Add explosion effect for incorrect answers
  if (className === 'incorrect-map-message') {
    setTimeout(() => {
      messageDiv.classList.add('exploding');
    }, 50); // Small delay to ensure the DOM has updated
  }
  
  // Store the marker so we can remove it later
  if (!game.mapMessages) {
    game.mapMessages = [];
  }
  game.mapMessages.push(marker);
}

// Helper function to show a message at the bottom of the map
function showBottomMapMessage(message, className) {
  // Create a div for the bottom message if it doesn't exist
  let bottomMessage = document.getElementById('bottom-map-message');
  if (!bottomMessage) {
    bottomMessage = document.createElement('div');
    bottomMessage.id = 'bottom-map-message';
    bottomMessage.className = "absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-5 py-2.5 rounded-full text-center font-medium z-[1000] shadow-md max-w-[80%]";
    document.getElementById('map-container').appendChild(bottomMessage);
  }
  
  // Set the text
  bottomMessage.textContent = message;
  
  // Add additional classes if needed
  if (className === "correct-answer-message") {
    bottomMessage.classList.add("bg-blue-500/90", "border-l-4", "border-blue-600");
  }
  
  // Make sure it's visible
  bottomMessage.style.display = 'block';
}

// Clean up existing messages
function clearMapMessages() {
  // Remove map markers
  if (game.mapMessages && game.mapMessages.length) {
    game.mapMessages.forEach(marker => map.removeLayer(marker));
    game.mapMessages = [];
  }
  
  // Hide bottom message
  const bottomMessage = document.getElementById('bottom-map-message');
  if (bottomMessage) {
    bottomMessage.style.display = 'none';
  }
}

// Separate function for advancing to next round
function advanceToNextRound() {
  if (game.currentRound < game.totalRounds) {
    game.currentRound++;
    startNewRound();
  } else {
    // Show end game screen
    alert(`Game Over! Your final score is ${game.score}`);
    // Reset the game
    game.currentRound = 1;
    game.score = 0;
    startNewRound();
  }
  updateUI();
}

// Improve performance by limiting languages loaded
window.addEventListener('load', function() {
  console.log('Loading language configuration...');
  
  // Load language configuration first
  fetch('src/assets/data/languages_config.json')
    .then(response => response.json())
    .then(data => {
      const allLanguages = data.languages;
      
      // Filter for valid languages without verbose debugging
      availableLanguages = allLanguages.filter(lang => 
        lang.id !== undefined && 
        lang.country !== undefined && lang.country !== null && 
        lang.audio_dir !== undefined && lang.audio_dir !== null
      );
      
      console.log(`Loaded ${availableLanguages.length} languages`);
      
      // Set up event listeners
      const confirmBtn = safeGetElement('confirm-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmGuess);
      }
      
      const playBtn = safeGetElement('play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          if (!game.audioElement) {
            if (game.currentLanguage) {
              playLanguageAudio(game.currentLanguage);
            }
            return;
          }
          
          if (game.audioElement.paused) {
            game.audioElement.play()
              .then(() => {
                playBtn.classList.add('playing');
              })
              .catch(error => {
                console.error("Play failed:", error);
              });
          } else {
            game.audioElement.pause();
            playBtn.classList.remove('playing');
          }
        });
      }
      
      const replayBtn = safeGetElement('replay-btn');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          if (game.currentLanguage) {
            playLanguageAudio(game.currentLanguage, true);
          }
        });
      }
      
      // Replace the confirm button click handler with the checkbox change handler
      const confirmCheckbox = safeGetElement('confirm-checkbox');
      const confirmContainer = safeGetElement('confirm-btn-container');
      
      if (confirmCheckbox && confirmContainer) {
        confirmCheckbox.addEventListener('change', function() {
          if (this.checked) {
            confirmGuess();
          }
        });
        
        // Also allow clicking the container for better UX
        confirmContainer.addEventListener('click', function(e) {
          if (e.target !== confirmCheckbox && !confirmCheckbox.disabled) {
            confirmCheckbox.checked = true;
            confirmGuess();
          }
        });
      }
      
      // Initialize game
      highlightAvailableCountries();
      updateUI();
      startNewRound();
      
      // Add debugging after everything is loaded
      setTimeout(debugCountryCodeMatching, 1500);
    })
    .catch(error => {
      console.error('Error loading language configuration:', error);
      alert('Failed to load language data. Please refresh the page.');
    });
});

// Handle window resize
window.addEventListener('resize', () => {
  map.invalidateSize();
});

// Add this function to debug country code matching after everything is loaded
function debugCountryCodeMatching() {
  console.log("=============== DEBUGGING COUNTRY CODES ===============");
  console.log(`Available countries in map: ${game.countries.length}`);
  
  // Print a sample of available countries
  console.log("Sample map countries:");
  game.countries.slice(0, 5).forEach(c => {
    console.log(`- ${c.name}: ${c.code}`);
  });
  
  // Check which languages have matching countries
  console.log("\nChecking if language countries match map countries:");
  const mapCountryCodes = new Set(game.countries.map(c => c.code));
  
  let matchCount = 0;
  let noMatchCount = 0;
  
  availableLanguages.forEach(lang => {
    const hasMatch = mapCountryCodes.has(lang.country);
    if (hasMatch) {
      matchCount++;
    } else {
      noMatchCount++;
      console.log(`WARNING: No match for ${lang.name} (${lang.country})`);
    }
  });
  
  console.log(`Summary: ${matchCount} languages have matching countries, ${noMatchCount} do not match`);
  console.log("=====================================================");
}

// For the play button toggling
function togglePlayButton(isPlaying) {
  const playBtn = safeGetElement('play-btn');
  if (playBtn) {
    if (isPlaying) {
      playBtn.classList.add('playing');
    } else {
      playBtn.classList.remove('playing');
    }
  }
}

// Add to your main.js or as a separate script
document.addEventListener('DOMContentLoaded', function() {
  const menuButton = document.querySelector('[aria-controls="mobile-menu"]');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      mobileMenu.classList.toggle('hidden');
      
      // Toggle between menu and X icon
      const menuIcon = this.querySelector('svg:first-child');
      const closeIcon = this.querySelector('svg:last-child');
      menuIcon.classList.toggle('hidden');
      closeIcon.classList.toggle('hidden');
    });
  }
});

// Add to your main.js file in a suitable location
// For mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  // Remove old header if it exists
  const oldHeader = document.querySelector('.game-header');
  if (oldHeader) {
    oldHeader.remove();
  }

  // Setup mobile menu toggle
  const menuButton = document.querySelector('[aria-controls="mobile-menu"]');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      mobileMenu.classList.toggle('hidden');
      
      // Toggle between menu and X icon
      const menuIcon = this.querySelector('svg:first-child');
      const closeIcon = this.querySelector('svg:last-child');
      menuIcon.classList.toggle('hidden');
      closeIcon.classList.toggle('hidden');
    });
  }
});

// Update this function to include navbar score updates
function updateUI() {
  // Your existing updateUI code...
  
  // Update navbar score display
  const scoreDisplay = document.getElementById('score-display');
  const roundDisplay = document.getElementById('round-display');
  
  if (scoreDisplay) {
    scoreDisplay.textContent = game.score;
  }
  
  if (roundDisplay) {
    roundDisplay.textContent = `${game.currentRound}/${game.totalRounds}`;
  }
}