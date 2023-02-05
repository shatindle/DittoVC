const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('max')
        .setNameLocalizations(getLocalizations("command_max", "max"))
		.setDescription('Make this channel limited to a certain number of users')
        .setDescriptionLocalizations(getLocalizations("command_max_description", "Make this channel limited to a certain number of users"))
        .addNumberOption(option => 
            option.setName("limit")
                .setNameLocalizations(getLocalizations("command_max_param_limit", "limit"))
                .setDescription("The maximum number of people you wish to join the voice chat")
                .setDescriptionLocalizations(getLocalizations("command_max_param_limit_description", "The maximum number of people you wish to join the voice chat"))
                .setRequired(true)),
	async execute(interaction, passedInLimit) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_max_log_name", "User changed max users"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
            let limit = typeof passedInLimit === "number" ? passedInLimit : Math.floor(interaction.options.getNumber("limit"));

            if (ownedChannel) {
                if (!(ownedChannel.setmax ?? true)) {
                    await interaction.reply({ 
                        content: getLang(lang, "command_max_not_allowed", "This channel does not support setting a max"), 
                        ephemeral: true 
                    });
                    return;
                }

                if (limit < 0) {
                    await interaction.reply({ 
                        content: getLang(lang, "command_max_greater_than_zero", "You must specify a limit greater than or equal to 0"), 
                        ephemeral: true 
                    });
                    return;
                }

                if (limit > 99) {
                    await interaction.reply({ 
                        content: getLang(lang, "command_max_less_than_one_hundred", "You must specify a limit less than 100"), 
                        ephemeral: true 
                    });
                    return;
                }

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

                channel.setUserLimit(limit);
                
                if (limit === 0)
                    await interaction.reply({ 
                        content: getLang(lang, "command_max_limit_removed", "The participant limit for <#%1$s> has been removed", ownedChannel.id), 
                        ephemeral: true 
                    });
                else
                    await interaction.reply({ 
                        content: getLang(lang, "command_max_limit_set", "The max participants for <#%1$s> is now set to %2$s", ownedChannel.id, limit), 
                        ephemeral: true 
                    });
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /max: ${err}`);
        }
	},
};