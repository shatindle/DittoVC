const { Permissions, CommandInteraction, MessageActionRow, MessageButton, Constants } = require("discord.js");
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
                .setRequired(true)
                .addChannelTypes(Constants.ChannelTypes.GUILD_TEXT)),
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
                        .setStyle("DANGER")

                    // add user and remove user can't be done this way... yet...
                );

            await channel.send({ 
                content: getLang(lang, "command_menu_click_here_to_control", "Join a new voice chat, then use this menu to control it! More commands are available via slash commands. Do /info to learn more."), 
                components: [row]
            });

            await interaction.reply({
                content: getLang(lang, "command_menu_success", "Menu successfully created!"),
                ephemeral: true
            })
        } catch (err) {
            console.log(`Error in /unregister: ${err}`);
        }
	},
};