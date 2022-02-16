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
    getChannelRolePublic,
    doesChannelStartPublic,
    doesChannelAllowRenaming,
    loadAllLogChannels,
    loadAllBlacklists
} = require("./dal/databaseApi");
const getPermissions = require('./logic/permissionsLogic');
const { 
    isCooldownInEffect,
    expireCooldowns
} = require("./dal/cooldownApi");
const logActivity = require('./logic/logActivity');

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

function updateStatus() {
    try {
        client.user.setActivity(`Clone VC in ${client.guilds.cache.size} servers`);
    } catch (err) {
        console.log(`Error updating status: ${err}`)
    }
}

let loaded = false;
let statusTimer;

client.once('ready', async () => {
	if (!loaded) {
        await loadAllLogChannels();
        await loadAllBlacklists();
        updateStatus();
        statusTimer = setInterval(updateStatus, 1000 * 60 * 60);
        loaded = true;
    }
    console.log("ready!");
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
            let currentChannel = client.channels.cache.get(leftChannelId);

            if (!currentChannel)
                currentChannel = await client.channels.fetch(leftChannelId);

            const channelName = currentChannel.name;
            const memberCount = currentChannel.members.size;

            if (memberCount === 0) {
                if (await getClone(leftChannelId)){
                    await currentChannel.delete();
                    await deleteClone(leftChannelId);
                }
            }

            await logActivity(client, guild.id, "User left VC", `<@${userId}> left ${channelName}`);
        }

        if (joinedChannelId) {
            currentClaims[joinedChannelId] = true;
            let claim = client.channels.cache.get(joinedChannelId);

            if (!claim)
                claim = await client.channels.fetch(joinedChannelId);

            // the user joined a channel
            if (await isChannelClonable(joinedChannelId)) {
                const instructionsId = await getChannelInstructionsDestination(joinedChannelId);
                let cooldownTimeRemaining = isCooldownInEffect(userId, guild.id, COOL_DOWN);

                if (cooldownTimeRemaining) {
                    const bootMember = await claim.guild.members.fetch(userId);

                    if (instructionsId) {
                        var instructionsChannel = client.channels.cache.get(instructionsId);

                        if (!instructionsChannel)
                            instructionsChannel = await client.channels.fetch(instructionsId);
                        
                        var response = await instructionsChannel.send(
                            `<@${userId}> please wait a few minutes before trying to create a new voice chat`);

                        setTimeout(async function() {
                            if (response.deletable)
                                await response.delete();
                        }, 5000);
                    }

                    await bootMember.voice.disconnect();

                    await logActivity(client, guild.id, "Join cooldown in effect", `<@${userId}> tried to create a VC, but hit cooldown`);
                    return;
                }

                const roleId = await getChannelRole(joinedChannelId);
                let publicRoleId = await getChannelRolePublic(joinedChannelId);

                if (!publicRoleId)
                    publicRoleId = roleId;

                const channelStartsPublic = await doesChannelStartPublic(joinedChannelId);
                const channelAllowsRenaming = await doesChannelAllowRenaming(joinedChannelId);
                let prefix = await getChannelPrefix(joinedChannelId);
                const permissions = getPermissions(claim, roleId);
                const publicPermissions = getPermissions(claim, publicRoleId);

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

                if (channelStartsPublic) {
                    await claim.permissionOverwrites.create(userId, {
                        CONNECT: true,
                        STREAM: publicPermissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                        SPEAK: publicPermissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1
                    });

                    await claim.permissionOverwrites.create(claim.guild.roles.everyone, {
                        CONNECT: true,
                        STREAM: publicPermissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                        SPEAK: publicPermissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1
                    });
                } else {
                    await claim.permissionOverwrites.create(userId, {
                        CONNECT: true,
                        STREAM: permissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                        SPEAK: permissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1
                    });
                    
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
                let allNumbers = [];
                for (var vc of voiceChannels) {
                    if (prefixCountPosition > -1) {
                        let currentNumber = "";
                        for (var i = prefixCountPosition; i < vc.length; i++) {
                            if (isNumber(vc[i]))
                                currentNumber += vc[i];
                            else
                                break;
                        }

                        if (currentNumber && parseInt(currentNumber) > 0) {
                            allNumbers.push(parseInt(currentNumber));
                        }
                    }
                }

                allNumbers.sort(function(a, b) {
                    return a - b;
                });

                for (var num of allNumbers) {
                    if (number === num) {
                        number++;
                    } else {
                        break;
                    }
                }

                const newName = prefix.replace("{count}", number);
                await claim.setName(newName);

                if (noClone) {
                    member.voice.setChannel(claim);
                    await registerClone(claim.id, roleId, guild.id, userId, permissions, publicPermissions, channelAllowsRenaming);
                } else {
                    await registerClone(claim.id, roleId, guild.id, userId, permissions, publicPermissions, channelAllowsRenaming);
                    await registerChannel(clone.id, guild.id, prefix, instructionsId, roleId, publicRoleId, channelStartsPublic, channelAllowsRenaming);
                    await unregisterChannel(claim.id);
                    await clone.edit({ position: newState.channel.position });
                }

                await logActivity(client, guild.id, "User created VC", `<@${userId}> created ${newName}`);

                if (instructionsId) {
                    var instructionsChannel = client.channels.cache.get(instructionsId);

                    if (!instructionsChannel)
                        instructionsChannel = await client.channels.fetch(instructionsId);

                    const tempInstructions = await instructionsChannel.send(
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

/name it:text
> Give your voice chat a name.

/delete
> Delete your owned voice chat.`);

                    setTimeout(async function() {
                        try {
                            if (tempInstructions.deletable)
                                await tempInstructions.delete();
                        } catch { /* errored, but don't care */ }
                    }, 60000);
                }
            } else {
                await logActivity(client, guild.id, "User joined VC", `<@${userId}> joined ${claim.name}`);
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
