const { vsprintf } = require("sprintf-js");

/**
 * This is used for debugging purposes. Set to false if you're missing a key. In production, this should always be set to true.
 */
const strict = true;

/**
 * All of the following text is what needs to be translated to other locales.  en-US is done as an example.
 */
const text = {
    // interactions:

    // generic commands
    "command_user_used": "<@%1$s> used:\n %2$s",
    "command_you_need_manage_channels_permission": "You need the MANAGE_CHANNELS permission to run this command",
    "command_you_dont_own_vc": "You do not own a voice chat. Join a clonable voice chat to claim it",
    "generic_error": "There was an error while executing this command!",

    // /add
    "command_add": "add",
    "command_add_description": "Give a user access to this channel",
    "command_add_param_user": "user",
    "command_add_param_user_description": "The user you would like to invite",
    "command_add_param_permissions": "permissions",
    "command_add_param_permissions_description": "Permissions you would like to give the user",
    "command_add_param_permissions_option_all": "All",
    "command_add_param_permissions_option_speak": "Speak",
    "command_add_param_permissions_option_text": "Text",
    "command_add_param_permissions_option_listen": "Listen",
    "command_add_log_name": "User added to VC",
    "command_add_bot_error": "Bots cannot be invited to voice chat",
    "command_add_already_have_access": "You already have access",
    "command_add_mod_has_access": "This moderator already has access",
    "command_add_user_can_join": "<@%1$s> can now join <#%2$s>",

    // /blacklist
    "command_blacklist": "blacklist",
    "command_blacklist_description": "Manage the server blacklist. Note that a default blacklist will be applied",
    "command_blacklist_param_add": "add",
    "command_blacklist_param_add_description": "Add a word to the blacklist",
    "command_blacklist_param_add_param_word": "word",
    "command_blacklist_param_add_param_word_description": "The word to add to the blacklist",
    "command_blacklist_param_remove": "remove",
    "command_blacklist_param_remove_description": "Remove a word to the blacklist",
    "command_blacklist_param_remove_param_word": "word",
    "command_blacklist_param_remove_param_word_description": "The word to remove from the blacklist",
    "command_blacklist_param_list": "list",
    "command_blacklist_param_list_description": "Show your server's blacklist",
    "command_blacklist_log_name": "Blacklist command",
    "command_blacklist_limit_exceeded": "Blacklist limit exceeded: over %1$s records",
    "command_blacklist_word_added_to_list": "\"%1$s\" added to the blacklist",
    "command_blacklist_invalid_word": "Invalid word. Words must be greater than 1 character and less than 33 characters",
    "command_blacklist_word_removed_from_list": "\"%1$s\" removed from the blacklist",
    "command_blacklist_words_in_list": "**Words in your blacklist:** \n%1$s\n\n*More items are in the blacklist. See %2$s*",
    "command_blacklist_unknown": "Unknown blacklist command",

    // /claim
    "command_claim": "claim",
    "command_claim_description": "If the owner has left the voice chat, use this command to take control of the channel",
    "command_claim_log_name": "User tried to claim a VC",
    "command_claim_already_own_channel": "You already own this channel",
    "command_claim_owner_still_in_channel": "The owner is still in the channel. You cannot claim it",
    "command_claim_you_are_now_owner": "You are now the owner of this channel",
    "command_claim_you_must_be_in_voice_chat": "You must be in a user owned voice chat the owner has left to claim it",

    // /delete
    "command_delete": "delete",
    "command_delete_description": "Delete the channel you own",
    "command_delete_log_name": "VC deleted",
    "command_delete_channel_deleted": "Your channel has been deleted",

    // /info
    "command_info": "info",
    "command_info_description": "Get info about this bot, including mod commands",
    "command_info_log_name": "User requested help",

    "command_info_how_to_use_dittovc": 
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
/register vc:voice-channel info:text-channel permissions:role publicpermissions:role ispublic:boolean name:text
> Register a voice channel for cloning. Info and permissions are optional. Use info to specify a text channel where instructions will be sent to the user creating a voice chat. Use permissions to specify a role to control the maximum permissions a user is allowed to have. For instance, if you do not want to allow streaming in your server, make a role that restricts streaming permissions on the channel, then register the voice channel specifying permissions:@YourRole. Streaming would then be restricted on that voice channel for everyone, including the owner. Use ispublic to start a voice chat as public. Defaults to private. Name must be less than 29 characters, and can include a special {count} variable that will be replaced with the next available channel number.

/unregister vc:voice-channel
> Unregister a voice channel for cloning.

/log to:text-channel
> Log all commands, creations, joins, and leaves for this server to a channel.`,

    // /log
    "command_log": "log",
    "command_log_description": "Specify a channel for recording logs. To disable logging, do not set the \"to\" parameter",
    "command_log_param_to": "to",
    "command_log_param_to_description": "The channel to use for logging.  Make sure the bot has access to it!",
    "command_log_not_a_text_channel": "<#%1$s> is not a text channel.  Please specify a text channel, then try again",
    "command_log_need_send_messages": "Please grant me SEND_MESSAGES in <#%1$s>, then try again",
    "command_log_will_log_to": "I will now log joins, leaves, and commands to <#%1$s>",
    "command_log_log_name": "Logging enabled",
    "command_log_disabled": "Logging for this server has been disabled",

    // /max
    "command_max": "max",
    "command_max_description": "Make this channel limited to a certain number of users",
    "command_max_param_limit": "limit",
    "command_max_param_limit_description": "The maximum number of people you wish to join the voice chat",
    "command_max_log_name": "User changed max users",
    "command_max_greater_than_zero": "You must specify a limit greater than or equal to 0",
    "command_max_less_than_one_hundred": "You must specify a limit less than 100",
    "command_max_limit_removed": "The participant limit for <#%1$s> has been removed",
    "command_max_limit_set": "The max participants for <#%1$s> is now set to %2$s",

    // /name
    "command_name": "name", 
    "command_name_description": "Name your voice chat! Once you name it, you cannot change it unless you remake the channel.",
    "command_name_param_it": "it",
    "command_name_param_it_description": "The name you want to name your VC",
    "command_name_log_name": "VC named",
    "command_name_please_specify": "Please specify a name to use",
    "command_name_too_long": "Please specify a name that is less than 33 characters",
    "command_name_renaming_disabled": "Renaming voice channels is disabled",
    "command_name_already_named": "You already named your voice chat",
    "command_name_renamed": "Your channel has been renamed",

    // /private
    "command_private": "private",
    "command_private_description": "Make this channel private",
    "command_private_log_name": "User made VC private",
    "command_private_only_members_can_join": "Only members you invite can join <#%1$s>",

    // /public
    "command_public": "public",
    "command_public_description": "Make this channel public",
    "command_public_log_name": "User made VC public",
    "command_public_everyone_can_join": "Everyone can now join <#%1$s>",

    // /region
    "command_region": "region",
    "command_region_description": "Set your voice chat's region",
    "command_region_param_country": "country",
    "command_region_param_country_description": "Where you want the voice chat to be hosted",

    "command_region_param_country_option_automatic": "Automatic",
    "command_region_param_country_option_brazil": "Brazil",
    "command_region_param_country_option_hongkong": "Hong Kong",
    "command_region_param_country_option_india": "India",
    "command_region_param_country_option_japan": "Japan",
    "command_region_param_country_option_rotterdam": "Rotterdam",
    "command_region_param_country_option_russia": "Russia",
    "command_region_param_country_option_singapore": "Singapore",
    "command_region_param_country_option_southafrica": "South Africa",
    "command_region_param_country_option_sydney": "Sydney",
    "command_region_param_country_option_uscentral": "US Central",
    "command_region_param_country_option_useast": "US East",
    "command_region_param_country_option_ussouth": "US South",
    "command_region_param_country_option_uswest": "US West",

    "command_region_log_name": "VC region changed",
    "command_region_channel_moved": "Your channel has been moved to %1$s",

    // /register
    "command_register": "register",
    "command_register_description": "Register a channel for cloning",
    "command_register_param_vc": "vc",
    "command_register_param_vc_description": "The voice channel you wish to make cloneable",
    "command_register_param_name": "name",
    "command_register_param_name_description": "Set a custom name.  Place {count} where you would like the count positioned.",
    "command_register_param_info": "info",
    "command_register_param_info_description": "The text channel to give users instructions in",
    "command_register_param_permissions": "permissions",
    "command_register_param_permissions_description": "Treat this role as the max permissions allowed for private VCs",
    "command_register_param_ispublic": "ispublic",
    "command_register_param_ispublic_description": "Sets the channel to start as public or private.  Defaults to private.",
    "command_register_param_publicpermissions": "publicpermissions",
    "command_register_param_publicpermissions_description": "Treat this role as the max permissions allowed for public VCs",
    "command_register_param_rename": "rename",
    "command_register_param_rename_description": "Whether or not to allow users to rename the voice channel",
    "command_register_log_name": "Mod registered clone VC",
    "command_register_channel_must_be_voice": "VC parameter needs a voice channel",
    "command_register_name_too_long": "Name of the channel must be 28 characters or less.",

    "command_register_info": 
`Registered <#%1$s> for cloning.
New channels will be created with the template "%2$s".
The "%3$s" role will be the upper limit for permissions when a channel is private.
The "%4$s" role will be the upper limit for permissions when a channel is public."`,
    "command_register_instructions_channel": "Users will be notified in <#%1$s> of what to do.",
    "command_register_rename_channel": "**Users will be allowed to rename this channel.** A default blacklist will be applied. Consider adding to the `/blacklist`.",

    // /remove
    "command_remove": "remove",
    "command_remove_description": "Remove a user from this channel",
    "command_remove_param_user": "user",
    "command_remove_param_user_description": "The user you would like remove from this channel",
    "command_remove_log_name": "User removed from VC",
    "command_remove_bots_cannot_be_removed": "Bots cannot be removed from voice chat",
    "command_mods_cannot_be_removed": "Moderators cannot be removed by commands",
    "command_remove_user_removed": "%1$s#%2$s has been removed",

    // /unregister
    "command_unregister": "unregister",
    "command_unregister_description": "Un-register a channel for cloning",
    "command_unregister_param_vc": "vc",
    "command_unregister_param_vc_description": "The voice channel to stop cloning",
    "command_unregister_log_name": "Mod unregistered clone VC",
    "command_unregister_success": "Un-registered <#%1$s> for cloning",

    // voiceStateUpdate
    "voicestateupdate_user_left_log_name": "User left VC",
    "voicestateupdate_user_left_log_description": "<@%1$s> left %2$s",
    "voicestateupdate_rate_limited": "<@%1$s> please wait a few minutes before trying to create a new voice chat",
    "voicestateupdate_rate_limited_log_name": "Join cooldown in effect",
    "voicestateupdate_rate_limited_log_description": "<@%1$s> tried to create a VC, but hit cooldown",
    "voicestateupdate_user_created_vc_log_name": "User created VC",
    "voicestateupdate_user_created_vc_log_description": "<@%1$s> created %2$s",
    "voicestateupdate_how_to_use_dittovc": 
`<@%1$s>
__How to use DittoVC__
/info
> See the detailed help message.

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
> Sets the region the voice chat is hosted in.`,

    "voicestateupdate_user_joined_vc_log_name": "User joined VC",
    "voicestateupdate_user_joined_vc_log_description": "<@%1$s> joined %2$s"
};

// WARNING: DO NOT EDIT ANYTHING BELOW THIS LINE

/**
 * 
 * @param {string} key The key to use to find the appropriate text
 * @param {string} defaultText The default text if a key is not found (this should never be used, and is more for reference purposes in debugging.)
 * @returns The correctly translated text for the key
 */
function language(key, defaultText) {
    const args = [...arguments].slice(2);

    if (text[key]) return vsprintf(text[key], args);

    if (strict) throw `Lang text missing for en-US. Key: ${key}. Default Text: ${defaultText}`;

    return vsprintf(defaultText, args);
}

module.exports = {
    language,
    text
};