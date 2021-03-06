// Time object, for easy use and abstraction
function Time(milliseconds, scramble, element) {
  this.time = milliseconds;
  this.formattedTime = formatTime(this.time);
  this.plusTwo = false;
  this.dnf = false;

  this.scramble = scramble;

  this.element = element;

  // Averages of 5 and 12 where this time is last time
  this.ao5 = false;
  this.ao12 = false;

  this.togglePenalty = function (fromStorage = false) {
    // Value to add or subtract from session mean
    var valueChanged = 2000 / currentEvent.timesToAvg;

    // Get encoded value, for adding exclamation points later
    var e = encodeTimeObject(this);

    // If penalty is currently true, remove it
    if (this.plusTwo) {
      this.plusTwo = false;
      this.time -= 2000;

      // Remove 'true' from element class
      this.element.children[2].className = "penalty";
    }
    // Else, add penalty
    else {
      this.plusTwo = true;
      this.time += 2000;

      // Add 'true' to element class
      this.element.children[2].className = "penalty true";
    }

    // At the end, update this.formattedTime and element
    this.formattedTime = formatTime(this.time);
    this.element.children[1].innerHTML = this.formattedTime;

    // Update encoded time object in localStorage
    if (!fromStorage) {
      localStorage[currentEvent.name] = localStorage[currentEvent.name].replace(
        e,
        encodeTimeObject(this)
      );
    }

    if (this.plusTwo) {
      currentEvent.sessionMean += valueChanged;
    } else {
      currentEvent.sessionMean -= valueChanged;
    }

    recalculateBestWorst();

    recalculateAveragesAffectedBy(currentEvent.times.indexOf(this));
    updateAverageDisplays();

    // Return new value of plusTwo
    return this.plusTwo;
  };

  this.toggleDNF = function (fromStorage = false) {
    // Get encoded value, for adding exclamation points later
    var e = encodeTimeObject(this);

    // If dnf curently true, remove it
    if (this.dnf) {
      this.dnf = false;

      // Remove 'true' from class name
      this.element.children[3].className = "dnf";

      // Multiply session mean
      currentEvent.sessionMean *= currentEvent.timesToAvg;
      // Add one to times to avg
      currentEvent.timesToAvg += 1;
      // Add time to mean
      currentEvent.sessionMean += this.time;
      // Re-divide mean
      currentEvent.sessionMean /= currentEvent.timesToAvg;
    }

    // Else, add dnf
    else {
      this.dnf = true;

      // Add 'true' to class name
      this.element.children[3].className = "dnf true";

      // Divide session mean
      currentEvent.sessionMean *= currentEvent.timesToAvg;
      // Subtract one from times to avg
      currentEvent.timesToAvg -= 1;
      // Subtract time from mean
      currentEvent.sessionMean -= this.time;
      // Re-divide mean
      currentEvent.sessionMean =
        currentEvent.sessionMean / currentEvent.timesToAvg || 0;
    }

    // Update encoded time object in localStorage
    if (!fromStorage) {
      localStorage[currentEvent.name] = localStorage[currentEvent.name].replace(
        e,
        encodeTimeObject(this)
      );
    }

    recalculateBestWorst();

    recalculateAveragesAffectedBy(currentEvent.times.indexOf(this));
    updateAverageDisplays();

    // Return value of dnf
    return this.dnf;
  };
}

// Calculate cubing 'average' (mean without best or worst) of n solves
// Works with array of times (milliseconds) or Time() objects
Array.prototype.average = function (n, startIndex = this.length - 1) {
  // If there aren't enough elements for ao5/12 between
  // startIndex and first element, or if it's trying
  // to start on non-existent index, return false
  if (startIndex - n < -1 || startIndex >= this.length) {
    return false;
  }

  // Set min, max to last time in avg, sum to 0
  // Support for Time() objects or raw millisecond values
  var min = this[startIndex].time || this[startIndex];
  var max = min;
  var dnfs = 0;
  var sum = [];

  // Iterate down through array from startIndex element n times
  for (var i = startIndex; i >= startIndex - (n - 1); i--) {
    // var c for consiceness/legibility
    // Support for Time() objects or raw millisecond values
    var c = this[i].dnf || this[i].time || this[i];

    if (c === true) {
      dnfs++;
    }

    // Check for min and max
    if (c > max && Number.isInteger(c)) {
      max = c;
    } else if (c < min && Number.isInteger(c)) {
      min = c;
    }

    // Add value to sum - we'll subtract min and max after
    sum.push(c);
  }

  // finalSum is integer
  var finalSum = 0;

  // If too many dnfs, return dnf
  if (dnfs >= 2) {
    return "DNF";
  }

  // Add each NUMBER value to finalSum
  for (var k = 0; k < sum.length; k++) {
    if (Number.isInteger(sum[k])) {
      finalSum += sum[k];
    }
  }

  // If one is a dnf, don't subtract max, else do
  return dnfs == 1
    ? (finalSum - min) / (n - 2)
    : (finalSum - (min + max)) / (n - 2);
};

