const duncanHeadersList = document.getElementById("duncanHeadersList");
const currentHeader = document.getElementById('currentHeader');
const currentHeaderText = document.getElementById('currentHeaderText');
const spinner = document.getElementById('spinner');
const scramble = document.getElementById("scramble");

let data = [];
let headerChosen = false;
let headerChoice = "";
let randomScrambleValue = "";
let googleDataLoaded = false;

const proxyUrl = "https://agile-anchorage-79298.herokuapp.com/";
const apiURL =
  "https://docs.google.com/spreadsheets/d/1OuPMA69AvdJqnrp_twp8qOrm2CsBfX6VoKAjRMux7UU/export?format=csv";
const localCsv = "../Duncan.csv";

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

//Set the list of headers in sheet
function setDuncanHeaders(sheetData) {
  headersArray = Object.keys(sheetData[0]);

  headersArray.forEach((element) => {
    var node = document.createElement("Li");
    var textnode = document.createTextNode(element);
    node.appendChild(textnode);
    duncanHeadersList.appendChild(node);
  });
}

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

// Once Header is chosen
function chooseHeader(e) {
  headerChosen = true;
  duncanHeadersList.hidden = true;

  headerChoice = e.target.innerText;
  currentHeader.style.display = "flex";
  currentHeaderText.innerText = headerChoice;
  scrambleHeaderValues(headerChoice);
  updateScramble();
}

// Choose a different header
function resetHeader() {
  currentHeader.style.display = "none";
  headerChosen = false;
  duncanHeadersList.hidden = false;
  headerChoice = "";
  scramble.innerText = "";
}

window.addEventListener("DOMContentLoaded", init);
duncanHeadersList.addEventListener("click", chooseHeader);
currentHeader.addEventListener("click", resetHeader);