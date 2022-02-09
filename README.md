# DittoVC

## How it works
Basically:
- 1 unmuted chat
- person joins
- bot clones current chat and renames current chat
- bot restricts current chat to the primary + Mod role(s)
- bot @ mentions the user with instructions
- user issues command to invite or make it public
- when all have left, bot deletes the vc

## Commands
/delete - delete current owned vc

/add user:ref permissions:[ speak (default), listen ] - adds permissions for the specified user to connect

/remove user:ref - removes permissions for the specified user to connect

/public - make the current owned chat public

/private - make the current owned chat private

/owner user:ref - give another user ownership of the current channel

## Mod Commands
/register ?channel:ref - the VC the current issuer is in will now be a spawn base

/unregister ?channel:ref - unregisters a chat by reference