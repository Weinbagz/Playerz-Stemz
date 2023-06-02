let players = {};
let effects = {};
let categories = ["Bass", "Drums", "Lead", "Chords", "Percussion", "EFX"];
let effectsList = ["none", "delay", "reverb", "distortion", "tremolo"];
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
let limiter = new Tone.Limiter(-1).toDestination();
let allLoaded = false;

let loadCount = 0;
let totalFiles = 0;
let loadingIndicator;

for(let category in categoryFileCounts) {
  totalFiles += categoryFileCounts[category];
}

function preload() {
  loadingIndicator = createElement('p', 'Loading...');
  categories.forEach((category) => {
    players[category] = [];
    effects[category] = {};
    effectsList.forEach((effect) => {
      switch (effect) {
        case "delay":
          effects[category][effect] = new Tone.FeedbackDelay();
          break;
        case "reverb":
          effects[category][effect] = new Tone.Reverb();
          break;
        case "distortion":
          effects[category][effect] = new Tone.Distortion();
          break;
        case "tremolo":
  effects[category][effect] = new Tone.Tremolo({
    frequency: 200,  // Frequency of the effect in Hz
    depth: 1,     // Depth of the effect from 0 to 1
    spread: 180     // Spread of the effect in degrees
  }).start();
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
          if(loadCount === totalFiles) {
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

  categories.forEach((category, i) => {
    let categoryContainer = createElement("div");
    categoryContainer.addClass("category");

    if (i < categories.length / 2) {
      categoryContainer.parent(row1);
    } else {
      categoryContainer.parent(row2);
    }

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
      }

      if (effectName !== "none") {
        currentPlayers[category].connect(effect);
        effect.wet.value = wetDrySliders[category].value();
        effect.toDestination();
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

  
  let playButton = createButton("Play");
  playButton.mousePressed(() => {
    if (Tone.context.state !== "running") {
      Tone.start();
    }
    Tone.Transport.start();
  });

  let stopButton = createButton("Stop");
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
