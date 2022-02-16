const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { registerChannel } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");

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
                .setDescription("The text channel to give users instructions in"))
        .addRoleOption(option => 
            option.setName("permissions")
                .setDescription("Treat this role as the max permissions allowed for private VCs"))
        .addBooleanOption(option => 
            option.setName("ispublic")
                .setDescription("Sets the channel to start as public or private.  Defaults to private."))
        .addRoleOption(option => 
            option.setName("publicpermissions")
                .setDescription("Treat this role as the max permissions allowed for public VCs"))
        .addBooleanOption(option =>
            option.setName("rename")
                .setDescription("Whether or not to allow users to rename the voice channel")),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "Mod registered clone VC", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const { id, guildId, type:channelType } = interaction.options.getChannel("vc");
    
            if (channelType !== "GUILD_VOICE") {
                await interaction.reply({ content: "vc parameter needs a voice channel", ephemeral: true });
                return;
            }

            const channel = await interaction.guild.channels.fetch(id);

            const currentPermissions = channel.permissionsFor(interaction.member.user.id);

            if (!currentPermissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                await interaction.reply({ content: "You need the MANAGE_CHANNELS permission to run this command", ephemeral: true });
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
                await interaction.reply({ content: "Name of the channel must be 28 characters or less.", ephemeral: true });
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
    
            let content = 
`Registered <#${id}> for cloning.
New channels will be created with the template "${prefix}".
The "${privateRole.name.replace("@", "")}" role will be the upper limit for permissions when a channel is private.
The "${publicRole.name.replace("@", "")}" role will be the upper limit for permissions when a channel is public."`;
    
            if (instructions)
                content += `\nUsers will be notified in <#${instructions.id}> of what to do.`;

            if (rename)
                content += `\n**Users will be allowed to rename this channel.** A default blacklist will be applied. Consider adding to the \`/blacklist\`.`;
    
            await interaction.reply({ content, ephemeral: true });
        } catch (err) {
            console.log(`Error in /register: ${err}`);
        }
	},
};