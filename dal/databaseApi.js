const Firestore = require('@google-cloud/firestore');
const { addToCache, removeFromCache, checkCache } = require("./cacheApi");
const { projectId } = require("../firebase.json").project_id;

const db = new Firestore({
    projectId: projectId,
    keyFilename: './firebase.json',
});

const channels = [];
const CHANNELS_COLLECTION = "channels";

/*
// document ID: voice channel ID
// this is to prevent duplicates
{
    // voice channel ID
    "id": "571772169558687778",

    // the guild this belongs to (so we can nuke it if needed)
    "guildId": "460125773005848586"

    // created on
    "createdOn": 1644375840411
}
*/

/**
 * @description Register a channel for cloning
 * @param {String} id The channel ID
 * @param {String} guildId The server ID the channel is associated with (does not change, used to mass delete)
 */
async function registerChannel(id, guildId, prefix = "Voice Chat {count}", instructionsId = "", roleId = "", publicRoleId = "", defaultPublic = false, rename = false) {
    if (checkCache(id, "id", channels))
        removeFromCache(id, "id", channels);
    
    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    await ref.set({
        id,
        guildId,
        prefix,
        instructionsId,
        roleId,
        publicRoleId,
        defaultPublic,
        rename,
        createdOn: Firestore.Timestamp.now()
    });

    addToCache({
        id,
        guildId,
        prefix,
        instructionsId,
        roleId,
        publicRoleId,
        defaultPublic,
        rename
    }, channels);
}

/**
 * @description Unregister a channel for cloning
 * @param {String} id The channel ID
 */
async function unregisterChannel(id) {
    if (checkCache(id, "id", channels))
        removeFromCache(id, "id", channels);

    const ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    const doc = await ref.get();

    let prefix = "Voice Chat {count}";

    if (doc.exists) {
        const data = doc.data();

        prefix = data.prefix;
    }

    await ref.delete();

    return prefix;
}

/**
 * @description Used on startup to load the current channels
 * @returns Return the list of channels registered on cold boot
 */
async function loadChannels() {
    var ref = await db.collection(CHANNELS_COLLECTION).get();

    return ref.docs.map(d => d.data());
}

/**
 * @description Determine if a channel is intended to be cloned
 * @param {String} id The channel ID
 * @returns {Boolean} Whether or not the channel is cloneable
 */
async function isChannelClonable(id) {
    let channel = checkCache(id, "id", channels);

    if (channel)
        return true;

    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, channels);
            return true;
        }
    }

    return false;
}

/**
 * @description Loads a channel's prefix if it exists
 * @param {String} id The channel ID
 * @returns The channel prefix
 */
async function getChannelPrefix(id) {
    let channel = checkCache(id, "id", channels);

    if (channel)
        return channel.prefix;

    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, channels);
            return data.prefix;
        }
    }

    return "Voice Chat {count}";
}

async function getChannelInstructionsDestination(id) {
    let channel = checkCache(id, "id", channels);

    if (channel)
        return channel.instructionsId;

    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, channels);
            return data.instructionsId;
        }
    }

    return undefined;
}

async function getChannelRole(id) {
    let channel = checkCache(id, "id", channels);

    if (channel)
        return channel.roleId;

    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, channels);
            return data.roleId;
        }
    }

    return undefined;
}

async function getChannelRolePublic(id) {
    let channel = checkCache(id, "id", channels);

    if (channel)
        return channel.publicRoleId ?? channel.roleId;

    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, channels);
            return data.publicRoleId ?? data.roleId;
        }
    }

    return undefined;
}

async function doesChannelStartPublic(id) {
    let channel = checkCache(id, "id", channels);

    if (channel)
        return channel.defaultPublic;

    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, channels);
            return data.defaultPublic;
        }
    }

    return undefined;
}

async function doesChannelAllowRenaming(id) {
    let channel = checkCache(id, "id", channels);

    if (channel)
        return channel.rename;

    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, channels);
            return data.rename;
        }
    }

    return false;
}

const clones = [];
const CLONES_COLLECTION = "clones";

/*
// document ID: voice channel ID
// this is to prevent duplicates
{
    // voice channel ID
    "id": "571772169558687778",

    // the guild this belongs to (so we can nuke it if needed)
    "guildId": "625704742428999720",

    // the user that currently owns the channel and can invite/remove others
    "owner": "460125773005848586",

    // created on
    "createdOn": 1644375840411
}
*/

/**
 * @description Clone a cloneable channel
 * @param {String} id The channel ID
 * @param {String} guildId The server ID
 * @param {String} owner The current owner user ID
 */
async function registerClone(claim, roleId, guildId, owner, permissions, publicPermissions = null, rename = false) {
    var ref = await db.collection(CLONES_COLLECTION).doc(claim);
    await ref.set({
        id: claim,
        guildId,
        owner,
        roleId,
        permissions,
        publicPermissions,
        rename,
        createdOn: Firestore.Timestamp.now()
    });

    addToCache({
        id: claim,
        guildId,
        owner,
        roleId,
        permissions,
        publicPermissions,
        rename
    }, clones);
}

