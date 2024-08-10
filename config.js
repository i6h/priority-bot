require('dotenv').config();

const config = {
    token: process.env.TOKEN, // dont touch !!!
    guildId: process.env.GUILD_ID, // dont touch !!!
    clientId: process.env.CLIENT_ID, // dont touch !!!
    webhookUrl: process.env.WEBHOOK_URL, //dont touch !!!

    commandsLocked: false,
    allowedRoles: ['your_allowed_role_id', 'your_allowed_role_id2'],
    roles: [
        { name: 'Owner', value: 'role_id' },
        { name: 'Admins', value: 'role_id' },
        { name: 'anything', value: 'role_id' }
    ]
};

module.exports = config;
