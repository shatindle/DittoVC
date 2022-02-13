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
    getChannelRole,
    doesChannelStartPublic
} = require("./dal/databaseApi");
const getPermissions = require('./logic/permissionsLogic');
const { 
    isCooldownInEffect,
    expireCooldowns
} = require("./dal/cooldownApi");

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

// how long after a user creates a VC should they wait before they're allowed to make a new one
const COOL_DOWN = 1000 * 30;

// this is needed when multiple people join at the same time so we can know who gets what channel
const currentClaims = {};

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
                const instructionsId = await getChannelInstructionsDestination(joinedChannelId);
                let claim = client.channels.cache.get(joinedChannelId);
                let cooldownTimeRemaining = isCooldownInEffect(userId, guild.id, COOL_DOWN);

                if (cooldownTimeRemaining) {
                    const bootMember = await claim.guild.members.fetch(userId);

                    if (instructionsId) {
                        var response = await client.channels.cache.get(instructionsId).send(
                            `<@${userId}> please wait a few minutes before trying to create a new voice chat`);

                        setTimeout(async function() {
                            if (response.deletable)
                                await response.delete();
                        }, 5000);
                    }

                    await bootMember.voice.disconnect();

                    return;
                }

                const roleId = await getChannelRole(joinedChannelId);
                const channelStartsPublic = await doesChannelStartPublic(joinedChannelId);
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
                
                await claim.permissionOverwrites.create(client.user.id, {
                    CONNECT: true,
                    STREAM: true,
                    SPEAK: true
                });

                await claim.permissionOverwrites.create(userId, {
                    CONNECT: true,
                    STREAM: permissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                    SPEAK: permissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1
                });

                if (channelStartsPublic) {
                    await claim.permissionOverwrites.create(claim.guild.roles.everyone, {
                        CONNECT: true,
                        STREAM: permissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                        SPEAK: permissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1
                    });
                } else {
                    await claim.permissionOverwrites.create(claim.guild.roles.everyone, {
                        CONNECT: false,
                        STREAM: false,
                        SPEAK: false
                    });
                }

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
                    await registerChannel(clone.id, guild.id, prefix, instructionsId, roleId, channelStartsPublic);
                    await unregisterChannel(claim.id);
                    await clone.edit({ position: newState.channel.position });
                }

                if (instructionsId) {
                    const tempInstructions = await client.channels.cache.get(instructionsId).send(
`<@${userId}>
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

/delete
> Delete your owned voice chat.`);

                    setTimeout(async function() {
                        try {
                            if (tempInstructions.deletable)
                                await tempInstructions.delete();
                        } catch { /* errored, but don't care */ }
                    }, 60000);
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

const expireTimer = setInterval(expireCooldowns, COOL_DOWN / 2);