
let players = {};
let effects = {};
let categories = ["Bass", "Drums", "Lead", "Chords", "Percussion", "EFX"];
let effectsList = ["none", "delay", "reverb", "distortion", "vibrato"];
let categoryFileCounts = {
  Bass: 5,
  Drums: 4,
  Lead: 5,
  Chords: 5,
  Percussion: 6,
  EFX: 6,
};
let categoryDisplayNames = {
  Bass: [
    "Sustainer",
    "Subpumper",
    "Pitch Glider",
    "Bridge A. Plucker",
    "Bass Pusher",
  ],
  Drums: ["Pipe Smasher", "Pad Crusher", "LaidBak", "Electrifryer"],
  Lead: [
    "Shreddy McShredderson",
    "Sax On The Digital Beach",
    "Digital Swooner",
    "Abduxion",
    "8Bit4U",
  ],
  Chords: [
    "Wolfman's Brother",
    "Vintage Maker",
    "Piano Man",
    "Pedal Steely",
    "Mr. Smooth",
  ],
  Percussion: [
    "Wttr Bttl",
    "Snake Shaker",
    "Mr Tambourine Man",
    "More Cowbell",
    "Gongist",
    "Big Triangle",
  ],
  EFX: [
    "Muffins",
    "Mr. Modulator",
    "Keytar Climber",
    "Airhorner",
    "Bobo The Clown",
    "Bob Borker",
  ],
};

let volumeSliders = {};
let selects = {};
let effectsSelects = {};
let wetDrySliders = {};
let currentPlayers = {};
let currentEffects = {};
let limiter = new Tone.Limiter(-.5).toDestination();

let allLoaded = false;

let loadCount = 0;
let totalFiles = 0;
let loadingIndicator;

for (let category in categoryFileCounts) {
  totalFiles += categoryFileCounts[category];
}

function preload() {
  loadingIndicator = createElement("p", "Loading...");
  categories.forEach((category) => {
    players[category] = [];
    effects[category] = {};
    effectsList.forEach((effect) => {
      switch (effect) {
        case "delay":
          effects[category][effect] = new Tone.PingPongDelay(0.13);
          break;
        case "reverb":
          effects[category][effect] = new Tone.Reverb(6);
          break;
        case "distortion":
          effects[category][effect] = new Tone.Distortion();
          break;
        case "tremolo":
        case "vibrato":
          effects[category][effect] = new Tone.Vibrato({
            frequency: 5.0, // Frequency of the effect in Hz
            depth: 0.3, // Depth of the effect from 0 to 1
          });
          break;
        default:
          break;
      }
    });
    for (let i = 0; i < categoryFileCounts[category]; i++) {
      let player = new Tone.Player({
        url:
          "https://storage.googleapis.com/playerz_cardz/audio/" +
          category +
          i +
          ".mp3",
        onload: () => {
          console.log(category + i + ".mp3 has loaded.");
          player.sync().start(0);
          if (i === 0) {
            currentPlayers[category] = player;
            player.mute = false;
          } else {
            player.mute = true;
          }
          loadCount++;
          if (loadCount === totalFiles) {
            loadingIndicator.remove();
            allLoaded = true;
            setupInterface();
          }
        },
        loop: true, // Add this line
        onerror: (e) => {
          console.log("Error loading " + category + i + ".mp3");
          console.error(e);
        },
      }).connect(limiter);
      players[category].push(player);
    }
  });
}