/**
 * @description Unregister a channel for cloning
 * @param {String} id The channel ID
 */
 async function deleteClone(id) {
    if (checkCache(id, "id", clones))
        removeFromCache(id, "id", clones);

    const ref = await db.collection(CLONES_COLLECTION).doc(id);

    await ref.delete();
}

/**
 * @description Gets the cloned channel by ID if it exists and has an owner
 * @param {String} id The channel ID
 * @returns The channel, if it exists and is an owned clone
 */
async function getClone(id) {
    let channel = checkCache(id, "id", clones);

    if (channel)
        return channel;

    var ref = await db.collection(CLONES_COLLECTION).doc(id);
    var doc = await ref.get();

    if (doc.exists) {
        var data = doc.data();

        if (data) {
            addToCache(data, clones);
            return data;
        }
    }

    return null;
}

async function setChannelOwner(id, owner) {
    const channel = await getClone(id);

    if (channel) {
        channel.owner = owner;

        await db.collection(CLONES_COLLECTION).doc(id).update({
            owner
        });

        return;
    }

    throw "Channel doesn't exist";
}

async function getOwnedChannel(owner, guildId) {
    let channel = checkCache(owner, "owner", clones);

    if (channel)
        return channel;

    var querySnapshot = await db.collection(CLONES_COLLECTION)
        .where('owner', '==', owner)
        .where('guildId', '==', guildId)
        .get();

    let data = null;

    querySnapshot.forEach((doc) => {
        data = doc.data();
    });

    if (data)
        addToCache(data, clones);

    return data;
}

async function nameOwnedChannel(id, name) {
    const channel = await getClone(id);

    if (channel) {
        channel.name = name;

        await db.collection(CLONES_COLLECTION).doc(id).update({
            name
        });

        return;
    }

    throw "Channel doesn't exist";
}

const logs = {};
const LOGS_COLLECTION = "logs";

/**
 * @description Clone a cloneable channel
 * @param {String} id The channel ID
 * @param {String} guildId The server ID
 * @param {String} owner The current owner user ID
 */
 async function registerLogs(guildId, channelId) {
    var ref = await db.collection(LOGS_COLLECTION).doc(guildId);
    var docs = await ref.get();

    if (channelId) {
        await ref.set({
            id: guildId,
            channelId,
            createdOn: Firestore.Timestamp.now()
        });
    } else {
        if (docs.exists) {
            await ref.delete();
        }
    }

    logs[guildId] = {
        id: guildId,
        channelId
    };
}

async function loadAllLogChannels() {
    var ref = await db.collection(LOGS_COLLECTION);
    var docs = await ref.get();

    if (docs.size > 0) {
        docs.forEach(e => {
            var data = e.data();

            logs[data.id] = data;
        });
    }
}

function getLogChannel(guildId) {
    if (logs[guildId])
        return logs[guildId].channelId;

    return null;
}

const blacklist = {};
const BLACKLIST_COLLECTION = "blacklist";

async function loadAllBlacklists() {
    var ref = await db.collection(BLACKLIST_COLLECTION);
    var docs = await ref.get();

    if (docs.size > 0) {
        docs.forEach(e => {
            var data = e.data();

            blacklist[data.id] = data;
        });
    }
}

function getBlacklist(guildId) {
    if (blacklist[guildId])
        return blacklist[guildId].blacklist;

    return [];
}

const BLACKLIST_LIMIT = 500;

async function addToBlacklist(guildId, text) {
    let list;

    if (blacklist[guildId]) {
        if (blacklist[guildId].blacklist.length > BLACKLIST_LIMIT)
            return "LIMIT EXCEEDED";

        if (blacklist[guildId].blacklist.indexOf(text) > -1)
            return;

        blacklist[guildId].blacklist.push(text);

        list = blacklist[guildId];
    } else {
        list = {
            blacklist: [text],
            id: guildId
        };

        blacklist[guildId] = list;
    }

    const ref = await db.collection(BLACKLIST_COLLECTION).doc(guildId);
    await ref.set(list);
}

async function removeFromBlacklist(guildId, text) {
    if (blacklist[guildId] && blacklist[guildId].blacklist) {
        const position = blacklist[guildId].blacklist.indexOf(text);
        
        if (position > -1) {
            blacklist[guildId].blacklist.splice(position, 1);

            const ref = await db.collection(BLACKLIST_COLLECTION).doc(guildId);

            await ref.set(blacklist[guildId]);
        }
    }
}

module.exports = {
    registerChannel,
    unregisterChannel,
    loadChannels,
    isChannelClonable,
    getChannelPrefix,
    getChannelInstructionsDestination,
    getChannelRole,
    getChannelRolePublic,
    doesChannelStartPublic,
    doesChannelAllowRenaming,

    registerClone,
    deleteClone,
    getClone,
    
    getOwnedChannel,
    nameOwnedChannel,
    setChannelOwner,

    registerLogs,
    loadAllLogChannels,
    getLogChannel,

    loadAllBlacklists,
    getBlacklist,
    addToBlacklist,
    removeFromBlacklist,
    BLACKLIST_LIMIT
};