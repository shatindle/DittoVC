const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const logActivity = require('../logic/logActivity');

const aliases = {
    'US East': 'us-east',
    'US West': 'us-west',
    'US Central': 'us-central',
    'US South': 'us-south',
    'Rotterdam': 'rotterdam',
    'Singapore': 'singapore',
    'Brazil': 'brazil',
    'Hong Kong': 'hongkong',
    'Russia': 'russia',
    'Sydney': 'sydney',
    'South Africa': 'southafrica',
    'India': 'india',
    'Japan': 'japan',
    'Automatic': null,
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('region')
		.setDescription('Name your voice chat! Once you name it, you cannot change it unless you remake the channel.')
        .addStringOption(option => 
            option.setName("country")
                .setDescription("Where you want the voice chat to be hosted")
                .setRequired(true)
                .addChoice("Automatic", "Automatic")
                .addChoice("Brazil", "Brazil")
                .addChoice("Hong Kong", "Hong Kong")
                .addChoice("India", "India")
                .addChoice("Japan", "Japan")
                .addChoice("Rotterdam", "Rotterdam")
                .addChoice("Russia", "Russia")
                .addChoice("Singapore", "Singapore")
                .addChoice("South Africa", "South Africa")
                .addChoice("Sydney", "Sydney")
                .addChoice("US Central", "US Central")
                .addChoice("US East", "US East")
                .addChoice("US South", "US South")
                .addChoice("US West", "US West")),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "VC region changed", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const guildId = interaction.guild.id;
            let country = interaction.options.getString("country");
            let region = aliases[country];

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

                // consider a similar rate limit
                // if (ownedChannel.name) {
                //     await interaction.reply({ content: `You already named your voice chat`, ephemeral: true });
                //     return;
                // }

                // await nameOwnedChannel(ownedChannel.id, requestedName);
    
                await channel.setRTCRegion(region);
                
                await interaction.reply({ content: `Your channel has been moved to ${country}`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /region: ${err}`);
        }
	},
};