var timeplot;

function onLoad() {
  var timeGeometry = new Timeplot.DefaultTimeGeometry({
    gridColor: new Timeplot.Color("#ffffff"),
    axisLabelsPlacement: "top"
  });

  var valueGeometryCurrent = new Timeplot.DefaultValueGeometry({
    gridColor: "#ffff00",
    axisLabelsPlacement: "right",
    min: 0,
    max: 65
  });

  var valueGeometryEntry = new Timeplot.DefaultValueGeometry({
    gridColor: "#00ff00",
    axisLabelsPlacement: "left",
    min: 0,
    max: 200
  });

  var eventSourceCurrent = new Timeplot.DefaultEventSource();
  var eventSourceEntry = new Timeplot.DefaultEventSource();

  var plotInfo = [
    Timeplot.createPlotInfo({
      id: "plot1",
      dataSource: new Timeplot.ColumnSource(eventSourceCurrent,1),
      valueGeometry: valueGeometryCurrent,
      timeGeometry: timeGeometry,
      lineColor: "#ffff00",
      showValues: true
    }),
    Timeplot.createPlotInfo({
      id: "plot2",
      dataSource: new Timeplot.ColumnSource(eventSourceEntry,2),
      valueGeometry: valueGeometryEntry,
      timeGeometry: timeGeometry,
      lineColor: "#00ff00",
      showValues: true
    })
  ];
  
  timeplot = Timeplot.create(document.getElementById("history-timeplot"), plotInfo);
  timeplot.loadText("current.txt", ",", eventSourceCurrent);
  timeplot.loadText("entry.txt", ",", eventSourceEntry);
}

var resizeTimerID = null;
function onResize() {
    if (resizeTimerID == null) {
        resizeTimerID = window.setTimeout(function() {
            resizeTimerID = null;
            timeplot.repaint();
        }, 100);
    }
}
