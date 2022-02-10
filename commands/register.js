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
                .setDescription("Set a custom name.  Place {count} where you would like the count positioned."))
        .addChannelOption(option => 
            option.setName("info")
                .setDescription("The text channel to give users instructions in")),
	async execute(interaction) {
		const { id, guildId } = interaction.options.getChannel("vc");
        let prefix = interaction.options.getString("name");
        const { id: instructions } = interaction.options.getChannel("info");

        if (!prefix) 
            prefix = "Voice Chat {count}";

        await registerChannel(id, guildId, prefix, instructions);

        let content = `Registered <#${id}> for cloning.\nNew channels will be created with the template "${prefix}".`;

        if (instructions)
            content += `\nUsers will be notified in <#${instructions}> of what to do.`;

        await interaction.reply({ content, ephemeral: false });
	},
};