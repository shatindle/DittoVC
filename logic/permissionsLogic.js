const { Permissions } = require("discord.js");

function getPermissions(channelOrArray, roleId, request) {
    const permissions = channelOrArray.allow ? 
        channelOrArray.allow.map(t => t === 2097152 || t === 2097152n ? "SPEAK" : t === 512 || t === 512n ? "STREAM" : "LISTEN") : 
        channelOrArray.permissionsFor(roleId ?? channel.guild.roles.everyone.id).toArray();

    const maxPermissions = [Permissions.FLAGS.CONNECT];
    const limitPermissions = [];

    if (permissions.indexOf("SPEAK") > -1 && (!request || request === "all" || request === "speak")) 
        maxPermissions.push(Permissions.FLAGS.SPEAK);
    else
        limitPermissions.push(Permissions.FLAGS.SPEAK);

    if (permissions.indexOf("STREAM") > -1 && (!request || request === "all"))
        maxPermissions.push(Permissions.FLAGS.STREAM);
    else
        limitPermissions.push(Permissions.FLAGS.STREAM);

    const messagePermissions = channelOrArray.allow ? 
        channelOrArray.allow.map(t => t === 2048 || t === 2048n ? "SEND_MESSAGES" : "NONE") :
        channelOrArray.permissionsFor(roleId ?? channel.guild.roles.everyone.id).toArray();

    if (messagePermissions.indexOf("SEND_MESSAGES") > -1) 
        maxPermissions.push(Permissions.FLAGS.SEND_MESSAGES);
    else
        limitPermissions.push(Permissions.FLAGS.SEND_MESSAGES);

    return {
        allow: maxPermissions,
        deny: limitPermissions
    };
}

module.exports = getPermissions;