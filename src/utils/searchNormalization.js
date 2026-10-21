// Length-preserving normalization keeps Lunr highlight positions bound to the
// original text. Russian spelling with е and ё shares one search token.
function normalizeRussianSearch(value) {
    return value.replace(/ё/g, 'е').replace(/Ё/g, 'Е').replace(/[()\[\]{},"';`]/g, ' ');
}
module.exports = {normalizeRussianSearch};
