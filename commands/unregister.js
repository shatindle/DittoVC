const { SlashCommandBuilder } = require('@discordjs/builders');
const { unregisterChannel } = require("../dal/databaseApi");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unregister')
		.setDescription('Un-register a channel for cloning')
        .addChannelOption(option =>
            option.setName("vc")
                .setDescription("The voice channel to stop cloning")
                .setRequired(true)),
	async execute(interaction) {
		const { id } = interaction.options.getChannel("vc");

        await unregisterChannel(id);

        await interaction.reply({ content: 'un-registered <#' + id + '> for cloning', ephemeral: true });
	},
};