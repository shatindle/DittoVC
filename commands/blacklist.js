const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { addToBlacklist, removeFromBlacklist, getBlacklist, BLACKLIST_LIMIT } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist')
        .setNameLocalizations(getLocalizations("command_blacklist", "blacklist"))
		.setDescription('Manage the server blacklist. Note that a default blacklist will be applied')
        .setDescriptionLocalizations(getLocalizations("command_blacklist_description", "Manage the server blacklist. Note that a default blacklist will be applied"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setNameLocalizations(getLocalizations("command_blacklist_param_add", "add"))
                .setDescription("Add a word to the blacklist")
                .setDescriptionLocalizations(getLocalizations("command_blacklist_param_add_description", "Add a word to the blacklist"))
                .addStringOption(option => 
                    option.setName("word")
                        .setNameLocalizations(getLocalizations("command_blacklist_param_add_param_word", "word"))
                        .setDescription("The word to add to the blacklist")
                        .setDescriptionLocalizations(getLocalizations("command_blacklist_param_add_param_word_description", "The word to add to the blacklist"))
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setNameLocalizations(getLocalizations("command_blacklist_param_remove", "remove"))
                .setDescription("Remove a word to the blacklist")
                .setDescriptionLocalizations(getLocalizations("command_blacklist_param_remove_description", "Remove a word to the blacklist"))
                .addStringOption(option => 
                    option.setName("word")
                    .setNameLocalizations(getLocalizations("command_blacklist_param_remove_param_word", "word"))
                    .setDescription("The word to remove from the blacklist")
                    .setDescriptionLocalizations(getLocalizations("command_blacklist_param_remove_param_word_description", "The word to remove from the blacklist"))
                    .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setNameLocalizations(getLocalizations("command_blacklist_param_list", "list"))
                .setDescription("Show your server's blacklist")
                .setDescriptionLocalizations(getLocalizations("command_blacklist_param_list_description", "Show your server's blacklist"))),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;

            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_blacklist_log_name", "Blacklist command"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();

            const member = await interaction.guild.members.fetch(userId);

            if (!member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_need_manage_channels_permission", "You need the MANAGE_CHANNELS permission to run this command"),
                    ephemeral: true 
                });
                return;
            }

            if (subcommand=== "add") {
                const add = interaction.options.getString("word");

                if (add && add.length > 1 && add.length < 33) {
                    const limit_exceeded = await addToBlacklist(guildId, add);

                    if (limit_exceeded) {
                        await interaction.reply({ 
                            content: getLang(lang, "command_blacklist_limit_exceeded", "Blacklist limit exceeded: over %1$s records", BLACKLIST_LIMIT), 
                            ephemeral: false 
                        });
                    } else {
                        await interaction.reply({ 
                            content: getLang(lang, "command_blacklist_word_added_to_list", "\"%1$s\" added to the blacklist", add), 
                            ephemeral: true 
                        });
                    }
                } else {
                    await interaction.reply({ 
                        content: getLang(lang, "command_blacklist_invalid_word", "Invalid word. Words must be greater than 1 character and less than 33 characters"), 
                        ephemeral: true 
                    });
                }
            } else if (subcommand=== "remove") {
                const remove = interaction.options.getString("word");

                if (remove && remove.length > 1 && remove.length < 33) {
                    await removeFromBlacklist(guildId, remove);
                    await interaction.reply({ 
                        content: getLang(lang, "command_blacklist_word_removed_from_list", "\"%1$s\" removed from the blacklist", remove), 
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: getLang(lang, "command_blacklist_invalid_word", "Invalid word. Words must be greater than 1 character and less than 33 characters"), 
                        ephemeral: true 
                    });
                }
            } else if (subcommand=== "list") {
                const blacklist = await getBlacklist(guildId);
                const allBlacklistItems = blacklist.length ? JSON.stringify(blacklist) : "*nothing here...*";

                await interaction.reply({ 
                    content: getLang(lang, "command_blacklist_words_in_list", "**Words in your blacklist:** \n%1$s\n\n*More items are in the blacklist. See %2$s*", allBlacklistItems, "https://github.com/web-mech/badwords/blob/master/lib/lang.json"), 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_blacklist_unknown", "Unknown blacklist command"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /blacklist: ${err}`);
        }
	},
};