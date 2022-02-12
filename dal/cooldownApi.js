const servers = {};

/**
 * @description Evaluates repeat occurrences
 * @param {String} userId The user's discord ID
 * @param {String} message The message the user sent
 * @returns Whether the user should be removed from the server (repeat phishing message)
 */
 function isCooldownInEffect(userId, guildId, cooldown) {
    if (!servers[guildId]) 
        servers[guildId] = {};

    const key = userId;

    if (typeof servers[guildId][key] !== "number") {
        servers[guildId][key] = Date.now().valueOf() + cooldown;

        return false;
    }

    return servers[guildId][key];
}

/**
 * @description Runs periodically to clear out cooldowns in effect
 */
function expireCooldowns() {
    const now = Date.now().valueOf();
    let expired;

    for (const server of Object.values(servers)) {
        expired = [];
        for (const [key, value] of Object.entries(server)) {
            if (value < now) {
                expired.push(key);
            }
        }
        expired.forEach(k => delete server[k]);
    }
}

module.exports = {
    isCooldownInEffect,
    expireCooldowns
};