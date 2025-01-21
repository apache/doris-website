const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2'); 

const allNeedReplacePath = [];

function getAllNeedReplacePath(rootPath) {
    const statsObj = fs.statSync(rootPath, (err, stats) => {
        if (err) {
            console.log('err', err);
            return;
        }
    });
    if (statsObj.isFile()) {
        allNeedReplacePath.push(rootPath);
    } else if (statsObj.isDirectory()) {
        const files = fs.readdirSync(rootPath);
        for (let filename of files) {
            const curPath = `${rootPath}/${filename}`;
            getAllNeedReplacePath(curPath);
        }
    }
}

function modifyFileName(rootPath) {
    getAllNeedReplacePath(rootPath);
    allNeedReplacePath.forEach(file => {
        const suffix = file.includes('versioned_docs') ? file.split('versioned_docs')[1] : '';
        if ((suffix && suffix.includes('_')) || (!suffix && file.includes('_'))) {
            const oldPath = file;
            const newPath = suffix
                ? file.split('versioned_docs')[0] + 'versioned_docs' + suffix.replace(/_/g, '-')
                : file.replace(/_/g, '-');

            fs.rename(oldPath, newPath, err => {
                if (err) {
                    console.error(`Unable to rename file ${file}:`, err);
                } else {
                    console.log(`File renamed successfully: ${file} -> ${newPath}`);
                }
            });
        }
    });
}

modifyFileName(directoryPath);
