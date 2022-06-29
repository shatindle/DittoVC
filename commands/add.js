const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const allowedPermissions = require("../logic/permissionsLogic");
const isModWithAccess = require("../logic/modCheckLogic");
const logActivity = require("../logic/logActivity");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Give a user access to this channel')
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user you would like to invite")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("permissions")
                .setDescription("Permissions you would like to give the user")
                .addChoices(
                    { name: "All", value: "all" },
                    { name: "Speak", value: "speak" },
                    { name: "Text", value: "send_messages" },
                    { name: "Listen", value: "listen" }
                )),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "User added to VC", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const invitedUser = interaction.options.getUser("user");
            const request = interaction.options.getString("permissions");
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (invitedUser.bot) {
                await interaction.reply({ content: `Bots cannot be invited to voice chat`, ephemeral: true });
            } else if (interaction.id === invitedUser.id) {
                await interaction.reply({ content: `You already have access`, ephemeral: true });
            } else if (ownedChannel) {
                let channel;

                try {
                    channel = await interaction.guild.channels.fetch(ownedChannel.id);
                } catch (nochannel) {
                    if (nochannel.message === "Unknown Channel")
                        await deleteClone(ownedChannel.id);
                        
                    await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
                    return;
                }

                // make sure this user isn't already a mod with access
                if (isModWithAccess(channel, invitedUser.id)) {
                    // user is a mod and can already connect
                    await interaction.reply({ content: `This moderator already has access`, ephemeral: true });
                    return;
                }
                
                const perms = allowedPermissions(ownedChannel.permissions, ownedChannel.roleId, request);
    
                await channel.permissionOverwrites.create(invitedUser.id, {
                    CONNECT: true,
                    STREAM: perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                    SPEAK: perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1,
                    SEND_MESSAGES: perms.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1
                });
                
                await interaction.reply({ content: `<@${invitedUser.id}> can now join <#${ownedChannel.id}>` });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /add: ${err}`);
        }
	},
};