Array.prototype.mo3 = function (startIndex = this.length - 1) {
  // If it won't work it won't work
  if (startIndex - 2 < 0 || startIndex >= this.length) {
    return false;
  }

  var sum = 0;

  for (var i = startIndex; i >= startIndex - 2; i--) {
    var c = this[i].dnf || this[i].time || this[i];

    if (c === true) {
      return "DNF";
    } else {
      sum += c;
    }
  }

  return sum / 3;
};

Array.prototype.sessionAverage = function () {
  if (this.length < 3) {
    return false;
  }

  var finalSum = 0;

  // Ceiling of length/20 is number of maxes/mins to omit
  var toOmit = Math.ceil(this.length / 20);

  var mins = [];
  var maxes = [];
  var dnfs = 0;

  // Add values to mins, maxes until correct length
  for (var i = 0; i < toOmit; i++) {
    mins.push(Infinity);
    maxes.push(-Infinity);
  }

  // Only one loop through!!
  for (var m = 0; m < this.length; m++) {
    // Min and max thresholds
    var threshMin = Math.max.apply(Math, mins);
    var threshMax = Math.min.apply(Math, maxes);

    // Indexes of values to be replaced
    var minReplace = mins.indexOf(threshMin);
    var maxReplace = maxes.indexOf(threshMax);

    // If it's a dnf, add it to dnfs and continue
    if (this[m].dnf) {
      dnfs++;
      continue;
    }

    finalSum += this[m].time;

    // If it's greater than max's smallest, replace that with new value
    if (this[m].time > threshMax) {
      maxes[maxReplace] = this[m].time;
    }

    // If it's less than min's largest, replace that with new value
    if (this[m].time < threshMin) {
      mins[minReplace] = this[m].time;
    }
  }

  // If too many dnfs, return dnf
  if (dnfs > toOmit) {
    return "DNF";
  }

  // Replace values in maxes with dnfs as necessary
  for (var k = 0; k < dnfs; k++) {
    maxes[maxes.indexOf(Math.min.apply(Math, maxes))] = Infinity;
  }

  // Subtract all values in max and min from sum
  for (var n = 0; n < maxes.length; n++) {
    if (Number.isInteger(maxes[n])) {
      finalSum -= maxes[n];
    }
    finalSum -= mins[n];
  }

  return finalSum / (this.length - 2 * toOmit);
};

