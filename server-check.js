const { Client, Collection, Intents, Permissions } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS
    ] });

client.once('ready', async () => {
    console.log(client.guilds.cache.size);
    let total = 0;
    client.guilds.cache.forEach(guild => {
        console.log(`${guild.id}: ${guild.name}: ${guild.memberCount}`);
        total += guild.memberCount;
    });
    console.log(`${total} users`);
    process.exit(0);
});

client.login(token);