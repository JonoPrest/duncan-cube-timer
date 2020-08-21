// Event object for easy use throughout code
function Event(name, index, scrambleFunction) {
  this.name = name;
  this.SheetIndex = index;

  this.times = [];
  this.timesToAvg = 0;

  this.scramble = scrambleFunction;

  this.element = document.getElementById(name);

  this.best = new Time(Infinity);
  this.worst = new Time(-Infinity);

  this.bestAvg5 = Infinity;
  this.bestAvg12 = Infinity;

  this.sessionMean = 0;

  this.reset = function () {
    this.times = [];
    this.timesToAvg = 0;

    this.best = new Time(Infinity);
    this.worst = new Time(-Infinity);

    this.bestAvg5 = Infinity;
    this.bestAvg12 = Infinity;

    this.sessionMean = 0;

    localStorage.removeItem(this.name);
  };
}

let currentEvent;

function setEventsAfterApiCall() {
  for (let i = 0; i < apiSheetNames.length; i++) {
    events[i] = new Event(apiSheetNames[i], i, duncanScramble);
  }

  // Set onclick of each event element

  // Parent element of all the event tabs
  var eEls = document.getElementById("eventsParent").children;
  var eventElements = [];

  // Map eEls (parent element) .children to an actual array
  for (var k = 0; k < eEls.length; k++) {
    eventElements.push(eEls[k]);
  }
}

function tabsClicked(e) {
  currentTab = e;
  e.target.className = "active";
  scramble.innerText = "";
  if (currentEvent) {
    currentEvent.element.className = "";
  }
  randomScrambleValue = "";
  duncanHeaders.style.display = "flex";
  if (!googleDataLoaded) {
    spinner.style.display = "block";
  }

  if (googleDataLoaded) {
    if (cubeTimer.isRunning) {
      return false;
    }
    headerChosen = false;
    resetHeader();

    events.filter((event, i) => {
      if (event.name === e.target.innerText) {
        changeEvent(events[i]);
      }
    });
  }
}

function changeEvent(changeTo) {
  // If it's already that event, skip the rest
  if (changeTo == currentEvent) {
    return 0;
  }

  // Set currentEvent to changeTo
  currentEvent = changeTo;

  setTabHeaders(currentEvent.SheetIndex);

  // Update scramble element and preview if necessary
 

  // Update average display box
  updateAverageDisplays();
  timerElement.innerHTML = formatTime(0);

  // Clear HTML time list
  var timesElement = document.getElementById("timesTableBody");

  while (timesElement.firstElementChild) {
    timesElement.removeChild(timesElement.firstElementChild);
  }

  // Add back new times to HTML time list
  for (var i = 0; i < currentEvent.times.length; i++) {
    addTimeElement(currentEvent.times[i].time, i);
  }

  var a = document.getElementById("ao5").children[0];
  var b = document.getElementById("bao5").children[0];

  // Show duncan's headers list if tab is clicked
  const duncanHeaders = document.getElementById("duncanHeaders");
  const spinner = document.getElementById("spinner");

  
}

eventsTableParent.addEventListener("click", tabsClicked);
