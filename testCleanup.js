const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const { 
    pruneClones, 
    pruneRegisters,
    pruneLogs,
    setupListeners 
} = require("./logic/channelCleanup");
const { loadAllLogChannels } = require('./dal/databaseApi');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES, 
        Intents.FLAGS.GUILD_MESSAGES
    ] });

setupListeners();

client.once('ready', async () => {
    await loadAllLogChannels();
    setTimeout(() => pruneLogs(client), 5000);
     //await pruneClones(client);
    console.log("ready!");
});

client.login(token);