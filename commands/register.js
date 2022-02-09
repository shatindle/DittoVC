const { SlashCommandBuilder } = require('@discordjs/builders');
const { registerChannel } = require("../dal/databaseApi");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register a channel for cloning')
        .addChannelOption(option =>
            option.setName("vc")
                .setDescription("The voice channel you wish to make cloneable")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("name")
                .setDescription("Set a custom name.  Place {count} where you would like the count positioned.")),
	async execute(interaction) {
		const { id, guildId } = interaction.options.getChannel("vc");
        let prefix = interaction.options.getString("name");

        if (!prefix) 
            prefix = "Voice Chat {count}";

        await registerChannel(id, guildId, prefix);

        await interaction.reply({ content: 'Registered <#' + id + '> for cloning', ephemeral: true });
	},
};