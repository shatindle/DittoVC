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
    "command_user_used": "<@%1$s> が %2$s を使用しました。",
    "command_you_need_manage_channels_permission": "このコマンドを使用するには「チャンネルの管理」権限が必要です。",
    "command_you_dont_own_vc": "ボイスチャンネルを持っていません。増設できるボイスチャンネルに入ってボイスチャンネルを取得してください。",
    "generic_error": "このコマンドを実行した際、エラーが発生しました。",

    // /add
    "command_add": "招待",
    "command_add_description": "ユーザーにこのチャンネルへのアクセス権を付与する。",
    "command_add_param_user": "ユーザー",
    "command_add_param_user_description": "招待したいユーザー",
    "command_add_param_permissions": "権限",
    "command_add_param_permissions_description": "ユーザーに付与したい権限",
    "command_add_param_permissions_option_all": "全ての権限",
    "command_add_param_permissions_option_speak": "発声権限",
    "command_add_param_permissions_option_text": "テキスト権限",
    "command_add_param_permissions_option_listen": "聴取権限",
    "command_add_log_name": "ユーザーはボイスチャンネルに招待されました。",
    "command_add_bot_error": "ボットはボイスチャンネルに招待できません。",
    "command_add_already_have_access": "あなたは既にアクセス権を持っています。",
    "command_add_mod_has_access": "このモデレーターは既にアクセス権を持っています。",
    "command_add_user_can_join": "<@%1$s>が<#%2$s>に入れるようになりました。",

    // /blacklist
    "command_blacklist": "ブラックリスト",
    "command_blacklist_description": "サーバーのブラックリストを管理する",
    "command_blacklist_param_add": "登録",
    "command_blacklist_param_add_description": "単語をブラックリストに登録する",
    "command_blacklist_param_add_param_word": "単語",
    "command_blacklist_param_add_param_word_description": "ブラックリストに登録したい単語",
    "command_blacklist_param_remove": "外す",
    "command_blacklist_param_remove_description": "単語をブラックリストから外す",
    "command_blacklist_param_remove_param_word": "単語",
    "command_blacklist_param_remove_param_word_description": "ブラックリストから外したい単語",
    "command_blacklist_param_list": "一覧",
    "command_blacklist_param_list_description": "サーバーのブラックリスト一覧を表示する",
    "command_blacklist_log_name": "ブラックリストコマンド",
    "command_blacklist_limit_exceeded": "ブラックリストの上限を超えました。%1$s 件以上",
    "command_blacklist_word_added_to_list": "「%1$s」がブラックリストに登録されました。",
    "command_blacklist_invalid_word": "入力した単語は無効です。1文字以上32文字以内で登録してください。",
    "command_blacklist_word_removed_from_list": "「%1$s」はブラックリストから外されました。",
    "command_blacklist_words_in_list": "**Words in your blacklist:** \n%1$s\n\n*More items are in the blacklist. See %2$s*",
    "command_blacklist_unknown": "不明なブラックリストコマンド",

    // /claim
    "command_claim": "取得",
    "command_claim_description": "ボイスチャンネルの管理者が居なくなった際、このコマンドを使用すると、ボイスチャンネルの管理権限を取得できます。",
    "command_claim_log_name": "ユーザーはボイスチャンネルの管理権を取得しようとした。",
    "command_claim_already_own_channel": "あなたは既にこのボイスチャンネルの管理者です。",
    "command_claim_owner_still_in_channel": "このボイスチャンネルの管理者がまだ居る限り、ボイスチャンネルの管理権を取得できません。",
    "command_claim_you_are_now_owner": "あなたはこのボイスチャンネルの管理者になりました。",
    "command_claim_you_must_be_in_voice_chat": "管理者が居ないボイスチャンネルに入らない限り、ボイスチャンネルの管理権を取得できません。",

    // /delete
    "command_delete": "削除",
    "command_delete_description": "管理している部屋を削除",
    "command_delete_log_name": "部屋が削除されました。",
    "command_delete_channel_deleted": "部屋が削除されました。",

    // /info
    "command_info": "情報",
    "command_info_description": "このボットについての情報や管理者コマンド一覧を表示する。",
    "command_info_log_name": "ユーザーはヘルプを使用しました。",

    "command_info_how_to_use_dittovc": 
