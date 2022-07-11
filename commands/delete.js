const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const logActivity = require('../logic/logActivity');
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
        .setNameLocalizations(getLocalizations("command_delete", "delete"))
		.setDescription('Delete the channel you own')
        .setDescriptionLocalizations(getLocalizations("command_delete_description", "Delete the channel you own")),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(
                interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_delete_log_name", "VC deleted"),
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

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
    
                await channel.delete();
                await deleteClone(ownedChannel.id);
                
                await interaction.reply({ 
                    content: getLang(lang, "command_delete_channel_deleted", "Your channel has been deleted"), 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /delete: ${err}`);
        }
	},
};