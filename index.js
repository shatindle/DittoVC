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
    doesChannelHaveNoFilter,
    loadAllLogChannels,
    loadAllBlacklists
} = require("./dal/databaseApi");
const getPermissions = require('./logic/permissionsLogic');
const { 
    isCooldownInEffect,
    expireCooldowns
} = require("./dal/cooldownApi");
const logActivity = require('./logic/logActivity');
const { getLang } = require("./lang");
const { execute:publicCommand } = require("./commands/public");
const { execute:privateCommand } = require("./commands/private");
const { createModal:maxModal, modalSubmit:maxModalSubmit } = require("./modal/maxModal");
const { 
    pruneClones, 
    pruneRegisters,
    setupListeners:channelCleanupListeners
} = require("./logic/channelCleanup");

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
let pruneCloneTimer;

client.once('ready', async () => {
	if (!loaded) {
        await loadAllLogChannels();
        await loadAllBlacklists();
        updateStatus();
        statusTimer = setInterval(updateStatus, 1000 * 60 * 30);
        loaded = true;
        channelCleanupListeners();
        pruneCloneTimer = setInterval(async () => {
            try {
                await pruneClones(client);
            } catch (err) {
                console.log(`Error pruning clones: ${err.toString()}`);
            }
        }, 1000 * 60 * 60);
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
        const lang = newState.guild.preferredLocale;
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

            await logActivity(client, 
                guild.id, 
                getLang(lang, "voicestateupdate_user_left_log_name", "User left VC"), 
                getLang(lang, "voicestateupdate_user_left_log_description", "<@%1$s> left %2$s", userId, channelName));
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
                            getLang(lang, "voicestateupdate_rate_limited", "<@%1$s> please wait a few minutes before trying to create a new voice chat", userId));

                        setTimeout(async function() {
                            if (response.deletable)
                                await response.delete();
                        }, 5000);
                    }

                    await bootMember.voice.disconnect();

                    await logActivity(client, 
                        guild.id, 
                        getLang(lang, "voicestateupdate_rate_limited_log_name", "Join cooldown in effect"),
                        getLang(lang, "voicestateupdate_rate_limited_log_description", "<@%1$s> tried to create a VC, but hit cooldown", userId));
                    return;
                }

                const roleId = await getChannelRole(joinedChannelId);
                let publicRoleId = await getChannelRolePublic(joinedChannelId);

                if (!publicRoleId)
                    publicRoleId = roleId;

                const channelStartsPublic = await doesChannelStartPublic(joinedChannelId);
                const channelAllowsRenaming = await doesChannelAllowRenaming(joinedChannelId);
                const channelHasNoFilter = await doesChannelHaveNoFilter(joinedChannelId);
                let prefix = await getChannelPrefix(joinedChannelId);
                const permissions = getPermissions(claim, roleId);
                const publicPermissions = getPermissions(claim, publicRoleId);

                const clone = await claim.clone();

                let noClone = false;

                if (currentClaims[joinedChannelId]) {
                    delete currentClaims[joinedChannelId];
                } else {
                    // claim is taken, you get the clone
                    claim = clone;
                    noClone = true;
                }

                const currentPerms = {}

                try {
                    // attempt to pull the current permissions
                    clone.permissionOverwrites.cache.map(t => {
                        currentPerms[t.id] = {};
                        t.allow.toArray().forEach(perm => currentPerms[t.id][perm] = true);
                        t.deny.toArray().forEach(perm => currentPerms[t.id][perm] = false);
                    });
                } catch {}
                
                await claim.permissionOverwrites.create(client.user.id, {
                    ...(currentPerms[client.user.id] ?? {}),
                    CONNECT: true,
                    STREAM: true,
                    SPEAK: true,
                    SEND_MESSAGES: true
                });

                if (channelStartsPublic) {
                    await claim.permissionOverwrites.create(userId, {
                        ...(currentPerms[userId] ?? {}), // this is required to maintain the default permissions
                        CONNECT: true,
                        STREAM: publicPermissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                        SPEAK: publicPermissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1,
                        SEND_MESSAGES: publicPermissions.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1
                    });

                    await claim.permissionOverwrites.create(claim.guild.roles.everyone, {
                        ...(currentPerms[claim.guild.roles.everyone.id] ?? {}), // this is required to maintain the default permissions
                        CONNECT: true,
                        STREAM: publicPermissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                        SPEAK: publicPermissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1,
                        SEND_MESSAGES: publicPermissions.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1
                    });
                } else {
                    await claim.permissionOverwrites.create(userId, {
                        ...(currentPerms[userId] ?? {}), // this is required to maintain the default permissions
                        CONNECT: true,
                        STREAM: permissions.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                        SPEAK: permissions.allow.indexOf(Permissions.FLAGS.SPEAK) > -1,
                        SEND_MESSAGES: permissions.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1
                    });
                    
                    await claim.permissionOverwrites.create(claim.guild.roles.everyone, {
                        ...(currentPerms[claim.guild.roles.everyone.id] ?? {}), // this is required to maintain the default permissions
                        CONNECT: false,
                        STREAM: false,
                        SPEAK: false,
                        SEND_MESSAGES: false
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
                    await registerClone(claim.id, roleId, guild.id, userId, permissions, publicPermissions, channelAllowsRenaming, channelHasNoFilter);
                } else {
                    await registerClone(claim.id, roleId, guild.id, userId, permissions, publicPermissions, channelAllowsRenaming, channelHasNoFilter);
                    await registerChannel(clone.id, guild.id, prefix, instructionsId, roleId, publicRoleId, channelStartsPublic, channelAllowsRenaming, channelHasNoFilter);
                    await unregisterChannel(claim.id);
                    // await clone.edit({ position: newState.channel.position });
                    await clone.edit({ position: 0 }); // just move the channel to the top of the list
                }

                await logActivity(client, 
                    guild.id, 
                    getLang(lang, "voicestateupdate_user_created_vc_log_name", "User created VC"), 
                    getLang(lang, "voicestateupdate_user_created_vc_log_description", "<@%1$s> created %2$s", userId, newName));

                if (instructionsId) {
                    var instructionsChannel = client.channels.cache.get(instructionsId);

                    if (!instructionsChannel)
                        instructionsChannel = await client.channels.fetch(instructionsId);

                    const tempInstructions = await instructionsChannel.send(
                        getLang(lang, "voicestateupdate_how_to_use_dittovc",
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
> Sets the region the voice chat is hosted in.`, userId));

                    setTimeout(async function() {
                        try {
                            if (tempInstructions.deletable)
                                await tempInstructions.delete();
                        } catch { /* errored, but don't care */ }
                    }, 60000);
                }

                // make sure the user is still in this voice chat.  It is possible they left mid-way through...
                claim = await client.channels.fetch(joinedChannelId);

                if (claim && claim.members && claim.members.size < 1) {
                    // all users left, clean this channel up
                    let abandonedChannelName =  claim.name;
                    await claim.delete();
                    await deleteClone(joinedChannelId);

                    await logActivity(client, 
                        guild.id, 
                        getLang(lang, "voicestateupdate_user_left_log_name", "User abandoned VC"), 
                        getLang(lang, "voicestateupdate_user_left_log_description", "<@%1$s> left %2$s before the channel was fully cloned", userId, abandonedChannelName));
                }
            } else {
                await logActivity(client, 
                    guild.id, 
                    getLang(lang, "voicestateupdate_user_joined_vc_log_name", "User joined VC"), 
                    getLang(lang, "voicestateupdate_user_joined_vc_log_description", "<@%1$s> joined %2$s", userId, claim.name));
            }
        }
    } catch (err) {
        console.log(`Error in voiceStateUpdate: ${err}`);
    }
});

// slash command control
client.on('interactionCreate', async interaction => {
    const lang = interaction.guild.preferredLocale;
	if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
    
        if (!command) return await interaction.reply({ 
            content: 
            getLang(lang, "generic_error", "There was an error while executing this command!"), 
            ephemeral: true 
        });
    
        try {
            return await command.execute(interaction);
        } catch (error) {
            console.error(error);
            return await interaction.reply({ 
                content: 
                getLang(lang, "generic_error", "There was an error while executing this command!"), 
                ephemeral: true 
            });
        }
    } else if (interaction.isButton()) {
        switch (interaction.customId) {
            case "public": return await publicCommand(interaction);
            case "private": return await privateCommand(interaction);
            case "max": return await maxModal(interaction);
            default: return await interaction.reply({ content: "Unknown interaction" });
        }
    } else if (interaction.isModalSubmit()) {
        switch (interaction.customId) {
            case "maxmodal": return await maxModalSubmit(interaction);
            default: return await interaction.reply({ content: "Unknown interaction" });
        }
    }
});

client.login(token);

setInterval(expireCooldowns, COOL_DOWN / 2);