`__How to use DittoVC__
/add user:username#0000 permissions:(All, Speak, or Listen)
> Adds the user to the voice chat, defaults to all allowed permissions.

/remove user:username#0000
> Prevents a user from joining the voice chat and removes them from the voice chat if they are currently in it.

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
> Register a voice channel for cloning. Info and permissions are optional. Use info to specify a text channel where instructions will be sent to the user creating a voice chat. Use permissions to specify a role to control the maximum permissions a user is allowed to have. For instance, if you do not want to allow streaming in your server, make a role that restricts streaming permissions on the channel, then register the voice channel specifying permissions:@YourRole. Streaming would then be restricted on that voice channel for everyone, including the owner. Use ispublic to start a voice chat as public. Defaults to private. Name must be less than 29 characters, and can include a special {count} variable that will be replaced with the next available channel number. Use rename to allow users to rename this voice chat. A word filter will be applied.  Use nofilter to disable the word filter.

/unregister vc:voice-channel
> Unregister a voice channel for cloning.

/log to:text-channel
> Log all commands, creations, joins, and leaves for this server to a channel.`,

    // /log
    "command_log": "ログ",
    "command_log_description": "ログを残すチャンネルを設定する。解除したい場合は to:を空白にしてください。",
    "command_log_param_to": "チャンネル",
    "command_log_param_to_description": "ログを残すチャンネル。ボットが該当チャンネルにアクセス出来るようにしてください。",
    "command_log_not_a_text_channel": "<#%1$s>はテキストチャンネルではありません。再度コマンドを入力して、テキストチャンネルを選択してください。",
    "command_log_need_send_messages": "Please grant me SEND_MESSAGES in <#%1$s>, then try again",
    "command_log_will_log_to": "I will now log joins, leaves, and commands to <#%1$s>",
    "command_log_log_name": "ログが有効です。",
    "command_log_disabled": "ログが無効になりました。",

    // /max
    "command_max": "最大",
    "command_max_name": "最大",
    "command_max_description": "ボイスチャンネルの人数を制限する",
    "command_max_param_limit": "制限",
    "command_max_param_limit_description": "The maximum number of people you wish to join the voice chat",
    "command_max_log_name": "ユーザーは最大人数を変更しました。",
    "command_max_greater_than_zero": "0以上の数字を設定してください。",
    "command_max_less_than_one_hundred": "100未満の数字を設定してください。",
    "command_max_limit_removed": "<#%1$s> の人数制限がなくなりました。",
    "command_max_limit_set": "<#%1$s> の最大人数が %2$s に変更されました。",

    // /name
    "command_name": "名前", 
    "command_name_description": "ボイスチャンネル名前を変更、名前を一度変更するとボイスチャンネルを新しく作り直すまで名前を再度変更できません。",
    "command_name_param_it": "名前",
    "command_name_param_it_description": "設定したいボイスチャンネル名",
    "command_name_log_name": "ボイスチャンネル名が設定されました。",
    "command_name_please_specify": "ボイスチャンネル名を入力してください。",
    "command_name_too_long": "名前は33字未満で設定してください。",
    "command_name_renaming_disabled": "ボイスチャンネル名の設定は無効されてます。",
    "command_name_already_named": "ボイスチャンネル名は既に変更されてます。",
    "command_name_already_named_wait": "ボイスチャンネル名は既に変更されてます。%1$s 待ってから再度決めてください。",
    "command_name_renamed": "ボイスチャンネルの名前が",

    // /private
    "command_private": "プライベート",
    "command_private_name": "プライベート",
    "command_private_description": "このチャンネルをプライベートにする。",
    "command_private_log_name": "ユーザーがボイスチャンネルをプライベートにしました。",
    "command_private_only_members_can_join": "招待したメンバーだけが<#%1$s>に入れます。",

    // /public
    "command_public": "パブリック",
    "command_public_name": "パブリック",
    "command_public_description": "このチャンネルをパブリックにする。",
    "command_public_log_name": "ユーザーがボイスチャンネルをパブリックにしました。",
    "command_public_everyone_can_join": "みんなが<#%1$s>に入れるようになりました。",

    // /region
    "command_region": "音声地域",
    "command_region_description": "ボイスチャンネルの音声地域を設定する。",
    "command_region_param_country": "国",
    "command_region_param_country_description": "ボイスチャンネルの音声地域をどこにしますか？",

    "command_region_param_country_option_automatic": "自動",
    "command_region_param_country_option_brazil": "ブラジル",
    "command_region_param_country_option_hongkong": "香港",
    "command_region_param_country_option_india": "インド",
    "command_region_param_country_option_japan": "日本",
    "command_region_param_country_option_rotterdam": "ロッテルダム",
    "command_region_param_country_option_russia": "ロシア",
    "command_region_param_country_option_singapore": "シンガポール",
    "command_region_param_country_option_southafrica": "南アフリカ",
    "command_region_param_country_option_sydney": "シドニー",
    "command_region_param_country_option_uscentral": "アメリカ中部",
    "command_region_param_country_option_useast": "アメリカ東部",
    "command_region_param_country_option_ussouth": "アメリカ南部",
    "command_region_param_country_option_uswest": "アメリカ西部",

    "command_region_log_name": "ボイスチャンネルの音声地域を変更しました。",
    "command_region_channel_moved": "ボイスチャンネルの音声地域が%1$sになりました。",

    // /register
    "command_register": "登録",
    "command_register_description": "増設できるボイスチャンネルを登録する。",
    "command_register_param_vc": "ボイスチャンネル",
    "command_register_param_vc_description": "増設できるようにしたいボイスチャンネル",
    "command_register_param_name": "名前",
    "command_register_param_name_description": "Set a custom name.  Place {count} where you would like the count positioned.",
    "command_register_param_info": "info",
    "command_register_param_info_description": "The text channel to give users instructions in",
    "command_register_param_permissions": "権限",
    "command_register_param_permissions_description": "Treat this role as the max permissions allowed for private VCs",
    "command_register_param_ispublic": "ispublic",
    "command_register_param_ispublic_description": "Sets the channel to start as public or private.  Defaults to private.",
    "command_register_param_publicpermissions": "publicpermissions",
    "command_register_param_publicpermissions_description": "Treat this role as the max permissions allowed for public VCs",
    "command_register_param_rename": "rename",
    "command_register_param_rename_description": "Whether or not to allow users to rename the voice channel",
    "command_register_param_nofilter": "nofilter",
    "command_register_param_nofilter_description": "Turn off the word filter for channel names.  Default is false.  True is not recommended.",
    "command_register_param_ping": "メンション",
    "command_register_param_ping_description": "Whether or not to ping users added to a channel.  Default is True.",
    "command_register_param_setmax": "setmax",
    "command_register_param_setmax_description": "Allow users to adjust the max number of users in a channel.  Default is True.",
    "command_register_log_name": "Mod registered clone VC",
    "command_register_channel_must_be_voice": "VC parameter needs a voice channel",
    "command_register_name_too_long": "Name of the channel must be 28 characters or less.",
    "command_register_nofilter_channel": "**Users will be allowed to rename this channel.** You have disabled the word filter for this cloneable channel. __You are responsible for your users and your server in the event your users name the channel something that breaks Discord's TOS and results in action against your server and the owner's account.__ It is strongly recommended that you re-register the cloneable channel with the word filter enabled with \"nofilter\" set to False (the default value).",

    "command_register_info": 
