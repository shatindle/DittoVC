const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { registerLogs } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('log')
        .setNameLocalizations(getLocalizations("command_log", "log"))
		.setDescription('Specify a channel for recording logs. To disable logging, do not set the "to" parameter')
        .setDescriptionLocalizations(getLocalizations("command_log_description", "Specify a channel for recording logs. To disable logging, do not set the \"to\" parameter"))
        .addChannelOption(option =>
            option.setName("to")
                .setNameLocalizations(getLocalizations("command_log_param_to", "to"))
                .setDescription("The channel to use for logging.  Make sure the bot has access to it!")
                .setDescriptionLocalizations(getLocalizations("command_log_param_to_description", "The channel to use for logging.  Make sure the bot has access to it!"))),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            const target = interaction.options.getChannel("to");

            if (target) {
                // logging requested
                const channel = await interaction.guild.channels.fetch(target.id);

                if (channel.type !== "GUILD_TEXT") {
                    await interaction.reply({ 
                        content: getLang(lang, "command_log_not_a_text_channel", "<#%1$s> is not a text channel.  Please specify a text channel, then try again", target.id), 
                        ephemeral: true 
                    });
                    return;
                }

                const currentPermissions = channel.permissionsFor(interaction.member.user.id);

                if (!currentPermissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                    await interaction.reply({ 
                        content: getLang(lang, "command_you_need_manage_channels_permission", "You need the MANAGE_CHANNELS permission to run this command"), 
                        ephemeral: true 
                    });
                    return;
                }
    
                const canSendMessages = await channel.permissionsFor(interaction.client.user.id).has(Permissions.FLAGS.SEND_MESSAGES);
    
                if (!canSendMessages) {
                    await interaction.reply({ 
                        content: getLang(lang, "command_log_need_send_messages", "Please grant me SEND_MESSAGES in <#%1$s>, then try again", target.id), 
                        ephemeral: true 
                    });
                    return;
                }
    
                await registerLogs(interaction.guild.id, target.id);
        
                await interaction.reply({ 
                    content: getLang(lang, "command_log_will_log_to", "I will now log joins, leaves, and commands to <#%1$s>", target.id), 
                    ephemeral: false 
                });

                await logActivity(interaction.client, 
                    interaction.guild.id, 
                    getLang(lang, "command_log_log_name", "Logging enabled"), 
                    getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));             
            } else {
                // turn off logging
                await registerLogs(interaction.guild.id, null);
        
                await interaction.reply({ 
                    content: getLang(lang, "command_log_disabled", "Logging for this server has been disabled"), 
                    ephemeral: false 
                });
            }
        } catch (err) {
            console.log(`Error in /log: ${err}`);
        }
	},
};