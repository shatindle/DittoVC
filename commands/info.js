const { SlashCommandBuilder } = require('@discordjs/builders');
const logActivity = require('../logic/logActivity');
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
        .setNameLocalizations(getLocalizations("command_info", "info"))
		.setDescription('Get info about this bot, including mod commands')
        .setDescriptionLocalizations(getLocalizations("command_info_description", "Get info about this bot, including mod commands")),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;
            
            await logActivity(interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_info_log_name", "User requested help"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            await interaction.reply({ 
                content: getLang(lang, "command_info_how_to_use_dittovc", 
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

/name it:text
> Give your voice chat a name.

/claim
> Take over ownership of a channel after the owner has left.

/delete
> Delete your owned voice chat.

/region
> Sets the region the voice chat is hosted in.

/info
> Display this help message.

__Mod Commands__
/register vc:voice-channel info:text-channel permissions:role publicpermissions:role ispublic:boolean name:text rename:boolean nofilter:boolean
> Register a voice channel for cloning. Info and permissions are optional. ` +
`Use info to specify a text channel where instructions will be sent to the user creating a voice chat. ` +
`Use permissions to specify a role to control the maximum permissions a user is allowed to have. ` + 
`For instance, if you do not want to allow streaming in your server, make a role that restricts streaming permissions on the channel, ` +
`then register the voice channel specifying permissions:@YourRole. Streaming would then be restricted on that voice channel for everyone, including the owner. ` +
`Use ispublic to start a voice chat as public. Defaults to private. ` +
`Name must be less than 29 characters, and can include a special {count} variable that will be replaced with the next available channel number.
Use rename to allow users to rename this voice chat.  A word filter will be applied.  Use nofilter to disable the word filter.

/unregister vc:voice-channel
> Unregister a voice channel for cloning.

/log to:text-channel
> Log all commands, creations, joins, and leaves for this server to a channel.`), 
                ephemeral: true 
            });
        } catch (err) {
            console.log(`Error in /info: ${err}`);
        }
	},
};