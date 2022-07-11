const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const isModWithAccess = require("../logic/modCheckLogic");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
        .setNameLocalizations(getLocalizations("command_remove", "remove"))
		.setDescription('Remove a user from this channel')
        .setDescriptionLocalizations(getLocalizations("command_remove_description", "Remove a user from this channel"))
        .addUserOption(option =>
            option.setName("user")
                .setNameLocalizations(getLocalizations("command_remove_param_user", "user"))
                .setDescription("The user you would like remove from this channel")
                .setDescriptionLocalizations(getLocalizations("command_remove_param_user_description", "The user you would like remove from this channel"))
                .setRequired(true)),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_remove_log_name", "User removed from VC"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const invitedUser = interaction.options.getUser("user");
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (invitedUser.bot) {
                await interaction.reply({ 
                    content: getLang(lang, "command_remove_bots_cannot_be_removed", "Bots cannot be removed from voice chat"), 
                    ephemeral: true 
                });
            } else if (ownedChannel) {
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

                // make sure this user isn't already a mod with access
                if (isModWithAccess(channel, invitedUser.id)) {
                    // user is a mod and can already connect
                    await interaction.reply({ 
                        content: getLang(lang, "command_mods_cannot_be_removed", "Moderators cannot be removed by commands"), 
                        ephemeral: true 
                    });
                    return;
                }
    
                await channel.permissionOverwrites.create(invitedUser.id, {
                    CONNECT: false,
                    SEND_MESSAGES: false
                });
                
                const member = await interaction.guild.members.fetch(invitedUser.id);
    
                if (member.voice.channel && member.voice.channel.id === ownedChannel.id) {
                    
                    await member.voice.disconnect();
                }
                
                await interaction.reply({ 
                    content: getLang(lang, "command_remove_user_removed", "%1$s#%2$s has been removed", invitedUser.username, invitedUser.discriminator), 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /remove: ${err}`);
        }
	},
};