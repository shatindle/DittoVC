const Firestore = require('@google-cloud/firestore');
const { addToCache, removeFromCache, checkCache } = require("./cacheApi");

const db = new Firestore({
    projectId: 'dittovc',
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
async function registerChannel(id, guildId, prefix) {
    var ref = await db.collection(CHANNELS_COLLECTION).doc(id);
    await ref.set({
        id,
        guildId,
        prefix,
        createdOn: Firestore.Timestamp.now()
    });

    addToCache({
        id,
        guildId,
        prefix
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

async function cloneChannel(oldId, newId, guildId) {
    const prefix = await unregisterChannel(oldId);

    await registerChannel(newId, guildId, prefix);
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

        if (data)
            return true;
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

        if (data)
            return data.prefix;
    }

    return "Voice Chat {count}";
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
async function cloneChannel(oldChannel, newChannel, guildId, owner) {
    const prefix = await unregisterChannel(oldChannel);

    var ref = await db.collection(CLONES_COLLECTION).doc(oldChannel);
    await ref.set({
        id: oldChannel,
        guildId,
        owner,
        cloneOf: newChannel,
        createdOn: Firestore.Timestamp.now()
    });

    addToCache({
        id: oldChannel,
        guildId,
        owner,
        cloneOf: newChannel
    }, clones);

    await registerChannel(newChannel, guildId, prefix);
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

        if (data)
            return data;
    }

    return null;
}

module.exports = {
    registerChannel,
    unregisterChannel,
    loadChannels,
    cloneChannel,
    isChannelClonable,
    getChannelPrefix,

    cloneChannel,
    deleteClone,
    getClone
};