const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel } = require("../dal/databaseApi");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('max')
		.setDescription('Make this channel limited to a certain number of users')
        .addNumberOption(option => 
            option.setName("limit")
                .setDescription("The maximum number of people you wish to join the voice chat")
                .setRequired(true)),
	async execute(interaction) {
        try {
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
            let limit = Math.floor(interaction.options.getNumber("limit"));

            if (ownedChannel) {
                if (limit < 1) {
                    await interaction.reply({ content: `You must specify a limit greater than 0`, ephemeral: true });
                    return;
                }

                if (limit > 99) {
                    await interaction.reply({ content: `You must specify a limit less than 100`, ephemeral: true });
                    return;
                }

                const channel = await interaction.guild.channels.fetch(ownedChannel.id);

                channel.setUserLimit(limit);
                
                await interaction.reply({ content: `The max participants for <#${ownedChannel.id}> is now set to ${limit}`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /max: ${err}`);
        }
	},
};