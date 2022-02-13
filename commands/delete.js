const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const logActivity = require('../logic/logActivity');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Delete the channel you own'),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "VC deleted", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (ownedChannel) {
                const channel = await interaction.guild.channels.fetch(ownedChannel.id);
    
                await channel.delete();
                await deleteClone(ownedChannel.id);
                
                await interaction.reply({ content: `Your channel has been deleted`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /delete: ${err}`);
        }
	},
};