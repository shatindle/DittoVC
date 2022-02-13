const { SlashCommandBuilder } = require('@discordjs/builders');
const logActivity = require('../logic/logActivity');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Get info about this bot, including mod commands'),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "User requested help", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);

await interaction.reply({ content: 
`__How to use DittoVC__
/add user:username#0000 permissions:(All, Speak, or Listen)
> Adds the user to the voice chat, defaults to all allowed permissions.

/remove user:username#0000
> Remove the user from the voice chat.

/public
> Make your voice chat public.

/private
> Make your voice chat private.

/max limit:number
> Set a max number of users. 0 removes the limit. Still respects if the channel is public or private.

/delete
> Delete your owned voice chat.

/info
> Display this help message.

__Mod Commands__
/register vc:voice-channel info:text-channel permissions:role name:text
> Register a voice channel for cloning. Info and permissions are optional. ` +
`Use info to specify a text channel where instructions will be sent to the user creating a voice chat. ` +
`Use permissions to specify a role to control the maximum permissions a user is allowed to have. ` + 
`For instance, if you do not want to allow streaming in your server, make a role that restricts streaming permissions on the channel, ` +
`then register the voice channel specifying permissions:@YourRole. Streaming would then be restricted on that voice channel for everyone, including the owner. ` +
`Name must be less than 29 characters, and can include a special {count} variable that will be replaced with the next available channel number.

/unregister vc:voice-channel
> Unregister a voice channel for cloning.

/log to:text-channel
> Log all commands, creations, joins, and leaves for this server to a channel.`, ephemeral: true });
        } catch (err) {
            console.log(`Error in /info: ${err}`);
        }
	},
};