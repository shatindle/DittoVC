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

## Self-hosting
If you want to modify the bot code or want to change the profile picture of the bot, self-hosting is what you will be interested in.  The bot is pretty easy to self host so long as you have a basic understanding of Node.js and Firebase.

### System requirements

The bot needs the following to function:
- Node.js (at least version 16 as of this writing)
- a [Cloud Firestore database (quickstart here)](https://firebase.google.com/docs/firestore/quickstart)
- a [Discord bot token](https://discord.com/developers/docs/topics/oauth2)
- your bot application ID
- your bot token
- a solid internet connection (ideally, you deploy it on a server)

### Setting up the Cloud Firestore (firebase) database
In Cloud Firebase, create a new project, then create a Firestore database in the project.  See the quickstart above for instructions on setting up Firestore.  Once you have a database, create a Service account via Project Settings > Service Accounts.  Set the type as Node.js and click "Generate new private key".  Name this file firebase.json, and place it in the root of the project.

If you've never used Firestore before, the daily free tier is extremely generous.  Further, the bot does some caching to reduce the read operations required of Firestore, so unless you're deploying the bot to tons of hyper active servers that generate thousands of voice chats every day, you likely will never go beyond the free tier.

### Setting of the config.json file
Create a file called "config.json", and place it in the root of the project.  The file should have 2 keys in a JSON object: "clientId" and "token".

The file should look like the following:
```js
{
    "clientId": "YOUR_APPLICATION_ID_HERE",
    "token": "YOUR_BOT_TOKEN_HERE"
}
```

### Deploying the slash commands
The bot must do a one time registration of the commands available to the users.  There is a separate helper script to do that in the root of the project.

Run the following command once:
```sh
node ./deploy-commands.js
```

That will make the slash commands available in Discord.  You would only need to run it again if the slash commands ever change.

NOTE: this helper script is based on version 9 of the Discord API.  If Discord deprecates or deletes that version, the script will need work.  But it works as of this writing.

### Running the bot
Install the node modules and run the bot:
```sh
npm install;
node ./index.js;
```

Replace YOUR_APPLICATION_ID_HERE with your bot's application ID.  Replace YOUR_BOT_TOKEN_HERE with your bot token.

## Production mode
For testing purposes, it's ok to run the bot via node in the terminal.  It is recommended to run the bot via a process manager like [pm2](https://www.npmjs.com/package/pm2) in a production environment.  A sample setup is listed below in the root directory of the application:
```sh
pm2 start index.js --name "dittovc";
pm2 save;
```

If you prefer running your applications with Docker, a DockerFile and sample docker-compose.yml file has been provided, though not tested since I use pm2 for my copy of the bot.  You will need to build the docker container manually.  The approximate code to do so should be:
```sh
sudo docker compose up -d --build
```

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
