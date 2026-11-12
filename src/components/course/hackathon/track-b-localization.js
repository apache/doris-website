// Keep source metadata available to the English documentation/PR generators.
function localizeTrackBTask(task, map) {
    const prefix = `landing.trackB.task.${task.code}`;
    return {...task, title: map(`${prefix}.title`, task.title), time: map(`${prefix}.time`, task.time),
        doc: {...task.doc, label: map(`${prefix}.doc`, task.doc.label)},
        alsoSee: task.alsoSee?.map((doc, index) => ({...doc, label: map(`${prefix}.alsoSee.${index}`, doc.label)})),
        proves: task.proves.map((line, index) => map(`${prefix}.proves.${index}`, line))};
}
module.exports = {localizeTrackBTask};
function trackBSourceTask(task, sources) {
    return sources.find(source => source.id === task.id) ?? task;
}
module.exports.trackBSourceTask = trackBSourceTask;