`Registered <#%1$s> for cloning.
New channels will be created with the template "%2$s".
The "%3$s" role will be the upper limit for permissions when a channel is private.
The "%4$s" role will be the upper limit for permissions when a channel is public."`,
    "command_register_instructions_channel": "Users will be notified in <#%1$s> of what to do.",
    "command_register_rename_channel": "**Users will be allowed to rename this channel.** A default blacklist will be applied. Consider adding to the `/blacklist`.",

    // /remove
    "command_remove": "退出",
    "command_remove_description": "ボイスチャンネル内のユーザーを退出させる",
    "command_remove_param_user": "ユーザー",
    "command_remove_param_user_description": "退出させたいユーザー",
    "command_remove_log_name": "ユーザーは退出させられました。",
    "command_remove_bots_cannot_be_removed": "ボイスチャンネル内のボットは退出させられません。",
    "command_mods_cannot_be_removed": "コマンドでモデレーターを退出させられません。",
    "command_remove_user_removed": "%1$s#%2$s が退出させられました。",

    // /unregister
    "command_unregister": "unregister",
    "command_unregister_description": "Un-register a channel for cloning",
    "command_unregister_param_vc": "vc",
    "command_unregister_param_vc_description": "The voice channel to stop cloning",
    "command_unregister_log_name": "Mod unregistered clone VC",
    "command_unregister_success": "Un-registered <#%1$s> for cloning",

    // voiceStateUpdate
    "voicestateupdate_user_left_log_name": "ユーザーがボイスチャンネルから抜けました。",
    "voicestateupdate_user_left_log_description": "<@%1$s> が %2$s から抜けました。",
    "voicestateupdate_rate_limited": "<@%1$s> 、数分待ってから新しいボイスチャンネルを作成してください。",
    "voicestateupdate_rate_limited_log_name": "Join cooldown in effect",
    "voicestateupdate_rate_limited_log_description": "<@%1$s> tried to create a VC, but hit cooldown",
    "voicestateupdate_user_created_vc_log_name": "ユーザーはボイスチャンネルを作成しました。",
    "voicestateupdate_user_created_vc_log_description": "<@%1$s> が %2$s を作成しました。",
    "voicestateupdate_how_to_use_dittovc_vc_created": "<@%1$s> 、ボイスチャンネル <#%2$s> が作成されました！ ",
    "voicestateupdate_how_to_use_dittovc_vc_is_public": "Your channel is currently public. Anyone can join your channel, but if you want to make it private simply run the `/private` command so that people can only join if you invite them via `/add`. If you change your mind, you can make it public again using `/public`.",
    "voicestateupdate_how_to_use_dittovc_vc_is_private": "Your channel is currently private. To invite people to your channel, use the `/add` command and type the username of the user you want to invite. If you want anyone to be able to join your channel, you can make it public using `/public`. If you change your mind, you can make it private again using `/private`.",
    "voicestateupdate_how_to_use_dittovc_vc_rename": "You can rename your voice channel to something else if you'd like! Use the `/name` command to set the name of your voice channel.",
    "voicestateupdate_how_to_use_dittovc_vc_delete": "When you're done with your voice channel, use the `/delete` command to delete it. If you leave the voice channel while other people are in there, they can claim ownership of the voice channel using `/claim` and manage the channel themselves. Alternatively, you can give it to someone else before leaving using the `/give` command.",
    "voicestateupdate_how_to_use_dittovc_vc_more_info": "To see the list of all commands the bots supports, run `/info`.",

    "voicestateupdate_user_joined_vc_log_name": "ユーザーがボイスチャンネルに入りました。",
    "voicestateupdate_user_joined_vc_log_description": "<@%1$s> が %2$s に入りました。",

    "command_menu": "メニュー",
    "command_menu_description": "Create a static controls menu",
    "command_menu_param_channel": "channel",
    "command_menu_param_channel_description": "The channel to make the command menu in",
    "command_menu_param_instructions": "instructions",
    "command_menu_param_instructions_description": "Override the default instructions",
    "command_menu_param_public": "public",
    "command_menu_param_public_description": "Override the default Public button text",
    "command_menu_param_private": "private",
    "command_menu_param_private_description": "Override the default Private button text",
    "command_menu_param_max": "max",
    "command_menu_param_max_description": "Override the default Max button text",
    "command_menu_log_name": "Mod created control menu",
    "command_menu_click_here_to_control": "Join a new voice chat, then use this menu to control it! More commands are available via slash commands. Do /info to learn more.",

    "command_private_button_click": "プライベートボタンを押しました。",
    "command_public_button_click": "パブリックボタンを押しました。",

    "command_max_modal_log_name": "User loaded 'max' modal",
    "command_max_modal_description": "Clicked button 'max'",
    "command_max_modal_title": "ユーザー上限を設定する",
    "command_max_modal_param_limit": "ユーザー上限",

    "command_max_modalsubmit_log_name": "User submitted max modal",
    "command_max_modalsubmit_description": "Submitted max modal",
    "command_max_modal_response_not_numbers": "ユーザー上限は0〜99人までにしてください。",
    "command_max_not_allowed": "This channel does not support setting a max",

    "command_menu_success": "メニューが作成されました。",
    "channel_cleanup": "Channel Cleanup",
    "channel_cleanup_description": "Channel '%1$s' has been cleaned up",
    "vc_creation_permission_error_title": "部屋の増設中にエラーが発生しました。",
    "vc_creation_permission_error_description": "<@%1$s> tried to create a VC using <#%2$s>, but the bot encountered this error before the channel was fully cloned: %3$s\n\nMake sure you have explicitly given the bot these permissions: %4$s",

    // /give
    "command_give": "譲渡",
    "command_give_description": "自分のボイスチャンネルの管理権を他ユーザーに譲渡する。",
    "command_give_param_to": "ユーザー",
    "command_give_param_to_description": "ボイスチャンネルの新しい管理者",
    "command_give_log_name": "User tried to give their VC to someone else",
    "command_give_target_not_in_server": "ユーザーはこのサーバーにいないため、管理権の譲渡ができません。",
    "command_give_already_owner": "ボイスチャンネルは自分に譲渡できません。",
    "command_give_bot_error": "ボットに管理権を譲渡できません。",
    "command_give_you_are_now_owner": "<@%2$s>のボイスチャンネルは<@%1$s>に譲渡されました。",
    "command_give_you_must_be_in_voice_chat": "自分が管理権を持つボイスチャンネルしか譲渡できません。",
    "command_give_target_not_in_vc": "ユーザーはこのチャンネルにいないため、管理権の譲渡ができません。"

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

    if (strict) throw `Lang text missing for ja. Key: ${key}. Default Text: ${defaultText}`;

    return vsprintf(defaultText, args);
}

module.exports = {
    language,
    text
};