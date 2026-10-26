// Historical 3.x/2.1 documentation supports English and Chinese prose only.
// Other site locales retain their routes/navigation with English bodies.
const fallbackOnlyVersions = ['3.x', '2.1'];
const fallbackOnly = (pluginId, version) => pluginId === 'default' && fallbackOnlyVersions.includes(version);
module.exports = {fallbackOnlyVersions, fallbackOnly};