function setupInterface() {
  let row1 = createElement("div");
  row1.addClass("row");
  let row2 = createElement("div");
  row2.addClass("row");
  let row3 = createElement("div");
  row3.addClass("row");

  const rows = [row1, row2, row3];

  categories.forEach((category, i) => {
    let categoryContainer = createElement("div");
    categoryContainer.addClass("category");

    const rowIndex = Math.floor(i / 2);
    categoryContainer.parent(rows[rowIndex]);

    let categoryLabel = createElement("div", category);
    categoryLabel.addClass("label");
    categoryLabel.parent(categoryContainer);

    let selectContainer = createElement("div");
    selectContainer.addClass("select");
    selectContainer.parent(categoryContainer);

    let select = createSelect();
    select.parent(selectContainer);
    select.style("background", "#FFFFFF");
    select.style("color", "#02001C");
    select.style("padding", "5px");
    select.style("border-radius", "4px");

    for (let j = 0; j < categoryFileCounts[category]; j++) {
      select.option(categoryDisplayNames[category][j]);
    }

    selects[category] = select;
    select.changed(() => {
      let displayName = selects[category].value();
      let index = categoryDisplayNames[category].indexOf(displayName);
      let player = players[category][index];

      if (currentPlayers[category]) {
        currentPlayers[category].mute = true;
      }

      player.mute = false;
      player.volume.value = volumeSliders[category].value();
      currentPlayers[category] = player;
    });

    let volumeContainer = createElement("div");
    volumeContainer.addClass("volume");
    volumeContainer.parent(categoryContainer);
    
    let volumeLabel = createElement("p", "Volume");
volumeLabel.parent(volumeContainer);
volumeLabel.style("color", "#f708f7");
volumeLabel.style("font-size", "16px");

    let volumeSlider = createSlider(-60, 0, 0);
    volumeSlider.parent(volumeContainer);
    volumeSlider.style("width", "100%");
    volumeSlider.style("background-color", "#000");
    volumeSlider.style("color", "#fff");
    volumeSliders[category] = volumeSlider;
    volumeSlider.input(() => {
      let volumeValue = volumeSliders[category].value();
      if (currentPlayers[category]) {
        currentPlayers[category].volume.value = volumeValue;
      }
    });

    let effectsContainer = createElement("div");
    effectsContainer.addClass("effects");
    effectsContainer.parent(categoryContainer);

    let effectsLabel = createElement("p", "Effects");
effectsLabel.parent(effectsContainer);
effectsLabel.style("color", "#f708f7");
effectsLabel.style("font-size", "16px");
    
    let effectsSelect = createSelect();
    effectsSelect.parent(effectsContainer);
    effectsSelect.style("background", "#FFFFFF");
    effectsSelect.style("color", "#02001C");
    effectsSelect.style("padding", "5px");
    effectsSelect.style("border-radius", "4px");

    effectsList.forEach((effect) => {
      effectsSelect.option(effect);
    });

    effectsSelects[category] = effectsSelect;
    effectsSelect.changed(() => {
      let effectName = effectsSelects[category].value();
      let effect = effects[category][effectName];

      if (currentEffects[category]) {
        currentPlayers[category].disconnect(currentEffects[category]);
        currentEffects[category].disconnect(limiter); // disconnect old effect from limiter
      }

      if (effectName !== "none") {
        currentPlayers[category].connect(effect);
        effect.wet.value = wetDrySliders[category].value();
        effect.connect(limiter); // connect new effect to limiter
        currentEffects[category] = effect;
      }
    });

    let wetDryContainer = createElement("div");
    wetDryContainer.addClass("wetDry");
    wetDryContainer.parent(categoryContainer);

    let wetDrySlider = createSlider(0, 1, 0, 0.01); // changed third argument from 0.5 to 0
    wetDrySlider.parent(wetDryContainer);
    wetDrySlider.style("width", "100%");
    wetDrySlider.style("background-color", "#000");
    wetDrySlider.style("color", "#fff");
    wetDrySliders[category] = wetDrySlider;
    wetDrySlider.input(() => {
      let wetDryValue = wetDrySliders[category].value();
      if (currentEffects[category]) {
        currentEffects[category].wet.value = wetDryValue;
      }
    });
  });
  
  let playlabel = createElement("p", "Press Play Twice On Mobile");

playlabel.style("color", "#f708f7");
playlabel.style("font-size", "16px");

  let playButton = createButton("Play");
playButton.style("background-color", "#02e1e8"); // Green background
playButton.style("border", "none"); // No border
playButton.style("color", "02001C"); // White text
playButton.style("padding", "15px 32px"); // Padding
playButton.style("text-align", "center"); // Centered text
playButton.style("text-decoration", "none"); // No underline
playButton.style("display", "inline-block"); // Display as inline-block
playButton.style("font-size", "16px"); // 16px font size
playButton.style("margin", "4px 2px"); // Margins
playButton.style("cursor", "pointer");
playButton.style("border-radius", "5px"); // Rounded corners
playButton.mousePressed(async () => {
  if (Tone.context.state !== "running") {
    await Tone.start();
    unmute(Tone.context); // Call unmute function here
  }

  // Unmute the current player for each category when the "Play" button is pressed
  for (let category in currentPlayers) {
    currentPlayers[category].mute = false;
  }

  Tone.Transport.start();
});

  let stopButton = createButton("Stop");
  stopButton.style("background-color", "#f708f7"); // Red background
  stopButton.style("border", "none"); // No border
  stopButton.style("color", "white"); // White text
  stopButton.style("padding", "15px 32px"); // Padding
  stopButton.style("text-align", "center"); // Centered text
  stopButton.style("text-decoration", "none"); // No underline
  stopButton.style("display", "inline-block"); // Display as inline-block
  stopButton.style("font-size", "16px"); // 16px font size
  stopButton.style("margin", "4px 2px"); // Margins
  stopButton.style("border-radius", "5px"); // Rounded corners
  stopButton.style("cursor", "pointer"); // Pointer cursor on hover
  stopButton.mousePressed(() => {
    Tone.Transport.stop();
  });
}

function setup() {
  noCanvas();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
