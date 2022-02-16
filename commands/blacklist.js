const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { addToBlacklist, removeFromBlacklist, getBlacklist, BLACKLIST_LIMIT } = require("../dal/databaseApi");
const logActivity = require("../logic/logActivity");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription('Manage the server blacklist. Note that a default blacklist will be applied')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add a word to the blacklist")
                .addStringOption(option => option.setName("word").setDescription("The word to add to the blacklist").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove a word to the blacklist")
                .addStringOption(option => option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Show your server's blacklist")),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "Blacklist command", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();

            const member = await interaction.guild.members.fetch(userId);

            if (!member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                await interaction.reply({ content: 'You need the MANAGE_CHANNELS permission to run this command', ephemeral: true });
                return;
            }

            if (subcommand=== "add") {
                const add = interaction.options.getString("word");

                if (add && add.length > 1 && add.length < 33) {
                    const limit_exceeded = await addToBlacklist(guildId, add);

                    if (limit_exceeded) {
                        await interaction.reply({ content: `Blacklist limit exceeded: over ${BLACKLIST_LIMIT} records`, ephemeral: false });
                    } else {
                        await interaction.reply({ content: `"${add}" added to the blacklist`, ephemeral: true });
                    }
                } else {
                    await interaction.reply({ content: 'Invalid word. Words must be greater than 1 character and less than 33 characters', ephemeral: true });
                }
            } else if (subcommand=== "remove") {
                const remove = interaction.options.getString("word");

                if (remove && remove.length > 1 && remove.length < 33) {
                    await removeFromBlacklist(guildId, remove);
                    await interaction.reply({ content: `"${remove}" removed from the blacklist`, ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Invalid word. Words must be greater than 1 character and less than 33 characters', ephemeral: true });
                }
            } else if (subcommand=== "list") {
                const blacklist = await getBlacklist(guildId);

                await interaction.reply({ content: 
`**Words in your blacklist:** 
${blacklist.length ? JSON.stringify(blacklist) : "*nothing here...*"}

*More items are in the blacklist. See https://github.com/web-mech/badwords/blob/master/lib/lang.json*`, ephemeral: true });
            } else {
                await interaction.reply({ content: 'Unknown blacklist command', ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /blacklist: ${err}`);
        }
	},
};