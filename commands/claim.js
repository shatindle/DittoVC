const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getClone, getOwnedChannel, setChannelOwner } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('claim')
        .setNameLocalizations(getLocalizations("command_claim", "claim"))
		.setDescription('If the owner has left the voice chat, use this command to take control of the channel')
        .setDescriptionLocalizations(getLocalizations("command_claim_description", "If the owner has left the voice chat, use this command to take control of the channel")),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_claim_log_name", "User tried to claim a VC"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const guildId = interaction.guild.id;
            const userId = interaction.member.user.id;

            if (interaction.member.voice && interaction.member.voice.channelId) {
                const voiceChannelId = interaction.member.voice.channelId;
                const clone = await getClone(voiceChannelId);

                if (clone.owner === userId) {
                    // you are the owner
                    await interaction.reply({ 
                        content: getLang(lang, "command_claim_already_own_channel", "You already own this channel"), 
                        ephemeral: true 
                    });
                    return;
                }

                const originalOwner = await interaction.guild.members.fetch(clone.owner);
                const originalOwnerUserId = originalOwner.id;

                if (originalOwner && originalOwner.voice && originalOwner.voice.channel) {
                    if (clone.id === originalOwner.voice.channel.id) {
                        // the owner is still connected
                        await interaction.reply({ 
                            content: getLang(lang, "command_claim_owner_still_in_channel", "The owner is still in the channel. You cannot claim it"), 
                            ephemeral: true 
                        });
                        return;
                    }

                }

                // the owner is not in the channel.  Let them claim it
                const currentOwnedChannel = await getOwnedChannel(userId, guildId);

                if (currentOwnedChannel) {
                    // drop ownership of this channel
                    await setChannelOwner(currentOwnedChannel.id, null);
                }

                await setChannelOwner(clone.id, userId);

                // give this user the correct permissions
                // copy the permissions of the previous owner
                let claim = interaction.client.channels.cache.get(clone.id);

                if (!claim)
                claim = await interaction.client.channels.fetch(clone.id);

                let streamPerms = false, 
                    speakPerms = false,
                    sendMessagesPerms = false;

                claim.permissionOverwrites.cache.each(async perm => {
                    if (perm.id === originalOwnerUserId) {
                        streamPerms = perm.allow.has(Permissions.FLAGS.STREAM);
                        speakPerms = perm.allow.has(Permissions.FLAGS.SPEAK);
                        sendMessagesPerms = perm.allow.has(Permissions.FLAGS.SEND_MESSAGES);
                    }
                });

                await claim.permissionOverwrites.create(userId, {
                    CONNECT: true,
                    STREAM: streamPerms,
                    SPEAK: speakPerms,
                    SEND_MESSAGES: sendMessagesPerms
                });

                // the prior owner can keep their current rights in case they come back
                await interaction.reply({ 
                    content: getLang(lang, "command_claim_you_are_now_owner", "You are now the owner of this channel"), 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_claim_you_must_be_in_voice_chat", "You must be in a user owned voice chat the owner has left to claim it"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /private: ${err}`);
        }
	},
};