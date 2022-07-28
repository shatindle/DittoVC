const { Client } = require('discord.js');
const { 
    getClone,
    deleteClone
} = require("../dal/databaseApi");
const logActivity = require('./logActivity');
const { getLang } = require("../lang");

/**
 * 
 * @param {Client} client The Discord Client
 * @param {String} channelId The channel ID
 */
async function cleanChannel(client, channelId) {
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
        console.log(`Error in channel cleanup: ${err.toString()}`);
    }
}

module.exports = {
    cleanChannel
}