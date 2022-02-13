const { MessageEmbed } = require("discord.js");
const { getLogChannel } = require("../dal/databaseApi");

async function logActivity(client, guildId, action, activity) {
    try {
        const logChannel = getLogChannel(guildId);

        const channel = client.channels.cache.get(logChannel);

        const message = new MessageEmbed()
            .setColor("#d3c3df")
            .setTitle(action)
            .setDescription(activity)
            .setTimestamp();

        await channel.send({ embeds: [message] });
    } catch (err) {
        console.log(`Error logging activity: ${err}`);
    }
}

module.exports = logActivity;