const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const { cleanChannel } = require("./logic/channelCleanup");

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES, 
        Intents.FLAGS.GUILD_MESSAGES
    ] });

client.once('ready', async () => {
    await cleanChannel(client, "CHANNELIDHERE");
    console.log("ready!");
});

client.login(token);