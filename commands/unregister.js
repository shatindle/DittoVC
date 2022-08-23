const { Permissions, Constants } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { unregisterChannel } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unregister')
        .setNameLocalizations(getLocalizations("command_unregister", "unregister"))
		.setDescription('Un-register a channel for cloning')
        .setDescriptionLocalizations(getLocalizations("command_unregister_description", "Un-register a channel for cloning"))
        .addChannelOption(option =>
            option.setName("vc")
                .setNameLocalizations(getLocalizations("command_unregister_param_vc", "vc"))
                .setDescription("The voice channel to stop cloning")
                .setDescriptionLocalizations(getLocalizations("command_unregister_param_vc_description", "The voice channel to stop cloning"))
                .setRequired(true)
                .addChannelTypes(Constants.ChannelTypes.GUILD_VOICE)),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_unregister_log_name", "Mod unregistered clone VC"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const { id } = interaction.options.getChannel("vc");

            const channel = await interaction.guild.channels.fetch(id);

            const currentPermissions = channel.permissionsFor(interaction.member.user.id);

            if (!currentPermissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_need_manage_channels_permission", "You need the MANAGE_CHANNELS permission to run this command"), 
                    ephemeral: true 
                });
                return;
            }
    
            await unregisterChannel(id);
    
            await interaction.reply({ 
                content: getLang(lang, "command_unregister_success", "Un-registered <#%1$s> for cloning", id), 
                ephemeral: true 
            });
        } catch (err) {
            console.log(`Error in /unregister: ${err}`);
        }
	},
};