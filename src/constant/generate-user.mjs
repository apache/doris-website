import USERS_JSON from './users.json' assert { type: "json" };

import fs from 'fs';
function generateUser() {
    const USERS = USERS_JSON.map((user, index) => {
        const newUser = {};
        newUser.story = user['公司介绍'];
        newUser.name = user['英文名字'].trim();
        newUser.category = user['行业分类'];
        newUser.category = user['行业分类'];
        newUser.logo = user['英文名字'].trim();
        newUser.order = index;
        newUser.to = user['博客链接'];
        newUser.image = `/images/user-logo/${newUser.category}/${newUser.name}.jpg`;
        return newUser;
    });
    fs.writeFileSync('./src/constant/users.data.json', JSON.stringify(USERS))
}

generateUser();