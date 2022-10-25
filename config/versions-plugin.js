const fs = require('fs-extra')

const filePath = './buildVersions.json' 

async function readVersionsFile () {
    const content = await fs.readFile(filePath, 'utf-8')
    const versionData = JSON.parse(content)
    return versionData
}

module.exports = function (context, options) {
    return {
        name: 'versions-plugin',
        async contentLoaded({ content, actions }) {
            const versions = await readVersionsFile()
            const { setGlobalData } = actions;
            setGlobalData({ versions });
        },
    };
};