# DittoVC

## tl;dr

If you're just interested in the invite link, you can invite the bot [here](https://discord.com/api/oauth2/authorize?client_id=940796178302378074&permissions=275178867216&scope=bot%20applications.commands).

## How it works
Basically:
- 1 unmuted chat
- person joins
- bot clones current chat and renames current chat
- bot restricts current chat to the primary + Mod role(s)
- bot @ mentions the user with instructions
- user issues command to invite or make it public
- when all have left, bot deletes the vc

## Video Demonstration

https://user-images.githubusercontent.com/3068117/162594640-a34de634-cb75-4e42-8954-94fb9ac2bf7e.mp4

## Channel Owner Commands
/add user:username#0000 permissions:(All, Speak, or Listen)
- Adds the user to the voice chat, defaults to all allowed permissions.

/remove user:username#0000
- Remove the user from the voice chat.

/public
- Make your voice chat public.

/private
- Make your voice chat private.

/max limit:number
- Set a max number of users. 0 removes the limit. Still respects if the channel is public or private.

/name it:text
- Give your voice chat a name.

/claim
- Take over ownership of a channel after the owner has left.

/delete
- Delete your owned voice chat.

/region
- Sets the region the voice chat is hosted in.

/info
- Display this help message.

## Mod Commands
/register vc:voice-channel info:text-channel permissions:role publicpermissions:role ispublic:boolean name:text
- Register a voice channel for cloning. Info and permissions are optional. Use info to specify a text channel where instructions will be sent to the user creating a voice chat. Use permissions to specify a role to control the maximum permissions a user is allowed to have. For instance, if you do not want to allow streaming in your server, make a role that restricts streaming permissions on the channel, then register the voice channel specifying permissions:@YourRole. Streaming would then be restricted on that voice channel for everyone, including the owner. Use ispublic to start a voice chat as public. Defaults to private. Name must be less than 29 characters, and can include a special {count} variable that will be replaced with the next available channel number. 

/unregister vc:voice-channel
- Unregister a voice channel for cloning.

/log to:text-channel
- Log all commands, creations, joins, and leaves for this server to a channel.