function addTime(
  time,
  scramble = currentScramble.scramble_string || currentScramble,
  u = true
) {
  //add scramble value
  currentEvent.scrambleValues.push(currentScramble);
  // Add element to time list on webpage
  var el = addTimeElement(time);

  // Recalculate average by...
  var newSessionMean = currentEvent.sessionMean;
  // Multiply average by length of times array to get sum
  newSessionMean *= currentEvent.timesToAvg;
  // Add new time to sum to get new sum
  newSessionMean += time;
  // Divide new sum by (length + 1) to get new average
  newSessionMean /= currentEvent.timesToAvg + 1;

  // Update currentEvent.sessionMean to newly calculated
  currentEvent.sessionMean = newSessionMean;

  // Create new instance of Time() object
  var thisTime = new Time(time, scramble, el);

  // If this time wasn't from local storage, add it
  if (u) {
    // Add event to local storage if it already exists
    if (localStorage[currentEvent.name]) {
      localStorage[currentEvent.name] += "," + encodeTimeObject(thisTime);
    }

    // Else, create localStorage object and store it there
    else {
      localStorage[currentEvent.name] = encodeTimeObject(thisTime);
    }
  }

  // Add new time object to currentEvent times array
  currentEvent.times.push(thisTime);
  currentEvent.timesToAvg += 1;


  thisTime.ao5 = currentEvent.times.average(5);
  thisTime.ao12 = currentEvent.times.average(12);

  // If best average of 5 or 12 are surpsased, redefine them
  if (!currentEvent.bestAvg5 || thisTime.ao5 < currentEvent.bestAvg5) {
    currentEvent.bestAvg5 = thisTime.ao5;
  }

  if (!currentEvent.bestAvg12 || thisTime.ao12 < currentEvent.bestAvg12) {
    currentEvent.bestAvg12 = thisTime.ao12;
  }

  // If time is new best or worst, take note
  if (time > currentEvent.worst.time) {
    currentEvent.worst = thisTime;
  }
  if (time < currentEvent.best.time) {
    currentEvent.best = thisTime;
  }

  // Update scramble var and element text

  updateAverageDisplays();

  return thisTime;
}

function updateCommMeantTimesTable() {
  const table = document.getElementById("meantTimeTableBody");
  table.textContent = '';
  currentEvent.commTimeAvgs.forEach((timeAvg, i) => {
    const tableRow = document.createElement("tr");
    tableRow.id = "meantTimeRow" + i;

    // Number label of time, far left
    const num = document.createElement("td");
    num.className = "num";
    // Add innerHTML, index of time + 1, then a dot
    num.textContent = i + 1 + ".";

    //Displayed Comm
    const comm = document.createElement("td");
    comm.className = "comm";
    comm.textContent = timeAvg.scramble;

    //Average time
    const time = document.createElement("td");
    time.className = "time";
    time.textContent = `Average Time: `;
    const avgNum = document.createElement("strong");
    avgNum.textContent = timeAvg.avg.toFixed(3)
    time.appendChild(avgNum);

    //Average time
    const numberOfTimes = document.createElement("td");
    numberOfTimes.className = "numberOfTimes";
    numberOfTimes.textContent = `Times Tested: `;
    const timesNum = document.createElement("strong");
    timesNum.textContent = timeAvg.no;
    numberOfTimes.appendChild(timesNum);

    // Add elements to row element
    tableRow.append(num, comm, time, numberOfTimes);

    
    table.appendChild(tableRow);
  });
}


function meanTimePerComm(commValue) {

    function compare( a, b ) {
    if ( a.avg < b.avg ){
      return 1;
    }
    if ( a.avg > b.avg ){
      return -1;
    }
    return 0;
  }

  currentEvent.commTimeAvgs = [];
  if (!currentEvent.comms.includes(commValue)) {
    currentEvent.comms.push(currentScramble);
  }
  currentEvent.comms.forEach((comm) => {
    let totalTimeforComm = 0;
    let numOfTimeValues = 0;
    currentEvent.times.forEach((time) => {
      if (time.scramble === comm) {
        totalTimeforComm += time.time;
        numOfTimeValues++;
      }
    });
    const avgTime = (totalTimeforComm / numOfTimeValues) / 1000;
    currentEvent.commTimeAvgs.push({
      scramble: comm,
      avg: avgTime,
      no: numOfTimeValues,
    });
  });
  
  currentEvent.commTimeAvgs.sort(compare);
  updateCommMeantTimesTable();
}

