const path = require('path');
const fs = require('fs');

function formatStar(star) {
    return String(star)
        .split('')
        .reverse()
        .reduce((prev, next, index) => {
            return (index % 3 ? next : next + '.') + prev;
        });
}

async function getGithubStar() {
    try {
        const res = await fetch('https://api.github.com/repos/apache/doris');
        const data = await res.json();
        if (data && data.stargazers_count) {
            const starStr = (+parseFloat(formatStar(data.stargazers_count)).toFixed(1)).toString();
            return starStr;
        }
    } catch (err) {
        console.error(err);
    }
}

function updateGithubData(newStar) {
    const filePath = path.join(__dirname, '../src/constant/github.data.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = content.replace(/export const STAR_COUNT = '.*';/, `export const STAR_COUNT = '${newStar}';`);
    fs.writeFileSync(filePath, newContent, 'utf-8');
}

async function main() {
    const star = await getGithubStar();
    if (star) {
        try {
            updateGithubData(star);
            console.log('successful,stars:', star);
        } catch (err) {
            console.error(err);
        }
    }
}

main();
