const eventsTableParent = document.getElementById("eventsParent");
const duncanHeadersList = document.getElementById("duncanHeadersList");
const currentHeader = document.getElementById("currentHeader");
const currentHeaderText = document.getElementById("currentHeaderText");
const loadingTabs = document.getElementById("loading-tabs");
const spinner = document.getElementById("sheets-spinner");
const scramble = document.getElementById("scramble");

let eventElements = [];
let events = [];

let googleSheetData = {};
let ignoredPageCount = 0;
let currentTab = false;
let headersArray = [];
let headerChosen = false;
let headerChoice = "";
let headerId = "";
let currentScramble;
let randomScrambleValue = "";
let tabsLoaded = false;
let googleDataLoaded = false;
let apiSheetNames = [];
let currentScrambleArray = [];

// Googlesheet key
const sheetKey = "1c7DzzBmpi3cudSHmpTrCo8bXJHkOjrlC6bsr6nQ7sYQ";

//Loads in names of sheets
function init() {
  fetch(
    `https://spreadsheets.google.com/feeds/worksheets/${sheetKey}/public/basic?alt=json`
  )
    .then((response) => response.json())
    .then((data) => {
      entries = data.feed.entry;
      entries.forEach((entry) => {
        if (entry.content.$t.charAt(0) !== "#") {
          apiSheetNames.push(entry.content.$t);
        } else {
          ignoredPageCount++;
        }
      });
      fetchSheetData();
      populateSheetTabs();
      scramble.innerText = "Choose a Tab";
      setEventsAfterApiCall();
    });
}

//Loads the data from each sheet
function fetchSheetData() {
  let numberOfSheetsLoaded = 0;
  apiSheetNames.forEach((name, i) => {
    let sheetNumber = `${i + 1 + ignoredPageCount}`;
    fetch(
      `https://spreadsheets.google.com/feeds/cells/${sheetKey}/${sheetNumber}/public/full?alt=json`
    )
      .then((res) => res.json())
      .then((data) => {
        googleSheetData[i] = data.feed.entry;
        numberOfSheetsLoaded++;
        if (numberOfSheetsLoaded === apiSheetNames.length) {
          googleDataLoaded = true;
          spinner.style.display = "none";
          if (currentTab) {
            tabsClicked(currentTab);
          }
        }
      });
  });
}

//Sets all the tabs based on the titles of each sheet
function populateSheetTabs() {
  loadingTabs.style.display = "none";
  apiSheetNames.forEach((name) => {
    const node = document.createElement("td");
    const textnode = document.createTextNode(name);
    node.id = name;
    node.appendChild(textnode);
    eventsTableParent.appendChild(node);
  });
}

//Loads headers based on which tab is pressed
function setTabHeaders(sheetIndex) {
  duncanHeadersList.textContent = "";
  let googleSheet = googleSheetData[sheetIndex];
  let A1 = googleSheet[0].content.$t;
  headersArray = [`All - ${A1}`];

  googleSheet.forEach((entry, i) => {
    if (
      entry.gs$cell.col === "3" &&
      !headersArray.includes(entry.content.$t) &&
      entry.gs$cell.row !== "1"
    ) {
      headersArray.push(entry.content.$t);
    }
  });

  headersArray.forEach((element) => {
    const node = document.createElement("Li");
    const textnode = document.createTextNode(element);
    node.appendChild(textnode);
    node.id = sheetIndex;
    duncanHeadersList.appendChild(node);
  });
}

//When header id chosen, updates DOM and runs setScramble Values
function chooseHeader(e) {
  headerChosen = true;
  duncanHeadersList.hidden = true;
  headerChoice = e.target.innerText;
  headerId = e.target.id;
  currentHeader.style.display = "flex";
  currentHeaderText.innerText = e.target.innerText;
  setScrambleArrayValues();
}

//Sets array of all values in sheets as well as array filtered by designation 
function setScrambleArrayValues() {
  let allCommArray = [];
  let designationArray = [];

  googleSheetData[Number(headerId)].forEach((item) => {
    if (
      item.gs$cell.col === "1" &&
      item.gs$cell.row !== "1" &&
      item.content.$t !== ""
    ) {
      allCommArray.push(item.content.$t);
    }
  });

  currentScrambleArray = allCommArray;

  if (headerChoice !== headersArray[0]) {
    let relevantRows = [];
    googleSheetData[Number(headerId)].forEach((item, i) => {
      if (item.content.$t === headerChoice) {
        relevantRows.push(item.gs$cell.row);
      }
    });
    googleSheetData[Number(headerId)].forEach((item) => {
      if (
        relevantRows.includes(item.gs$cell.row) &&
        item.gs$cell.col === "1" &&
        item.gs$cell.row !== "1" &&
        item.content.$t !== ""
      ) {
        designationArray.push(item.content.$t);
      }
    });
    currentScrambleArray = designationArray;
  }
}


//Custom scramble event for the data selected. Triggers on duncanScramble function
function scrambleHeaderValues() {
  const randomElement =
    currentScrambleArray[
      Math.floor(Math.random() * currentScrambleArray.length)
    ];
  if (randomElement === randomScrambleValue) {
    scrambleHeaderValues();
  } else {
    randomScrambleValue = randomElement;
  }
}

// Choose a different header from the list
function resetHeader() {
  currentHeader.style.display = "none";
  headerChosen = false;
  duncanHeadersList.hidden = false;
  headerChoice = "";
  headerId = "";
  scramble.innerText = "";
}


//Code copied from old scramble.js file
function duncanScramble() {
  if (headerChosen) {
    scrambleHeaderValues();
  }
  if (currentScrambleArray.length === 0 && headerChosen) {
    return "sorry no data";
  } else {
    return randomScrambleValue;
  }
}


//triggers on the counter
function updateScramble() {
  // Set currentScramble, put scramble on webpage
  if(headerChosen) {
    currentScramble = currentEvent.scramble();
    scramble.innerHTML = currentScramble;
  }
}

//Event listeners for loading google data and clicking on headers
window.addEventListener("DOMContentLoaded", init);
duncanHeadersList.addEventListener("click", chooseHeader);
currentHeader.addEventListener("click", resetHeader);
