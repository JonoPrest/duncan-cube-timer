const eventsTableParent = document.getElementById("eventsParent");
const bottomContent = document.getElementById("bottomContentContainer");
const email = document.getElementById("email-form");
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
  startButton.hidden = false;
  duncanHeadersList.hidden = true;
  headerChoice = e.target.innerText;
  headerId = Number(e.target.id);
  currentHeader.style.display = "flex";
  currentHeaderText.innerText = e.target.innerText;
  setScrambleArrayValues();
}

//Sets array of all values in sheets as well as array filtered by designation
function setScrambleArrayValues() {
  let allCommArray = [];

  googleSheetData[headerId].forEach((item) => {
    if (
      item.gs$cell.col === "1" &&
      item.gs$cell.row !== "1" &&
      item.content.$t !== ""
    ) {
      const rowNumber = item.gs$cell.row;
      const cellValue = item.content.$t;
      const commAnswer = getCommAnswer(rowNumber);
      const commObject = {
        row: rowNumber,
        value: cellValue,
        answer: commAnswer,
      };
      allCommArray.push(commObject);
    }
  });

  currentScrambleArray = allCommArray;

  if (headerChoice !== headersArray[0]) {
    setDesignationArrayValues();
  }
}

function setDesignationArrayValues() {
  let designationArray = [];
  let relevantRows = [];
  googleSheetData[headerId].forEach((item, i) => {
    if (item.content.$t === headerChoice) {
      relevantRows.push(item.gs$cell.row);
    }
  });
  googleSheetData[headerId].forEach((item) => {
    if (
      relevantRows.includes(item.gs$cell.row) &&
      item.gs$cell.col === "1" &&
      item.gs$cell.row !== "1" &&
      item.content.$t !== ""
    ) {
      const rowNumber = item.gs$cell.row;
      const cellValue = item.content.$t;
      const commAnswer = getCommAnswer(rowNumber);
      const commObject = {
        row: rowNumber,
        value: cellValue,
        answer: commAnswer,
      };
      designationArray.push(commObject);
    }
  });
  currentScrambleArray = designationArray;
}

function getCommAnswer(rowNumber) {
  let commAnswer = "";
  googleSheetData[headerId].forEach((item) => {
    if (item.gs$cell.col === "4" && item.gs$cell.row === rowNumber) {
      commAnswer = item.content.$t;
    }
  });

  return commAnswer;
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
  startButton.hidden = true;
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
  return randomScrambleValue.value;
}

//triggers on the counter
function updateScramble() {
  // Set currentScramble, put scramble on webpage
  if (headerChosen) {
    currentScramble = currentEvent.scramble();
    scramble.innerHTML = currentScramble;
  }
}

/*function downloadCSV(csv, filename) {
  let csvFile;
  let downloadLink;

  // CSV file
  csvFile = new Blob([csv], {type: "text/csv"});

  // Download link
  downloadLink = document.createElement("a");

  // File name
  downloadLink.download = filename;

  // Create a link to the file
  downloadLink.href = window.URL.createObjectURL(csvFile);

  // Hide download link
  downloadLink.style.display = "none";

  // Add the link to DOM
  document.body.appendChild(downloadLink);

  console.log(downloadLink.href);

  // Click download link
  downloadLink.click();
}

function exportTableToCSV(filename) {
  var csv = [];
  var rows = bottomContent.querySelectorAll("table tr");
  
  for (var i = 0; i < rows.length; i++) {
      var row = [], cols = rows[i].querySelectorAll("td, th");
      
      for (var j = 0; j < cols.length; j++) 
          row.push(cols[j].innerText);
      
      csv.push(row.join(","));        
  }

  // Download CSV file
  downloadCSV(csv.join("\n"), filename);
} */

function emailResults(e) {
  e.preventDefault();
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let emailRowsArray = [];
  const timesTableBody = document.getElementById("timesTableBody");
  const tableRowsArray = timesTableBody.children;
  for (let i = 0; i < tableRowsArray.length; i++) {
    const rowArray = Array.from(tableRowsArray[i].children);
    let filteredArray = [];
    rowArray.forEach((col) => {
      if (col.className !== "num" && col.className !== "delete") {
        filteredArray.push(col.innerText);
      }
    });
    emailRowsArray.push(filteredArray.join(","));
  }

  const emailBody = emailRowsArray.join("%0A");
  console.log(emailBody);

  let emailAddress = e.target[0].value;
  window.open(`mailto:${emailAddress}?subject=${year}/${month}/${day}:%203Style%20Trainer%20Session&body=${emailBody}`, '_blank');
}

//Event listeners for loading google data and clicking on headers
window.addEventListener("DOMContentLoaded", init);
duncanHeadersList.addEventListener("click", chooseHeader);
currentHeader.addEventListener("click", resetHeader);
email.addEventListener("submit", emailResults);
window.addEventListener("keydown", function (e) {
  if (e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});
