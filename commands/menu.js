const { Permissions, CommandInteraction, MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('menu')
        .setNameLocalizations(getLocalizations("command_menu", "menu"))
		.setDescription('Create a static controls menu')
        .setDescriptionLocalizations(getLocalizations("command_menu_description", "Create a static controls menu"))
        .addChannelOption(option =>
            option.setName("channel")
                .setNameLocalizations(getLocalizations("command_menu_param_channel", "channel"))
                .setDescription("The channel to make the command menu in")
                .setDescriptionLocalizations(getLocalizations("command_menu_param_channel_description", "The channel to make the command menu in"))
                .setRequired(true)),
	async execute(
        /** @type {CommandInteraction} */
        interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_menu_log_name", "Mod created control menu"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const { id } = interaction.options.getChannel("channel");

            const channel = await interaction.guild.channels.fetch(id);

            const currentPermissions = channel.permissionsFor(interaction.member.user.id);

            if (!currentPermissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_need_manage_channels_permission", "You need the MANAGE_CHANNELS permission to run this command"), 
                    ephemeral: true 
                });
                return;
            }
    
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("public")
                        .setLabel(getLang(lang, "command_public", "public"))
                        .setStyle("PRIMARY"),
                    new MessageButton()
                        .setCustomId("private")
                        .setLabel(getLang(lang, "command_private", "private"))
                        .setStyle("SECONDARY"),
                    new MessageButton()
                        .setCustomId("max")
                        .setLabel(getLang(lang, "command_max", "max"))
                        .setStyle("DANGER"),
                    // new MessageButton()
                    //     .setCustomId("add")
                    //     .setLabel(getLang(lang, "command_menu_button_add", "Add User")),
                    // new MessageButton()
                    //     .setCustomId("remove")
                    //     .setLabel(getLang(lang, "command_menu_button_remove", "Remove User"))
                );

            await interaction.reply({ 
                content: getLang(lang, "command_menu_click_here_to_control", "Once you've created a voice chat, use this menu to control it! More commands are available via slash commands. Do /info to learn more."), 
                components: [row]
            });
        } catch (err) {
            console.log(`Error in /unregister: ${err}`);
        }
	},
};