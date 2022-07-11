const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const logActivity = require('../logic/logActivity');
const { getLocalizations, getLang } = require("../lang");

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
        .setNameLocalizations(getLocalizations("command_region", "region"))
		.setDescription("Set your voice chat's region")
        .setDescriptionLocalizations(getLocalizations("command_region_description", "Set your voice chat's region"))
        .addStringOption(option => 
            option.setName("country")
                .setNameLocalizations(getLocalizations("command_region_param_country", "country"))
                .setDescription("Where you want the voice chat to be hosted")
                .setDescriptionLocalizations(getLocalizations("command_region_param_country_description", "Where you want the voice chat to be hosted"))
                .setRequired(true)
                .addChoices(
                    { name: "Automatic", value: "Automatic", name_localizations: getLocalizations("command_region_param_country_option_automatic", "Automatic") },
                    { name: "Brazil", value: "Brazil", name_localizations: getLocalizations("command_region_param_country_option_brazil", "Brazil") },
                    { name: "Hong Kong", value: "Hong Kong", name_localizations: getLocalizations("command_region_param_country_option_hongkong", "Hong Kong") },
                    { name: "India", value: "India", name_localizations: getLocalizations("command_region_param_country_option_india", "India") },
                    { name: "Japan", value: "Japan", name_localizations: getLocalizations("command_region_param_country_option_japan", "Japan") },
                    { name: "Rotterdam", value: "Rotterdam", name_localizations: getLocalizations("command_region_param_country_option_rotterdam", "Rotterdam") },
                    { name: "Russia", value: "Russia", name_localizations: getLocalizations("command_region_param_country_option_russia", "Russia") },
                    { name: "Singapore", value: "Singapore", name_localizations: getLocalizations("command_region_param_country_option_singapore", "Singapore") },
                    { name: "South Africa", value: "South Africa", name_localizations: getLocalizations("command_region_param_country_option_southafrica", "South Africa") },
                    { name: "Sydney", value: "Sydney", name_localizations: getLocalizations("command_region_param_country_option_sydney", "Sydney") },
                    { name: "US Central", value: "US Central", name_localizations: getLocalizations("command_region_param_country_option_uscentral", "US Central") },
                    { name: "US East", value: "US East", name_localizations: getLocalizations("command_region_param_country_option_useast", "US East") },
                    { name: "US South", value: "US South", name_localizations: getLocalizations("command_region_param_country_option_ussouth", "US South") },
                    { name: "US West", value: "US West", name_localizations: getLocalizations("command_region_param_country_option_uswest", "US West") },
                )),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_region_log_name", "VC region changed"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

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

                    await interaction.reply({ 
                        content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                        ephemeral: true 
                    });
                    return;
                }

                // TODO: consider a similar rate limit
    
                await channel.setRTCRegion(region);
                
                await interaction.reply({ 
                    content: getLang(lang, "command_region_channel_moved", "Your channel has been moved to %1$s", country), 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /region: ${err}`);
        }
	},
};