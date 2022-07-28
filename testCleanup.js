const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const { 
    pruneClones, 
    pruneRegisters,
    setupListeners 
} = require("./logic/channelCleanup");

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES, 
        Intents.FLAGS.GUILD_MESSAGES
    ] });

setupListeners();

client.once('ready', async () => {
    //setTimeout(() => pruneRegisters(client), 5000);
    // await pruneClones(client);
    console.log("ready!");
});

client.login(token);