import * as Comlink from 'comlink';
let remoteWorkerPromise;
// function getWorkerURL(url) {
//     const content = `importScripts( "${url}" );`;
//     return URL.createObjectURL(new Blob([content], { type: 'text/javascript' }));
// }
function getRemoteWorker() {
    if (process.env.NODE_ENV === 'production' && !remoteWorkerPromise) {
        remoteWorkerPromise = (async () => {
            // const timestamp = Date.now();
            // const Remote = Comlink.wrap(
            //     new Worker(getWorkerURL(`https://doris.apache.org/worker.js?_=${timestamp}`)),
            // );
            const url = new URL("./worker.js", import.meta.url);
            const Remote = Comlink.wrap(new Worker(url));
            return await new Remote();
        })();
    }
    return remoteWorkerPromise;
}
export async function fetchIndexesByWorker(baseUrl, searchContext) {
    if (process.env.NODE_ENV === 'production') {
        const remoteWorker = await getRemoteWorker();
        await remoteWorker.fetchIndexes(baseUrl, searchContext);
    }
}
export async function searchByWorker(baseUrl, searchContext, input) {
    if (process.env.NODE_ENV === 'production') {
        const remoteWorker = await getRemoteWorker();
        return remoteWorker.search(baseUrl, searchContext, input);
    }
    return [];
}
