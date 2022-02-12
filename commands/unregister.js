const { Permissions } = require("discord.js");
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
        try {
            const { id } = interaction.options.getChannel("vc");

            const channel = await interaction.guild.channels.fetch(id);

            const currentPermissions = channel.permissionsFor(interaction.member.user.id);

            if (!currentPermissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                await interaction.reply({ content: "You need the MANAGE_CHANNELS permission to run this command", ephemeral: true });
                return;
            }
    
            await unregisterChannel(id);
    
            await interaction.reply({ content: 'un-registered <#' + id + '> for cloning', ephemeral: false });
        } catch (err) {
            console.log(`Error in /unregister: ${err}`);
        }
	},
};