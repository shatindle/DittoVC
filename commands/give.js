const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, setChannelOwner } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give')
        .setNameLocalizations(getLocalizations("command_give", "give"))
		.setDescription('Transfer ownership of your voice chat to someone else in your voice chat')
        .setDescriptionLocalizations(getLocalizations("command_give_description", "Transfer ownership of your voice chat to someone else in your voice chat"))
        .addUserOption(option => 
            option.setName('to')
                .setNameLocalizations(getLocalizations("command_give_param_to", "to"))
                .setDescription('The user you would like to be the new owner of your voice channel')
                .setDescriptionLocalizations(getLocalizations("command_give_param_to_description", 'The user you would like to be the new owner of your voice channel'))
                .setRequired(true)),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_give_log_name", "User tried to give their VC to someone else"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const guildId = interaction.guild.id;
            const userId = interaction.member.user.id;

            const targetUser = interaction.options.getUser("to");
            const targetOwner = await interaction.guild.members.fetch(targetUser.id);

            if (!targetOwner) {
                await interaction.reply({ 
                    content: getLang(lang, "command_give_target_not_in_server", "The user you are trying to give ownership to must be in the server"), 
                    ephemeral: true 
                });
                return;
            }

            const targetOwnerUserId = targetOwner.id;

            const clone = await getOwnedChannel(userId, guildId);

            if (clone) {
                if (clone.owner === targetOwnerUserId) {
                    // you are the owner
                    await interaction.reply({ 
                        content: getLang(lang, "command_give_already_owner", "You cannot give a channel you own to yourself"), 
                        ephemeral: true 
                    });
                    return;
                }

                if (targetUser.bot) {
                    await interaction.reply({ 
                        content: getLang(lang, "command_give_bot_error", "You cannot give ownership of your voice channel to a bot"), 
                        ephemeral: true 
                    });
                    return;
                }

                const originalOwner = interaction.member.user;
                const originalOwnerUserId = originalOwner.id;

                if (targetOwner && targetOwner.voice && targetOwner.voice.channel && targetOwner.voice.channel.id === clone.id) {
                    // target is currently in the VC of the owner, allow the transfer
                    await setChannelOwner(clone.id, targetOwnerUserId);

                    // give this user the correct permissions
                    // copy the permissions of the previous owner
                    let claim = interaction.client.channels.cache.get(clone.id);

                    if (!claim) claim = await interaction.client.channels.fetch(clone.id);

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

                    const currentPerms = {}

                    try {
                        // attempt to pull the current permissions
                        claim.permissionOverwrites.cache.map(t => {
                            currentPerms[t.id] = {};
                            t.allow.toArray().forEach(perm => currentPerms[t.id][perm] = true);
                            t.deny.toArray().forEach(perm => currentPerms[t.id][perm] = false);
                        });
                    } catch {}

                    await claim.permissionOverwrites.create(targetOwnerUserId, {
                        ...(currentPerms[targetOwnerUserId] ?? {}), // this is required to maintain the default permissions
                        CONNECT: true,
                        STREAM: streamPerms,
                        SPEAK: speakPerms,
                        SEND_MESSAGES: sendMessagesPerms
                    });

                    // the prior owner can keep their current rights in case they come back
                    await interaction.reply({ 
                        content: getLang(lang, "command_give_you_are_now_owner", "<@%1$s> has been transferred <@%2$s>'s voice channel", targetOwnerUserId, originalOwnerUserId)
                    });
                } else {
                    await interaction.reply({ 
                        content: getLang(lang, "command_give_target_not_in_vc", "The user you are trying to give ownership to is not in the voice channel you own"), 
                        ephemeral: true 
                    });
                    return;
                }
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_give_you_must_be_in_voice_chat", "You must own a voice channel to transfer it to someone else"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /private: ${err}`);
        }
	},
};