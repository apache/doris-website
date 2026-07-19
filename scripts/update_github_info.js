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
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch('https://api.github.com/repos/apache/doris', { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || !data.stargazers_count) {
        console.error('Failed to fetch star count from GitHub API:', res.status, data);
        process.exit(1);
    }
    return (+parseFloat(formatStar(data.stargazers_count)).toFixed(1)).toString();
}

function updateGithubData(newStar) {
    const filePath = path.join(__dirname, '../src/constant/github.data.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = content.replace(/export const STAR_COUNT = '.*';/, `export const STAR_COUNT = '${newStar}';`);
    fs.writeFileSync(filePath, newContent, 'utf-8');
}

async function main() {
    const star = await getGithubStar();
    updateGithubData(star);
    console.log('successful,stars:', star);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

