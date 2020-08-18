const duncanHeadersList = document.getElementById("duncanHeadersList");
const currentHeader = document.getElementById("currentHeader");
const currentHeaderText = document.getElementById("currentHeaderText");
const spinner = document.getElementById("spinner");
const scramble = document.getElementById("scramble");

let data = [];
let headerChosen = false;
let headerChoice = "";
let randomScrambleValue = "";
let googleDataLoaded = false;

// Urls for google sheet. Proxy is used to clean up cors issues
const proxyUrl = "https://agile-anchorage-79298.herokuapp.com/";
const apiURL =
  "https://docs.google.com/spreadsheets/d/1OuPMA69AvdJqnrp_twp8qOrm2CsBfX6VoKAjRMux7UU/export?format=csv";
const localCsv = "../Duncan.csv";

//Get google sheet data using papa parse
function init() {
  Papa.parse(proxyUrl + apiURL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      data = results.data;
      setDuncanHeaders(data);
      googleDataLoaded = true;
      spinner.style.display = "none";
    },
  });
}

//Set the list of clickable headers under Duncan tab from sheet
function setDuncanHeaders(sheetData) {
  headersArray = Object.keys(sheetData[0]);

  headersArray.forEach((element) => {
    var node = document.createElement("Li");
    var textnode = document.createTextNode(element);
    node.appendChild(textnode);
    duncanHeadersList.appendChild(node);
  });
}

//Custom scramble event for the data inside selected column. Triggers on the timer
function scrambleHeaderValues(headerChoiceArg) {
  let result = data
    .filter((i) => {
      return i[headerChoice] != "";
    })
    .map((a) => a[headerChoice]);
  const randomElement = result[Math.floor(Math.random() * result.length)];
  if (randomElement === randomScrambleValue) {
    scrambleHeaderValues(headerChoice);
  } else {
    randomScrambleValue = randomElement;
  }
}

// Sets which column of data is used
function chooseHeader(e) {
  headerChosen = true;
  duncanHeadersList.hidden = true;
  headerChoice = e.target.innerText;
  currentHeader.style.display = "flex";
  currentHeaderText.innerText = headerChoice;
  scrambleHeaderValues(headerChoice);
}

// Choose a different header from the list
function resetHeader() {
  currentHeader.style.display = "none";
  headerChosen = false;
  duncanHeadersList.hidden = false;
  headerChoice = "";
  scramble.innerText = "";
}

//Event listeners for loading google data and clicking on headers
window.addEventListener("DOMContentLoaded", init);
duncanHeadersList.addEventListener("click", chooseHeader);
currentHeader.addEventListener("click", resetHeader);
