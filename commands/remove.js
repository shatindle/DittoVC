const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel } = require("../dal/databaseApi");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a user from this channel')
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user you would like remove from this channel")
                .setRequired(true)),
	async execute(interaction) {
        try {
            const invitedUser = interaction.options.getUser("user");
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (invitedUser.bot) {
                await interaction.reply({ content: `Bots cannot be removed from voice chat`, ephemeral: true });
            } else if (ownedChannel) {
                const channel = await interaction.guild.channels.fetch(ownedChannel.id);
    
                await channel.permissionOverwrites.create(invitedUser.id, {
                    CONNECT: false
                });
                
                const member = await interaction.guild.members.fetch(invitedUser.id);
    
                if (member.voice.channel.id === ownedChannel.id) {
                    
                    await member.voice.disconnect();
                }
                
                await interaction.reply({ content: `${invitedUser.username}#${invitedUser.discriminator} has been removed`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /remove: ${err}`);
        }
	},
};