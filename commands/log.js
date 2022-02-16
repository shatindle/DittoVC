const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { registerLogs } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Specify a channel for recording logs. To disable logging, do not set the "to" parameter')
        .addChannelOption(option =>
            option.setName("to")
                .setDescription("The channel to use for logging.  Make sure the bot has access to it!")),
	async execute(interaction) {
        try {
            const target = interaction.options.getChannel("to");

            if (target) {
                // logging requested
                const channel = await interaction.guild.channels.fetch(target.id);

                if (channel.type !== "GUILD_TEXT") {
                    await interaction.reply({ content: '<#' + target.id + '> is not a text channel.  Please specify a text channel, then try again', ephemeral: true });
                    return;
                }

                const currentPermissions = channel.permissionsFor(interaction.member.user.id);

                if (!currentPermissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                    await interaction.reply({ content: "You need the MANAGE_CHANNELS permission to run this command", ephemeral: true });
                    return;
                }
    
                const canSendMessages = await channel.permissionsFor(interaction.client.user.id).has(Permissions.FLAGS.SEND_MESSAGES);
    
                if (!canSendMessages) {
                    await interaction.reply({ content: 'Please grant me SEND_MESSAGES in <#' + target.id + '>, then try again', ephemeral: true });
                    return;
                }
    
                await registerLogs(interaction.guild.id, target.id);
        
                await interaction.reply({ content: 'I will now log joins, leaves, and commands to <#' + target.id + '>', ephemeral: false });

                await logActivity(interaction.client, interaction.guild.id, "Logging enabled", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);                
            } else {
                // turn off logging
                await registerLogs(interaction.guild.id, null);
        
                await interaction.reply({ content: 'Logging for this server has been disabled', ephemeral: false });
            }
        } catch (err) {
            console.log(`Error in /log: ${err}`);
        }
	},
};