// Allows adding them with custom index (for event switching)
// Index defaults to currentEvent.times.length if time is new
function addTimeElement(time, index = currentEvent.times.length) {
  var tableRow = document.createElement("tr");
  tableRow.id = "timeRow" + index;

  // Number label of time, far left
  var num = document.createElement("td");
  num.className = "num";
  // Add innerHTML, index of time + 1, then a dot
  num.innerHTML = index + 1 + ".";

  // Actual time, formatted
  var timeEl = document.createElement("td");
  timeEl.className = "time";
  timeEl.innerHTML = formatTime(time);

  // Add onclick that displays info modal
  timeEl.onclick = function () {
    displayInfo(currentEvent.times[index]);
  };

  /*
    // +2 icon next to each time
    var penalty = document.createElement("td");
    penalty.className = "penalty";
    penalty.innerHTML = "+2";
    
    // Add onclick that toggles plusTwo
    penalty.onclick = function() {
        
        // First get index of time by checking label
        var label = this.parentElement.firstElementChild;
        var indexOfTime = parseInt(label.innerHTML) - 1;
        
        var timeObject = currentEvent.times[indexOfTime];
        
        timeObject.togglePenalty();
    }
    
    // DNF icon next to each time
    var dnf = document.createElement("td");
    dnf.className = "dnf";
    dnf.innerHTML = "DNF";
    
    dnf.onclick = function() {
        
        // Index of time in currentEvent.times
        var label = this.parentElement.firstElementChild;
        var indexOfTime = parseInt(label.innerHTML) - 1;
        
        // Time object in storage
        var timeObject = currentEvent.times[indexOfTime];
        
        timeObject.toggleDNF();
        
    }
    */

  //Stamp for the current commutator
  const comm = document.createElement("td");
  comm.className = "comm";
  comm.innerHTML = currentEvent.scrambleValues[index];
  comm.onclick = function () {
    displayInfo(currentEvent.times[index]);
  };

  //Date
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const timeStamp = document.createElement("td");
  timeStamp.className = "timeStamp";
  timeStamp.innerHTML = `${day}/${month}/${year}`;

  // Red X that will delete time
  var del = document.createElement("td");
  del.className = "delete";
  del.innerHTML = "X";
  del.onclick = function () {
    // First get index of time by checking label
    var label = this.parentElement.firstElementChild;
    var indexOfTime = parseInt(label.innerHTML) - 1;

    deleteTime(indexOfTime);
  };

  // Add elements to row element
  tableRow.append(num, timeEl, comm, timeStamp, del);

  // Add row element to table
  var t = document.getElementById("timesTableBody");
  t.insertBefore(tableRow, t.firstElementChild);

  // Returns HTML element
  return tableRow;
}

function deleteTime(indexOfTime) {
  var timeObject = currentEvent.times[indexOfTime];

  // First step is to remove HTML element from list

  var el = document.getElementById("timeRow" + indexOfTime);
  document.getElementById("timesTableBody").removeChild(el);

  // Now, remove time in localStorage
  // Split at time object, remove extra comma
  localStorage[currentEvent.name] = localStorage[currentEvent.name]
    .split(encodeTimeObject(timeObject))
    .join("")
    .replace(",,", ",");

  // If it's "empty", remove object
  if (localStorage[currentEvent.name] == ",") {
    localStorage.removeItem(currentEvent.name);
  }

  // Iterate through ever element AFTER deleted one
  var iter = indexOfTime + 1;

  while (document.getElementById("timeRow" + iter)) {
    // Define element
    el = document.getElementById("timeRow" + iter);

    // Change element id and innerHTML
    el.id = "timeRow" + (iter - 1);
    el.firstChild.innerHTML = iter + ".";

    iter++;
  }

  // Recalculate session mean
  // Multiply mean by length to get sum
  var sum = currentEvent.sessionMean * currentEvent.timesToAvg;
  // Subtract time to delete from sum
  sum -= timeObject.time;
  // Divide sum by new times to avg
  currentEvent.sessionMean = sum / (currentEvent.timesToAvg - 1) || 0;

  // Check if best, worst, or best ao5/12 were just deleted
  var best = false;
  var worst = false;

  if (timeObject == currentEvent.best) {
    best = true;
  }

  if (timeObject == currentEvent.worst) {
    worst = true;
  }

  // Third step is to remove the actual Time() object
  // from currentEvent.times array
  currentEvent.times.splice(indexOfTime, 1);
  currentEvent.timesToAvg -= 1;

  // Fourth step is to recalculate averages and best/worst
  recalculateAveragesAffectedBy(indexOfTime);

  // Finally, if any credentials were deleted, find new ones
  if (best || worst) {
    recalculateBestWorst();
  }

  // Reset best averages to recalculate
  // I can't find a way around this
  currentEvent.bestAvg5 = Infinity;
  currentEvent.bestAvg12 = Infinity;

  // Loop through times array
  for (var i = 0; i < currentEvent.times.length; i++) {
    var t = currentEvent.times[i];

    // If new lowest, replace with lowest
    if (t.ao5 && t.ao5 < currentEvent.bestAvg5) {
      currentEvent.bestAvg5 = t.ao5;
    }

    // If new highest, replace with highest
    if (t.ao12 && t.ao12 < currentEvent.bestAvg12) {
      currentEvent.bestAvg12 = t.ao12;
    }
  }

  // Update displays
  updateAverageDisplays();
}

