const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { registerChannel } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
        .setNameLocalizations(getLocalizations("command_register", "register"))
		.setDescription('Register a channel for cloning')
        .setDescriptionLocalizations(getLocalizations("command_register_description", "Register a channel for cloning"))
        .addChannelOption(option =>
            option.setName("vc")
                .setNameLocalizations(getLocalizations("command_register_param_vc", "vc"))
                .setDescription("The voice channel you wish to make cloneable")
                .setDescriptionLocalizations(getLocalizations("command_register_param_vc_description", "The voice channel you wish to make cloneable"))
                .setRequired(true))
        .addStringOption(option => 
            option.setName("name")
                .setNameLocalizations(getLocalizations("command_register_param_name", "name"))
                .setDescription("Set a custom name.  Place {count} where you would like the count positioned.")
                .setDescriptionLocalizations(getLocalizations("command_register_param_name_description", "Set a custom name.  Place {count} where you would like the count positioned.")))
        .addChannelOption(option => 
            option.setName("info")
                .setNameLocalizations(getLocalizations("command_register_param_info", "info"))
                .setDescription("The text channel to give users instructions in")
                .setDescriptionLocalizations(getLocalizations("command_register_param_info_description", "The text channel to give users instructions in")))
        .addRoleOption(option => 
            option.setName("permissions")
                .setNameLocalizations(getLocalizations("command_register_param_permissions", "permissions"))
                .setDescription("Treat this role as the max permissions allowed for private VCs")
                .setDescriptionLocalizations(getLocalizations("command_register_param_permissions_description", "Treat this role as the max permissions allowed for private VCs")))
        .addBooleanOption(option => 
            option.setName("ispublic")
                .setNameLocalizations(getLocalizations("command_register_param_ispublic", "ispublic"))
                .setDescription("Sets the channel to start as public or private.  Defaults to private.")
                .setDescriptionLocalizations(getLocalizations("command_register_param_ispublic_description", "Sets the channel to start as public or private.  Defaults to private.")))
        .addRoleOption(option => 
            option.setName("publicpermissions")
                .setNameLocalizations(getLocalizations("command_register_param_publicpermissions", "publicpermissions"))
                .setDescription("Treat this role as the max permissions allowed for public VCs")
                .setDescriptionLocalizations(getLocalizations("command_register_param_publicpermissions_description", "Treat this role as the max permissions allowed for public VCs")))
        .addBooleanOption(option =>
            option.setName("rename")
                .setNameLocalizations(getLocalizations("command_register_param_rename", "rename"))
                .setDescription("Whether or not to allow users to rename the voice channel")
                .setDescriptionLocalizations(getLocalizations("command_register_param_rename_description", "Whether or not to allow users to rename the voice channel"))),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_register_log_name", "Mod registered clone VC"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const { id, guildId, type:channelType } = interaction.options.getChannel("vc");
    
            if (channelType !== "GUILD_VOICE") {
                await interaction.reply({ 
                    content: getLang(lang, "command_register_channel_must_be_voice", "VC parameter needs a voice channel"), 
                    ephemeral: true 
                });
                return;
            }

            const channel = await interaction.guild.channels.fetch(id);

            const currentPermissions = channel.permissionsFor(interaction.member.user.id);

            if (!currentPermissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_need_manage_channels_permission", "You need the MANAGE_CHANNELS permission to run this command"), 
                    ephemeral: true 
                });
                return;
            }
    
            let prefix = interaction.options.getString("name");
            const instructions = interaction.options.getChannel("info");
            let privateRole = interaction.options.getRole("permissions");
            let publicRole = interaction.options.getRole("publicpermissions");
            const ispublic = interaction.options.getBoolean("ispublic") === true;
            const rename = interaction.options.getBoolean("rename") === true;

            if (!privateRole)
                privateRole = interaction.guild.roles.everyone;

            if (!publicRole)
                publicRole = privateRole;
    
            if (!prefix) 
                prefix = "Voice Chat {count}";

            if (prefix.replace("{count}", "000").length > 32) {
                await interaction.reply({ 
                    content: getLang(lang, "command_register_name_too_long", "Name of the channel must be 28 characters or less."), 
                    ephemeral: true 
                });
                return;
            }
    
            await registerChannel(
                id, 
                guildId, 
                prefix, 
                instructions ? instructions.id : null, 
                privateRole.id,
                publicRole.id,
                ispublic,
                rename);
    
            let content = getLang(lang, "command_register_info",
`Registered <#%1$s> for cloning.
New channels will be created with the template "%2$s".
The "%3$s" role will be the upper limit for permissions when a channel is private.
The "%4$s" role will be the upper limit for permissions when a channel is public."`, 
                id, 
                prefix, 
                privateRole.name.replace("@", ""), 
                publicRole.name.replace("@", ""));
    
            if (instructions)
                content += "\n" + getLang(lang, "command_register_instructions_channel", "Users will be notified in <#%1$s> of what to do.", instructions.id);

            if (rename)
                content += "\n" + getLang(lang, "command_register_rename_channel", "**Users will be allowed to rename this channel.** A default blacklist will be applied. Consider adding to the `/blacklist`.");
    
            await interaction.reply({ content, ephemeral: true });
        } catch (err) {
            console.log(`Error in /register: ${err}`);
        }
	},
};