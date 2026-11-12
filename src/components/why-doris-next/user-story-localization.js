function userStoryId(name) {
    return 'landing.userStory.' + encodeURIComponent(name);
}
module.exports = { userStoryId };