// Recalculates averages affected by a change or deletion at indexOfTime
function recalculateAveragesAffectedBy(indexOfTime) {
  // Bool that determines whether one of the recalculated
  // averages was the event's best
  var bestChanged5 = false,
    bestChanged12 = false;

  // Start at indexOfTime and recalculate next eleven
  for (var i = indexOfTime, k = indexOfTime + 11; i < k; i++) {
    var currentTime = currentEvent.times[i];

    // If we're beyond list of times, break loop
    if (!currentTime) {
      break;
    }

    // If it's the event's best average of 5, make note
    if (currentEvent.times[i].ao5 == currentEvent.bestAvg5) {
      bestChanged5 = true;
    }
    // Recalculate ao5
    currentEvent.times[i].ao5 = currentEvent.times.average(5, i);

    // If it's the event's best average of 12, make note
    if (currentEvent.times[i].ao12 == currentEvent.bestAvg12) {
      bestChanged12 = true;
    }
    // Recalculate ao12
    currentEvent.times[i].ao12 = currentEvent.times.average(12, i);
  }

  // If either best was compromised...
  if (bestChanged5 || bestChanged12) {
    var newBest5 = Infinity,
      newBest12 = Infinity;

    // Parse through times array to find new bests
    for (var i = 0; i < currentEvent.times.length; i++) {
      var t = currentEvent.times[i];

      if (t.ao5 && t.ao5 < newBest5) {
        newBest5 = t.ao5;
      }
      if (t.ao12 && t.ao12 < newBest12) {
        newBest12 = t.ao12;
      }
    }
    currentEvent.bestAvg5 = newBest5 || Infinity;
    currentEvent.bestAvg12 = newBest12 || Infinity;
  }
}

function recalculateBestWorst() {
  // Parse through currentEvent again and redefine them
  currentEvent.best = currentEvent.times[0] || new Time(Infinity);
  currentEvent.worst = currentEvent.times[0] || new Time(-Infinity);

  for (var i = 0; i < currentEvent.times.length; i++) {
    var dnf = currentEvent.times[i].dnf;

    // Document time value
    var t = currentEvent.times[i];

    if (t.time < currentEvent.best.time && !dnf) {
      currentEvent.best = t;
    } else if (t.time > currentEvent.worst.time && !dnf) {
      currentEvent.worst = t;
    }
  }
}

function updateAverageDisplays() {
  // Define all the HTML element variables

  // Averages of 5 and 12
  var ao5 = document.getElementById("ao5").children[1];
  var ao12 = document.getElementById("ao12").children[1];

  // Session avg, mean
  var avg = document.getElementById("sessionAverage").children[1];
  var mean = document.getElementById("sessionMean").children[1];

  // Best and worst times
  var pb = document.getElementById("best").children[1];
  var pw = document.getElementById("worst").children[1];

  // Best avg of 5 and 12
  var bao5 = document.getElementById("bao5").children[1];
  var bao12 = document.getElementById("bao12").children[1];

  ao5.innerHTML = formatTime(currentEvent.times.average(5)) || "-";
  ao12.innerHTML = formatTime(currentEvent.times.average(12)) || "-";

  avg.innerHTML = formatTime(currentEvent.times.sessionAverage()) || "-";
  mean.innerHTML = formatTime(currentEvent.sessionMean) || "-";
  if (currentEvent.sessionMean == 0) {
    mean.innerHTML = "-";
  }

  pb.innerHTML = formatTime(currentEvent.best.time) || "-";
  pw.innerHTML = formatTime(currentEvent.worst.time) || "-";

  bao5.innerHTML = formatTime(currentEvent.bestAvg5) || "-";
  bao12.innerHTML = formatTime(currentEvent.bestAvg12) || "-";
}
