const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const isModWithAccess = require("../logic/modCheckLogic");
const logActivity = require("../logic/logActivity");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a user from this channel')
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user you would like remove from this channel")
                .setRequired(true)),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "User removed from VC", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const invitedUser = interaction.options.getUser("user");
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (invitedUser.bot) {
                await interaction.reply({ content: `Bots cannot be removed from voice chat`, ephemeral: true });
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
    
                await channel.permissionOverwrites.create(invitedUser.id, {
                    CONNECT: false,
                    SEND_MESSAGES: false
                });
                
                const member = await interaction.guild.members.fetch(invitedUser.id);
    
                if (member.voice.channel && member.voice.channel.id === ownedChannel.id) {
                    
                    await member.voice.disconnect();
                }
                
                await interaction.reply({ content: `${invitedUser.username}#${invitedUser.discriminator} has been removed`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /remove: ${err}`);
        }
	},
};