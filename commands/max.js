const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('max')
		.setDescription('Make this channel limited to a certain number of users')
        .addNumberOption(option => 
            option.setName("limit")
                .setDescription("The maximum number of people you wish to join the voice chat")
                .setRequired(true)),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "User changed max users", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
            let limit = Math.floor(interaction.options.getNumber("limit"));

            if (ownedChannel) {
                if (limit < 0) {
                    await interaction.reply({ content: `You must specify a limit greater than or equal to 0`, ephemeral: true });
                    return;
                }

                if (limit > 99) {
                    await interaction.reply({ content: `You must specify a limit less than 100`, ephemeral: true });
                    return;
                }

                let channel;

                try {
                    channel = await interaction.guild.channels.fetch(ownedChannel.id);
                } catch (nochannel) {
                    if (nochannel.message === "Unknown Channel")
                        await deleteClone(ownedChannel.id);
                        
                    await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
                }

                channel.setUserLimit(limit);
                
                if (limit === 0)
                    await interaction.reply({ content: `The participant limit for <#${ownedChannel.id}> has been removed`, ephemeral: true });
                else
                    await interaction.reply({ content: `The max participants for <#${ownedChannel.id}> is now set to ${limit}`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /max: ${err}`);
        }
	},
};