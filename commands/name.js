const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, getBlacklist, nameOwnedChannel, deleteClone } = require("../dal/databaseApi");
const logActivity = require('../logic/logActivity');
var Filter = require('bad-words');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('name')
		.setDescription('Name your voice chat! Once you name it, you cannot change it unless you remake the channel.')
        .addStringOption(option => 
            option.setName("it")
                .setDescription("The name you want to name your VC")
                .setRequired(true)),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "VC named", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const guildId = interaction.guild.id;
            let requestedName = interaction.options.getString("it");

            if (!requestedName) {
                await interaction.reply({ content: `Please specify a name to use`, ephemeral: true });
                return;
            }

            requestedName = requestedName.trim();

            if (requestedName.length > 32) {
                await interaction.reply({ content: `Please specify a name that is less than 33 characters`, ephemeral: true });
                return;
            }

            const filter = new Filter({ placeHolder: '.'});
            const blacklist = getBlacklist(guildId);

            if (blacklist && blacklist.length > 0)
                filter.addWords(...blacklist);

            requestedName = filter.clean(requestedName);

            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (ownedChannel) {
                let channel;

                try {
                    channel = await interaction.guild.channels.fetch(ownedChannel.id);
                } catch (nochannel) {
                    if (nochannel.message === "Unknown Channel")
                        await deleteClone(ownedChannel.id);

                    await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
                    return;
                }

                if (!ownedChannel.rename) {
                    await interaction.reply({ content: `Renaming voice channels is disabled`, ephemeral: true });
                    return;
                }

                if (ownedChannel.name) {
                    await interaction.reply({ content: `You already named your voice chat`, ephemeral: true });
                    return;
                }

                await nameOwnedChannel(ownedChannel.id, requestedName);
    
                await channel.setName(requestedName);
                
                await interaction.reply({ content: `Your channel has been renamed`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /name: ${err}`);
        }
	},
};