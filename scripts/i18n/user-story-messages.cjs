const fs = require('node:fs');
const path = require('node:path');
const {userStoryId} = require('../../src/components/why-doris-next/user-story-localization');
function userStoryMessages(root) {
    const users = JSON.parse(fs.readFileSync(path.join(root, 'src/constant/users.data.json'), 'utf8'));
    const messages = new Map();
    for (const user of users) {
        if (!user.story?.trim()) continue;
        const id = userStoryId(user.name);
        if (messages.has(id)) throw new Error(`Duplicate user story identity: ${user.name}`);
        messages.set(id, user.story);
    }
    return messages;
}
module.exports = {userStoryMessages};
