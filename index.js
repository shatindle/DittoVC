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
    doesChannelHavePing,
    doesChannelHaveSetMax,
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
    let claim, clone;

    let failingPerms = {};

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
            claim = client.channels.cache.get(joinedChannelId);

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
                const channelHasPing = await doesChannelHavePing(joinedChannelId);
                const channelHasSetMax = await doesChannelHaveSetMax(joinedChannelId);
                let prefix = await getChannelPrefix(joinedChannelId);
                const permissions = getPermissions(claim, roleId);
                const publicPermissions = getPermissions(claim, publicRoleId);

                clone = await claim.clone();

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
                
                failingPerms = {
                    ...(currentPerms[client.user.id] ?? {}),
                    CONNECT: true,
                    STREAM: true,
                    SPEAK: true,
                    SEND_MESSAGES: true
                };

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

                allNumbers.sort((a, b) => a-b);

                for (var num of allNumbers) {
                    if (number === num) {
                        number++;
                    }
                }

                const newName = prefix.replace("{count}", number);
                await claim.setName(newName);

                if (noClone) {
                    member.voice.setChannel(claim);
                    await registerClone(claim.id, roleId, guild.id, userId, permissions, publicPermissions, channelAllowsRenaming, channelHasNoFilter, channelHasPing, channelHasSetMax);
                } else {
                    await registerClone(claim.id, roleId, guild.id, userId, permissions, publicPermissions, channelAllowsRenaming, channelHasNoFilter, channelHasPing, channelHasSetMax);
                    await registerChannel(clone.id, guild.id, prefix, instructionsId, roleId, publicRoleId, channelStartsPublic, channelAllowsRenaming, channelHasNoFilter, channelHasPing, channelHasSetMax);
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

                    // create instructions, issue https://github.com/shatindle/DittoVC/issues/38
                    let instructionsText = getLang(lang, "voicestateupdate_how_to_use_dittovc_vc_created", "<@%1$s> You've created your own voice channel <#%2$s>!", userId, claim.id);

                    if (channelStartsPublic) {
                        instructionsText += "\n\n" + getLang(lang, "voicestateupdate_how_to_use_dittovc_vc_is_public", "Your channel is currently public. Anyone can join your channel, but if you want to make it private simply run the `/private` command so that people can only join if you invite them via `/add`. If you change your mind, you can make it public again using `/public`.");
                    } else {
                        instructionsText += "\n\n" + getLang(lang, "voicestateupdate_how_to_use_dittovc_vc_is_private", "Your channel is currently private. To invite people to your channel, use the `/add` command and type the username of the user you want to invite. If you want anyone to be able to join your channel, you can make it public using `/public`. If you change your mind, you can make it private again using `/private`.");
                    }

                    if (channelAllowsRenaming) {
                        instructionsText += "\n\n" + getLang(lang, "voicestateupdate_how_to_use_dittovc_vc_rename", "You can rename your voice channel to something else if you'd like! Use the `/rename` command to set the name of your voice channel.");
                    }

                    instructionsText += "\n\n" + getLang(lang, "voicestateupdate_how_to_use_dittovc_vc_delete", "When you're done with your voice channel, use the `/delete` command to delete it. If you leave the voice channel while other people are in there, they can claim ownership of the voice channel using `/claim` and manage the channel themselves.");

                    instructionsText += "\n\n" + getLang(lang, "voicestateupdate_how_to_use_dittovc_vc_more_info", "To see the list of all commands the bots supports, run `/info`.");

                    const tempInstructions = await instructionsChannel.send(instructionsText);

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
        let failingPermText = Object.keys(failingPerms).join(", ");

        try {
            logActivity(client, 
                oldState.guild.id, 
                getLang(oldState.guild.preferredLocale, "vc_creation_permission_error_title", "Error creating Voice Clone"), 
                getLang(oldState.guild.preferredLocale, "vc_creation_permission_error_description", "<@%1$s> tried to create a VC using <#%2$s>, but the bot encountered this error before the channel was fully cloned: %3$s\n\nMake sure you have explicitly given the bot these permissions: %4$s", newState.id, newState.channelId, err.message, failingPermText));    
        } catch (log_err) {
            console.log(`Unable to record VC creation error: ${log_err}`);
        }
        
        // TODO: loop through each of the permissions and find out which one the bot doesn't have

        // TODO: figure out at what point in the clone process we failed
        try {
            // if both channels exist and both are still clonable, delete the claim
            if (claim && clone && claim.id && clone.id) {
                let claimStillExists, cloneStillExists;

                try {
                    claimStillExists = await client.channels.fetch(claim.id);
                } catch {}

                try {
                    cloneStillExists = await client.channels.fetch(clone.id);
                } catch {}

                if (claimStillExists && cloneStillExists && claimStillExists.id && cloneStillExists.id && claimStillExists.members.size < 1 && cloneStillExists.members.size < 1) {
                    // check if both are still treated as cloneable in our system
                    if (await isChannelClonable(claimStillExists.id) && await isChannelClonable(cloneStillExists.id)) {
                        // we still think both can be cloned, so delete the claimed chat just in case perms are messed up
                        await unregisterChannel(claimStillExists.id);
                        await claimStillExists.delete();
                        console.log(`Cleanup succeeded`);
                        return;
                    }
                }
            }

            console.log(`No cleanup performed`);
        } catch (err_clonefixfail) { 
            /* we tried */ 
            console.log(`Error in clone repair: ${err_clonefixfail}`);
        }
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
