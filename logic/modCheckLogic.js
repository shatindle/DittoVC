const { Permissions } = require("discord.js");

function isModWithAccess(channel, userId) {
    const currentPermissions = channel.permissionsFor(userId);

    if (currentPermissions.has(Permissions.FLAGS.CONNECT)) {
        if (currentPermissions.has(Permissions.FLAGS.MODERATE_MEMBERS))
            return true;

        if (currentPermissions.has(Permissions.FLAGS.KICK_MEMBERS))
            return true;
            
        if (currentPermissions.has(Permissions.FLAGS.BAN_MEMBERS))
            return true;

        if (currentPermissions.has(Permissions.FLAGS.ADMINISTRATOR))
            return true;
    }

    return false;
}

module.exports = isModWithAccess;