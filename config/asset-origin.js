function getAssetOrigin() {
    return (process.env.DORIS_ASSET_ORIGIN ?? 'https://cdnd.selectdb.com').replace(/\/$/, '');
}

module.exports = { getAssetOrigin };
