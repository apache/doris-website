window.onload = function() {
  theTable = document.getElementById("clutch");
  today = new Date();
  secondsToday = today.getTime() / 1000;
  for (var x = 1; x < theTable.tBodies[0].rows.length; x++) {
    name = theTable.tBodies[0].rows[x].cells[0].firstChild.nodeValue;
    // Days since projects started
    dateString = theTable.tBodies[0].rows[x].cells[2].firstChild.nodeValue;
    arrayTemp = dateString.split("-");
    if (arrayTemp.length > 0 && arrayTemp[0] > 2000) {
      dateStart = new Date(Number(arrayTemp[0]),
          (arrayTemp.length > 1 ? Number(arrayTemp[1])-1 : 1),
          (arrayTemp.length > 2 ? Number(arrayTemp[2]) : 1));
      secondsStart = dateStart.getTime() / 1000;
      elapsed = Math.floor((secondsToday - secondsStart) / (60 * 60 * 24));
      theTable.tBodies[0].rows[x].cells[3].firstChild.nodeValue = elapsed;
    }
    else {
      if (theTable.tBodies[0].rows[x].cells[3].tagName == "TD") {
        theTable.tBodies[0].rows[x].cells[3].firstChild.nodeValue = "?";
        elapsed = -10;
      }
    }
    if (elapsed == -10) { // error
      theTable.tBodies[0].rows[x].cells[3].className = "issue";
    } else if (elapsed < 91) { // 3 months
      theTable.tBodies[0].rows[x].cells[3].className = "cool3";
    } else if (elapsed < 365) { // 12 months
      theTable.tBodies[0].rows[x].cells[3].className = "cool1";
    } else if (elapsed < 547) { // 18 months
      theTable.tBodies[0].rows[x].cells[3].className = "cool2";
    } else if (elapsed < 730) { // 24 months
      theTable.tBodies[0].rows[x].cells[3].className = "cool3";
    } else {
      theTable.tBodies[0].rows[x].cells[3].className = "cool4";
    }
    theTable.tBodies[0].rows[x].cells[3].className += " number";
    // Days since edited Status file
    dateString = theTable.tBodies[0].rows[x].cells[8].firstChild.nodeValue;
    arrayTemp = dateString.split("-");
    if (arrayTemp.length > 0 && arrayTemp[0] > 2000) {
      dateStart = new Date(Number(arrayTemp[0]),
          (arrayTemp.length > 1 ? Number(arrayTemp[1])-1 : 1),
          (arrayTemp.length > 2 ? Number(arrayTemp[2]) : 1));
      secondsStart = dateStart.getTime() / 1000;
      elapsed = Math.floor((secondsToday - secondsStart) / (60 * 60 * 24));
      theTable.tBodies[0].rows[x].cells[9].firstChild.nodeValue = elapsed;
    }
    else {
      if (theTable.tBodies[0].rows[x].cells[9].tagName == "TD") {
        theTable.tBodies[0].rows[x].cells[9].firstChild.nodeValue = "?";
        elapsed = -10;
      }
    }
    if (elapsed == -10) { // error
      theTable.tBodies[0].rows[x].cells[9].className = "issue";
    } else if (elapsed < 61) { // 2 months
      theTable.tBodies[0].rows[x].cells[9].className = "cool1";
    } else if (elapsed < 122) { // 4 months
      theTable.tBodies[0].rows[x].cells[9].className = "cool2";
    } else if (elapsed < 273) { // 9 months
      theTable.tBodies[0].rows[x].cells[9].className = "cool3";
    } else {
      theTable.tBodies[0].rows[x].cells[9].className = "cool4";
    }
    theTable.tBodies[0].rows[x].cells[9].className += " number";
  }
}
