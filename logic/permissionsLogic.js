const { Permissions } = require("discord.js");

function getPermissions(channelOrArray, roleId, request) {
    const permissions = channelOrArray.allow ? 
        channelOrArray.allow.map(t => {
            if (t === 512 || t === 512n) return "STREAM";
            if (t === 2097152 || t === 2097152n) return "SPEAK";
            if (t === 2048 || t === 2048n) return "SEND_MESSAGES";
            return "LISTEN";
        }) : 
        channelOrArray.permissionsFor(roleId ?? channel.guild.roles.everyone.id).toArray();

    const maxPermissions = [Permissions.FLAGS.CONNECT];
    const limitPermissions = [];

    if (permissions.indexOf("STREAM") > -1 && (!request || request === "all"))
        maxPermissions.push(Permissions.FLAGS.STREAM);
    else
        limitPermissions.push(Permissions.FLAGS.STREAM);

    if (permissions.indexOf("SPEAK") > -1 && (!request || request === "all" || request === "speak")) 
        maxPermissions.push(Permissions.FLAGS.SPEAK);
    else
        limitPermissions.push(Permissions.FLAGS.SPEAK);

    if (permissions.indexOf("SEND_MESSAGES") > -1 && (!request || request === "all" || request === "speak" || request === "send_messages")) 
        maxPermissions.push(Permissions.FLAGS.SEND_MESSAGES);
    else
        limitPermissions.push(Permissions.FLAGS.SEND_MESSAGES);

    return {
        allow: maxPermissions,
        deny: limitPermissions
    };
}

module.exports = getPermissions;