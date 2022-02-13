const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel } = require("../dal/databaseApi");
const allowedPermissions = require("../logic/permissionsLogic");
const logActivity = require("../logic/logActivity");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('public')
		.setDescription('Make this channel public'),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "User made VC public", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);
            
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);

            if (ownedChannel) {
                const channel = await interaction.guild.channels.fetch(ownedChannel.id);
                const perms = allowedPermissions(ownedChannel.permissions, interaction.guild.roles.everyone.id);

                await channel.permissionOverwrites.create(interaction.guild.roles.everyone.id, {
                    CONNECT: true,
                    STREAM: perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                    SPEAK: perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1
                });
                
                await interaction.reply({ content: `everyone can now join <#${ownedChannel.id}>`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /public: ${err}`);
        }
	},
};