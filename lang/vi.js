const { vsprintf } = require("sprintf-js");

/**
 * This is used for debugging purposes. Set to false if you're missing a key. In production, this should always be set to true.
 */
const strict = true;

// TODO: translate the values.  
// Examples: 
// "command_user_used" is the key, "<@%1$s> used:\n %2$s" might become "<@%1$s> đã sử dụng:\n %2$s"
// "command_you_need_manage_channels_permission" is the key, "You need the MANAGE_CHANNELS permission to run this command" might become "Bạn cần quyền MANAGE_CHANNELS để chạy lệnh này"

/**
 * All of the following text is what needs to be translated to other locales.  en-US is done as an example.
 */
 const text = {
    // interactions:

    // generic commands
    "command_user_used": "<@%1$s> đã sử dụng:\n %2$s",
    "command_you_need_manage_channels_permission": "Bạn cần quyền MANAGE_CHANNELS để chạy lệnh này",
    "command_you_dont_own_vc": "Bạn không sở hữu một kênh thoại. Tham gia cuộc trò chuyện thoại có thể sao chép để yêu cầu nó",
    "generic_error": "Đã xảy ra lỗi khi thực hiện lệnh này!",

    // /add
    "command_add": "add",
    "command_add_description": "Cấp cho người dùng quyền truy cập vào kênh này",
    "command_add_param_user": "user",
    "command_add_param_user_description": "Người dùng bạn muốn mời",
    "command_add_param_permissions": "permissions",
    "command_add_param_permissions_description": "Quyền bạn muốn cấp cho người dùng",
    "command_add_param_permissions_option_all": "All",
    "command_add_param_permissions_option_speak": "speak",
    "command_add_param_permissions_option_text": "text",
    "command_add_param_permissions_option_listen": "listen",
    "command_add_log_name": "Người dùng đã được thêm vào VC",
    "command_add_bot_error": "Không thể mời bot tham gia trò chuyện thoại",
    "command_add_already_have_access": "Bạn đã có quyền truy cập",
    "command_add_mod_has_access": "Người kiểm duyệt này đã có quyền truy cập",
    "command_add_user_can_join": "<@%1$s> bây giờ có thể tham gia <#%2$s>",

    // /blacklist
    "command_blacklist": "blacklist",
    "command_blacklist_description": "Quản lý danh sách đen máy chủ. Lưu ý rằng danh sách đen mặc định sẽ được áp dụng",
    "command_blacklist_param_add": "add",
    "command_blacklist_param_add_description": "Thêm một từ vào danh sách đen",
    "command_blacklist_param_add_param_word": "word",
    "command_blacklist_param_add_param_word_description": "Từ để thêm vào danh sách đen",
    "command_blacklist_param_remove": "remove",
    "command_blacklist_param_remove_description": "Xóa một từ vào danh sách đen",
    "command_blacklist_param_remove_param_word": "word",
    "command_blacklist_param_remove_param_word_description": "Từ để xóa khỏi danh sách đen",
    "command_blacklist_param_list": "list",
    "command_blacklist_param_list_description": "Hiển thị danh sách đen của máy chủ của bạn",
    "command_blacklist_log_name": "Blacklist command",
    "command_blacklist_limit_exceeded": "Đã vượt quá giới hạn danh sách đen: kết thúc %1$s Hồ sơ",
    "command_blacklist_word_added_to_list": "\"%1$s\" được thêm vào danh sách đen",
    "command_blacklist_invalid_word": "Từ không hợp lệ. Các từ phải lớn hơn 1 ký tự và ít hơn 33 ký tự",
    "command_blacklist_word_removed_from_list": "\"%1$s\" bị xóa khỏi danh sách đen",
    "command_blacklist_words_in_list": "**Các từ trong danh sách đen của bạn:** \n%1$s\n\n*Nhiều mặt hàng nằm trong danh sách đen. Nhìn thấy %2$s*",
    "command_blacklist_unknown": "Lệnh danh sách đen không xác định",

    // /claim
    "command_claim": "claim",
    "command_claim_description": "Nếu chủ sở hữu đã rời khỏi cuộc trò chuyện thoại, hãy sử dụng lệnh này để kiểm soát kênh",
    "command_claim_log_name": "Người dùng đã cố gắng xác nhận một VC",
    "command_claim_already_own_channel": "Bạn đã sở hữu kênh này",
    "command_claim_owner_still_in_channel": "Chính chủ vẫn còn trong kênh. Bạn không thể yêu cầu nó",
    "command_claim_you_are_now_owner": "Bạn hiện là chủ sở hữu của kênh này",
    "command_claim_you_must_be_in_voice_chat": "Bạn phải tham gia cuộc trò chuyện thoại do người dùng sở hữu mà chủ sở hữu đã để lại để xác nhận quyền sở hữu",

    // /delete
    "command_delete": "delete",
    "command_delete_description": "Xóa kênh bạn sở hữu",
    "command_delete_log_name": "VC deleted",
    "command_delete_channel_deleted": "Kênh của bạn đã bị xóa",

    // /info
    "command_info": "info",
    "command_info_description": "Nhận thông tin về bot này, bao gồm các lệnh mod",
    "command_info_log_name": "Người dùng đã yêu cầu trợ giúp",

    "command_info_how_to_use_dittovc": 
`__Cách sử dụng bot tạo phòng__
/add user:username#0000 permissions:(All, Speak, or Listen)
> Thêm người dùng vào kênh thoại, mặc định cho tất cả các quyền.
/remove user:username#0000
> Xóa người dùng khỏi kênh thoại.
/public
> Đặt cuộc trò chuyện thoại của bạn ở chế độ công khai.
/private
> Đặt cuộc trò chuyện thoại của bạn ở chế độ riêng tư.
/max limit:number
> Đặt số lượng người dùng tối đa. 0 loại bỏ giới hạn. Vẫn hoạt động nếu kênh là công khai hoặc riêng tư.
/name it:text
> Đặt tên cho cuộc trò chuyện thoại của bạn.
/claim
> Tiếp quản quyền sở hữu kênh sau khi chủ sở hữu đã rời đi.
/delete
> Xóa kênh thoại do bạn sở hữu.
/region
> Chuyển vùng kênh thoại.
/info
> Hiển thị thông báo trợ giúp này.
__Mod Commands__
/register vc:voice-channel info:text-channel permissions:role publicpermissions:role ispublic:boolean name:text rename:boolean nofilter:boolean
> Register a voice channel for cloning. Info and permissions are optional. Use info to specify a text channel where instructions will be sent to the user creating a voice chat. Use permissions to specify a role to control the maximum permissions a user is allowed to have. For instance, if you do not want to allow streaming in your server, make a role that restricts streaming permissions on the channel, then register the voice channel specifying permissions:@YourRole. Streaming would then be restricted on that voice channel for everyone, including the owner. Use ispublic to start a voice chat as public. Defaults to private. Name must be less than 29 characters, and can include a special {count} variable that will be replaced with the next available channel number. Use rename to allow users to rename this voice chat. A word filter will be applied.  Use nofilter to disable the word filter.
/unregister vc:voice-channel
> Unregister a voice channel for cloning.
/log to:text-channel
> Log all commands, creations, joins, and leaves for this server to a channel.`,

    // /log
    "command_log": "log",
    "command_log_description": "Chỉ định một kênh để ghi nhật ký. Để tắt ghi nhật ký, không đặt \"to\" tham số",
    "command_log_param_to": "to",
    "command_log_param_to_description": "Kênh để sử dụng để ghi nhật ký. Đảm bảo rằng bot có quyền truy cập vào nó!",
    "command_log_not_a_text_channel": "<#%1$s> không phải là một kênh văn bản. Vui lòng chỉ định kênh văn bản, sau đó thử lại",
    "command_log_need_send_messages": "Vui lòng cấp cho tôi SEND_MESSAGES trong <#%1$s>, sau đó thử lại",
    "command_log_will_log_to": "Bây giờ tôi sẽ ghi nhật ký các phép nối, rời và lệnh tới <#%1$s>",
    "command_log_log_name": "Logging enabled",
    "command_log_disabled": "Ghi nhật ký cho máy chủ này đã bị vô hiệu hóa",

    // /max
    "command_max": "max",
    "command_max_description": "Đặt kênh này giới hạn ở một số lượng người dùng nhất định",
    "command_max_param_limit": "limit",
    "command_max_param_limit_description": "Số người tối đa bạn muốn tham gia trò chuyện thoại",
    "command_max_log_name": "Người dùng đã thay đổi người dùng tối đa",
    "command_max_greater_than_zero": "Bạn phải chỉ định giới hạn lớn hơn hoặc bằng 0",
    "command_max_less_than_one_hundred": "Bạn phải chỉ định giới hạn nhỏ hơn 100",
    "command_max_limit_removed": "Giới hạn người tham gia cho <#%1$s> đã bị loại bỏ",
    "command_max_limit_set": "The max participants for <#%1$s> bây giờ được đặt thành %2$s",

    // /name
    "command_name": "name", 
    "command_name_description": "Đặt tên cho cuộc trò chuyện thoại của bạn! Sau khi bạn đặt tên, bạn không thể thay đổi nó.",
    "command_name_param_it": "it",
    "command_name_param_it_description": "Tên bạn muốn đặt cho VC của mình",
    "command_name_log_name": "VC named",
    "command_name_please_specify": "Vui lòng chỉ định một tên để sử dụng",
    "command_name_too_long": "Vui lòng chỉ định tên ít hơn 33 ký tự",
    "command_name_renaming_disabled": "Đổi tên kênh thoại bị tắt",
    "command_name_already_named": "Bạn đã đặt tên cho cuộc trò chuyện thoại của mình",
    "command_name_already_named_wait": "Bạn đã đặt tên cho cuộc trò chuyện thoại của mình. Vui lòng đợi %1$s trước khi thử lại.",
    "command_name_renamed": "Kênh của bạn đã được đổi tên",

    // /private
    "command_private": "private",
    "command_private_description": "Đặt kênh này ở chế độ riêng tư",
    "command_private_log_name": "Người dùng đã đặt VC ở chế độ riêng tư",
    "command_private_only_members_can_join": "Chỉ những thành viên bạn mời mới có thể tham gia <#%1$s>",

    // /public
    "command_public": "public",
    "command_public_description": "Đặt kênh này ở chế độ công khai",
    "command_public_log_name": "Người dùng đã đặt VC ở chế độ công khai",
    "command_public_everyone_can_join": "Mọi người hiện có thể tham gia <#%1$s>",

    // /region
    "command_region": "region",
    "command_region_description": "Đặt khu vực trò chuyện thoại của bạn",
    "command_region_param_country": "country",
    "command_region_param_country_description": "Nơi bạn muốn cuộc trò chuyện thoại được lưu trữ",

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

    "command_region_log_name": "Khu vực VC đã thay đổi",
    "command_region_channel_moved": "Kênh của bạn đã được chuyển đến %1$s",

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
    "command_register_param_nofilter": "nofilter",
    "command_register_param_nofilter_description": "Turn off the word filter for channel names.  Default is false.  True is not recommended.",
    "command_register_param_ping": "ping",
    "command_register_param_ping_description": "Whether or not to ping users added to a channel.  Default is True.",
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
    "command_remove": "remove",
    "command_remove_description": "Xóa người dùng khỏi kênh này",
    "command_remove_param_user": "user",
    "command_remove_param_user_description": "Người dùng bạn muốn xóa khỏi kênh này",
    "command_remove_log_name": "Người dùng đã bị xóa khỏi VC",
    "command_remove_bots_cannot_be_removed": "Không thể xóa bot khỏi trò chuyện thoại",
    "command_mods_cannot_be_removed": "Moderators không thể loại bỏ khỏi kênh này",
    "command_remove_user_removed": "%1$s#%2$s đã bị xoá khỏi kênh thoại",

    // /unregister
    "command_unregister": "unregister",
    "command_unregister_description": "Un-register a channel for cloning",
    "command_unregister_param_vc": "vc",
    "command_unregister_param_vc_description": "The voice channel to stop cloning",
    "command_unregister_log_name": "Mod unregistered clone VC",
    "command_unregister_success": "Un-registered <#%1$s> for cloning",

    // voiceStateUpdate
    "voicestateupdate_user_left_log_name": "Người dùng đã rời khỏi VC",
    "voicestateupdate_user_left_log_description": "<@%1$s> rời khỏi %2$s",
    "voicestateupdate_rate_limited": "<@%1$s> vui lòng đợi một vài phút trước khi cố gắng tạo một cuộc trò chuyện thoại mới",
    "voicestateupdate_rate_limited_log_name": "Tham gia cooldown có hiệu lực",
    "voicestateupdate_rate_limited_log_description": "<@%1$s> đã cố gắng tạo một VC, nhưng lại gặp phải giới hạn thời gian",
    "voicestateupdate_user_created_vc_log_name": "Người dùng đã tạo VC",
    "voicestateupdate_user_created_vc_log_description": "<@%1$s> tạo %2$s",
    "voicestateupdate_how_to_use_dittovc": 
`<@%1$s>
__Cách sử dụng bot tạo phòng riêng__
/info
> Xem trợ giúp chi tiết.
/add user:username#0000 permissions:(All, Speak, or Listen)
> Thêm người dùng vào kênh thoại, mặc định cho tất cả các quyền được phép.
/remove user:username#0000
> Xóa người dùng khỏi cuộc trò chuyện thoại.
/public
> Đặt kênh thoại của bạn ở chế độ công khai.
/private
> Đặt kênh thoại của bạn ở chế độ riêng tư.
/max limit:number
> Đặt số lượng người dùng tối đa. 0 loại bỏ giới hạn.
/name it:text
> Đặt tên cho cuộc trò chuyện thoại của bạn.
/claim
> Tiếp quản quyền sở hữu kênh sau khi chủ sở hữu đã rời đi.
/delete
> Xóa kênh thoại do bạn sở hữu.
/region
> Đặt khu vực trò chuyện thoại được lưu trữ.`,

    "voicestateupdate_user_joined_vc_log_name": "Người dùng đã tham gia VC",
    "voicestateupdate_user_joined_vc_log_description": "<@%1$s> đã tham gia %2$s",

    "command_menu": "menu",
    "command_menu_description": "Tạo menu điều khiển tĩnh",
    "command_menu_param_channel": "channel",
    "command_menu_param_channel_description": "Kênh để tạo menu lệnh trong",
    "command_menu_log_name": "Người điều hành đã tạo menu điều khiển",
    "command_menu_click_here_to_control": "Tham gia một cuộc trò chuyện thoại mới, sau đó sử dụng menu này để điều khiển nó! Có nhiều lệnh hơn thông qua các lệnh gạch chéo. Làm /info để tìm hiểu thêm.",

    "command_private_button_click": "Đã nhấp vào nút 'private'",
    "command_public_button_click": "Đã nhấp vào nút 'public'",

    "command_max_modal_log_name": "Phương thức 'max' do người dùng tải",
    "command_max_modal_description": "Đã nhấp vào nút 'max'",
    "command_max_modal_title": "Đặt người dùng tối đa cho cuộc trò chuyện thoại của bạn",
    "command_max_modal_param_limit": "Số lượng người dùng tối đa",

    "command_max_modalsubmit_log_name": "Người dùng đã gửi phương thức 'max'",
    "command_max_modalsubmit_description": "Đã gửi phương thức tối đa",
    "command_max_modal_response_not_numbers": "Giới hạn phải là một số từ 0 đến 99",

    "command_menu_success": "Đã tạo menu thành công!",
    "channel_cleanup": "Dọn kênh",
    "channel_cleanup_description": "Kênh '%1$s' đã được dọn dẹp"
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