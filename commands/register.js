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
                .setDescription("Treat this role as the max permissions allowed"))
        .addBooleanOption(option => 
            option.setName("ispublic")
                .setDescription("Sets the channel to start as public or private.  Defaults to private.")),
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
            const role = interaction.options.getRole("permissions");
            const ispublic = interaction.options.getBoolean("ispublic") === true;
     
            const roleName = role ? role.name : "everyone";
    
            if (!prefix) 
                prefix = "Voice Chat {count}";

            if (prefix.replace("{count}", "000").length > 32) {
                await interaction.reply({ content: "Name of the channel must be 28 characters or less.", ephemeral: true });
                return;
            }
    
            await registerChannel(id, guildId, prefix, instructions ? instructions.id : null, role ? role.id : interaction.guild.roles.everyone.id, ispublic);
    
            let content = 
`Registered <#${id}> for cloning.
New channels will be created with the template "${prefix}".
The "${roleName}" role will be the upper limit for permissions.`;
    
            if (instructions)
                content += `\nUsers will be notified in <#${instructions.id}> of what to do.`;
    
            await interaction.reply({ content, ephemeral: false });
        } catch (err) {
            console.log(`Error in /register: ${err}`);
        }
	},
};