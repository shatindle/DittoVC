const fs = require('fs');
const { Client, Collection, Intents, Permissions } = require('discord.js');
const { token } = require('./config.json');
const { 
    registerClone, 
    isChannelClonable, 
    getChannelPrefix, 
    getChannelInstructionsDestination, 
    getClone, 
    registerChannel,
    unregisterChannel,
    deleteClone,
    getChannelRole
} = require("./dal/databaseApi");
const getPermissions = require('./logic/permissionsLogic');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES, 
        Intents.FLAGS.GUILD_MESSAGES
    ] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});

function isNumber(val) {
    return /^\d+$/.test(val);
}

const currentClaims = {};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
        const { channelId: leftChannelId, guild, member } = oldState;
        let { channelId: joinedChannelId, id: userId } = newState;

        if (joinedChannelId === leftChannelId)
            return;
        
        if (leftChannelId) {
            // the user left a channel
            const currentChannel = client.channels.cache.get(leftChannelId);
            const memberCount = currentChannel.members.size;

            if (memberCount === 0) {
                if (await getClone(leftChannelId)){
                    await currentChannel.delete();
                    await deleteClone(leftChannelId);
                }
            }
        }

        if (joinedChannelId) {
            currentClaims[joinedChannelId] = true;
            // the user joined a channel
            if (await isChannelClonable(joinedChannelId)) {
                let claim = client.channels.cache.get(joinedChannelId);
                const roleId = await getChannelRole(joinedChannelId);
                const instructionsId = await getChannelInstructionsDestination(joinedChannelId);
                let prefix = await getChannelPrefix(joinedChannelId);
                let permissions = getPermissions(claim, roleId);
                const clone = await claim.clone(undefined, true, false, "Clone");

                let noClone = false;

                if (currentClaims[joinedChannelId]) {
                    delete currentClaims[joinedChannelId];
                } else {
                    // claim is taken, you get the clone
                    claim = clone;
                    noClone = true;
                }
                

                await claim.permissionOverwrites.set([
                    {
                        id: client.user.id,
                        allow: [Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK, Permissions.FLAGS.STREAM]
                    },
                    {
                        id: userId,
                        allow: permissions.allow,
                        deny: permissions.deny
                    },
                    {
                        id: claim.guild.roles.everyone,
                        deny: [Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK, Permissions.FLAGS.STREAM]
                    }
                ]);
                // determine what we should call this channel based on current names
                const voiceChannels = clone.guild.channels.cache.filter(c => c.type === "GUILD_VOICE" &&  c.parentId === clone.parentId).map(v => v.name);

                const prefixCountPosition = prefix.indexOf("{count}");
                let number = 1;
                for (var vc of voiceChannels) {
                    if (prefixCountPosition > -1) {
                        let currentNumber = "";
                        for (var i = prefixCountPosition; i < vc.length; i++) {
                            if (isNumber(vc[i]))
                            currentNumber += vc[i];
                            else
                                break;
                        }

                        if (currentNumber && parseInt(currentNumber) >= number) {
                            number = parseInt(currentNumber) + 1;
                        }
                    }
                }

                const newName = prefix.replace("{count}", number);
                await claim.setName(newName);

                if (noClone) {
                    member.voice.setChannel(claim);
                    await registerClone(claim.id, roleId, guild.id, userId, permissions);
                } else {
                    await registerClone(claim.id, roleId, guild.id, userId, permissions);
                    await registerChannel(clone.id, guild.id, prefix, instructionsId, roleId);
                    await unregisterChannel(claim.id);
                    await clone.edit({ position: newState.channel.position });
                }

                if (instructionsId) {
                    await client.channels.cache.get(instructionsId).send(
`<@${userId}>
__How to use DittoVC__
/add user:username#0000 permissions:(all, stream, speak, or listen)
*- adds the user to the voice chat, defaults to speaking permissions*

/remove user:username#0000
*- remove the user from the voice chat*

/public
*- make your voice chat public*

/private
*- make your voice chat private*

/owner user:username#0000
*- transfer ownership of the current channel*`);
                }
            }
        }
    } catch (err) {
        console.log(`Error in voiceStateUpdate: ${err}`);
    }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);