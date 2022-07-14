const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const allowedPermissions = require("../logic/permissionsLogic");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('public')
        .setNameLocalizations(getLocalizations("command_public", "public"))
		.setDescription('Make this channel public')
        .setDescriptionLocalizations(getLocalizations("command_public_description", "Make this channel public")),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;

            const logDetails = interaction.componentType === "BUTTON" ? getLang(lang, "command_public_button_click", "Clicked button 'public'") : interaction.toString();
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_public_log_name", "User made VC public"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, logDetails));
            
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);

            if (ownedChannel) {
                let channel;

                try {
                    channel = await interaction.guild.channels.fetch(ownedChannel.id);
                } catch (nochannel) {
                    if (nochannel.message === "Unknown Channel")
                        await deleteClone(ownedChannel.id);
                        
                    await interaction.reply({ 
                        content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                        ephemeral: true 
                    });
                    return;
                }

                const perms = allowedPermissions(ownedChannel.publicPermissions ?? ownedChannel.permissions, interaction.guild.roles.everyone.id);

                channel.permissionOverwrites.cache.each(async perm => {
                    if (perm.id !== interaction.client.user.id && perm.type === "member") {
                        let allowed = new Permissions(perm.allow);
                        let streamPerms, speakPerms, sendMessagePerms;

                        if (ownedChannel.owner === perm.id) {
                            // this is the owner, they get full perms allowed
                            streamPerms = perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1;
                            speakPerms = perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1;
                            sendMessagePerms = perms.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1;
                        } else {
                            streamPerms = perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1 && allowed.has(Permissions.FLAGS.STREAM);
                            speakPerms = perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1 && allowed.has(Permissions.FLAGS.SPEAK);
                            sendMessagePerms = perms.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1 && allowed.has(Permissions.FLAGS.SEND_MESSAGES);
                        }

                        try {
                            await channel.permissionOverwrites.create(perm.id, {
                                CONNECT: true,
                                STREAM: streamPerms,
                                SPEAK: speakPerms,
                                SEND_MESSAGES: sendMessagePerms
                            });
                        } catch (edit_err) {
                            console.log(`Unable to alter channel for this user, keep going... Error: ${edit_err}`);
                        }

                        if (!streamPerms) {
                            // if the user is streaming, disconnect them
                            const member = await interaction.guild.members.fetch(perm.id);

                            if (member.voice.streaming && member.voice.channel && member.voice.channel.id === ownedChannel.id) {
                                await member.voice.disconnect();
                            }
                        }
                    }
                });

                await channel.permissionOverwrites.create(interaction.guild.roles.everyone.id, {
                    CONNECT: true,
                    STREAM: perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                    SPEAK: perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1,
                    SEND_MESSAGES: perms.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1
                });
                
                await interaction.reply({ 
                    content: getLang(lang, "command_public_everyone_can_join", "Everyone can now join <#%1$s>", ownedChannel.id), 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /public: ${err}`);
        }
	},
};