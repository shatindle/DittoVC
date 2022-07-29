const { Client } = require('discord.js');
const { 
    getClone,
    deleteClone,
    monitor,
    addressChanges,
    unregisterChannel
} = require("../dal/databaseApi");
const logActivity = require('./logActivity');
const { getLang } = require("../lang");

/**
 * 
 * @param {Client} client The Discord Client
 * @param {String} channelId The channel ID
 */
async function cleanClone(client, channelId) {
    try {
        const channel = await client.channels.fetch(channelId);
        const lang = channel.guild.preferredLocale;

        if (channel && channel.members) {
            const channelName = channel.name;
            const memberCount = channel.members.size;
            const guildId = channel.guild.id;

            // no one is left in the channel.  Delete it
            if (memberCount === 0 && await getClone(channelId)){
                await channel.delete();
                await deleteClone(channelId);

                await logActivity(client, 
                    guildId, 
                    getLang(lang, "channel_cleanup", "Channel Cleanup"), 
                    getLang(lang, "channel_cleanup_description", "Channel '%1$s' has been cleaned up", channelName));
            }
        }
    } catch (err) {
        if (err.message === "Unknown Channel") {
            try {
                // channel is dead, get rid of it
                await deleteClone(channelId);
            } catch (err2) {
                console.log(`Error in clone channel cleanup - 2nd error: ${err2.toString()}`);
            }
        } else {
            console.log(`Error in clone channel cleanup: ${err.toString()}`);
        }
    }
}

/**
 * 
 * @param {Client} client 
 * @param {*} channelId 
 */
async function cleanRegisters(client, channelId, guildId) {
    try {
        const channel = await client.channels.fetch(channelId);
        // all that we care about is that the channel exists.  If it does, move on.
    } catch (err) {
        try {
            if (err.message === "Unknown Channel") {
                // channel is dead, get rid of it
                await unregisterChannel(channelId);
            } else {
                // check if the bot is still in the guild.  If it is, leave it alone
                if (!client.guilds.cache.has(guildId)) {
                    // the bot is no longer in this guild.  Remove the register
                    await unregisterChannel(channelId);
                }
                console.log(`Error in register channel cleanup: ${err.toString()}`);
            }
        } catch (err2) {
            console.log(`Error in register channel cleanup - 2nd error: ${err2.toString()}`);
        }
    }
}

const cloneList = {};
const registeredChannelList = {};

async function setupListeners() {
    monitor("clones", (changes) => addressChanges(changes, cloneList));
    monitor("channels", (changes) => addressChanges(changes, registeredChannelList));
}

async function pruneClones(client) {
    const local = {...cloneList};

    for (let clone of Object.values(local)) {
        if (clone && clone.id) {
            await cleanClone(client, clone.id);
        }
    }
}

async function pruneRegisters(client) {
    const local = {...registeredChannelList};

    for (let register of Object.values(local)) {
        if (register && register.id) {
            await cleanRegisters(client, register.id, register.guildId);
        }
    }
}

module.exports = {
    cleanClone,
    setupListeners,
    pruneClones,
    pruneRegisters
}