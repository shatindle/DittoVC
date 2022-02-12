const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel } = require("../dal/databaseApi");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('private')
		.setDescription('Make this channel private'),
	async execute(interaction) {
        try {
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (ownedChannel) {
                const channel = await interaction.guild.channels.fetch(ownedChannel.id);
    
                await channel.permissionOverwrites.create(interaction.guild.roles.everyone.id, {
                    CONNECT: false,
                    STREAM: false,
                    SPEAK: false
                });
                
                await interaction.reply({ content: `Only members you invite can join <#${ownedChannel.id}>`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /private: ${err}`);
        }
	},
};