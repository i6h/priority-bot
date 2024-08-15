require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const stateFilePath = path.join(dataDir, 'state.json');

let commandsLocked = false;

if (fs.existsSync(stateFilePath)) {
    const state = JSON.parse(fs.readFileSync(stateFilePath));
    commandsLocked = state.commandsLocked || false;
} else {
    fs.writeFileSync(stateFilePath, JSON.stringify({ commandsLocked }));
}


const config = {
    token: process.env.TOKEN, // dont touch !!!
    guildId: process.env.GUILD_ID, // dont touch !!!
    clientId: process.env.CLIENT_ID, // dont touch !!!
    webhookUrl: process.env.WEBHOOK_URL, //dont touch !!!

    commandsLocked, // Load the dynamic value
    allowedRoles: ['844828930670067752', 'your_allowed_role_id2'],
    roles: [
        { name: 'Owner', value: '844831449994887209' },
        { name: 'Admins', value: 'role_id' },
        { name: 'anything', value: 'role_id' }
    ]
};

module.exports = config;
