const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const allowedPermissions = require("../logic/permissionsLogic");
const isModWithAccess = require("../logic/modCheckLogic");
const logActivity = require("../logic/logActivity");
const { getLocalizations, getLang } = require("../lang");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
        .setNameLocalizations(getLocalizations("command_add", "add"))
		.setDescription('Give a user access to this channel')
        .setDescriptionLocalizations(getLocalizations("command_add_description", "Give a user access to this channel"))
        .addUserOption(option =>
            option.setName("user")
                .setNameLocalizations(getLocalizations("command_add_param_user", "user"))
                .setDescription("The user you would like to invite")
                .setDescriptionLocalizations(getLocalizations("command_add_param_user_description", "The user you would like to invite"))
                .setRequired(true))
        .addStringOption(option => 
            option.setName("permissions")
                .setNameLocalizations(getLocalizations("command_add_param_permissions", "permissions"))
                .setDescription("Permissions you would like to give the user")
                .setDescriptionLocalizations(getLocalizations("command_add_param_permissions_description", "Permissions you would like to give the user"))
                .addChoices(
                    { name: "All", value: "all", name_localizations: getLocalizations("command_add_param_permissions_option_all", "All") },
                    { name: "Speak", value: "speak", name_localizations: getLocalizations("command_add_param_permissions_option_speak", "Speak") },
                    { name: "Text", value: "send_messages", name_localizations: getLocalizations("command_add_param_permissions_option_text", "Text") },
                    { name: "Listen", value: "listen", name_localizations: getLocalizations("command_add_param_permissions_option_listen", "Listen") }
                )),
	async execute(interaction) {
        try {
            const lang = interaction.guild.preferredLocale;

            await logActivity(
                interaction.client, 
                interaction.guild.id, 
                getLang(lang, "command_add_log_name", "User added to VC"), 
                getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, interaction.toString()));

            const invitedUser = interaction.options.getUser("user");
            const request = interaction.options.getString("permissions");
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);
    
            if (invitedUser.bot) {
                await interaction.reply({ 
                    content: getLang(lang, "command_add_bot_error", "Bots cannot be invited to voice chat"), 
                    ephemeral: true 
                });
            } else if (interaction.id === invitedUser.id) {
                await interaction.reply({ 
                    content: getLang(lang, "command_add_already_have_access", "You already have access"),
                    ephemeral: true 
                });
            } else if (ownedChannel) {
                let channel;

                try {
                    channel = await interaction.guild.channels.fetch(ownedChannel.id);
                } catch (nochannel) {
                    if (nochannel.message === "Unknown Channel")
                        await deleteClone(ownedChannel.id);
                        
                    await interaction.reply({ 
                        content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                        ephemeral: true 
                    });
                    return;
                }

                // make sure this user isn't already a mod with access
                if (isModWithAccess(channel, invitedUser.id)) {
                    // user is a mod and can already connect
                    await interaction.reply({ 
                        content: getLang(lang, "command_add_mod_has_access", "This moderator already has access"),
                        ephemeral: true 
                    });
                    return;
                }

                const currentPerms = {}

                try {
                    // attempt to pull the current permissions
                    channel.permissionOverwrites.cache.map(t => {
                        currentPerms[t.id] = {};
                        t.allow.toArray().forEach(perm => currentPerms[t.id][perm] = true);
                        t.deny.toArray().forEach(perm => currentPerms[t.id][perm] = false);
                    });
                } catch {}
                
                const perms = allowedPermissions(ownedChannel.permissions, ownedChannel.roleId, request);
    
                await channel.permissionOverwrites.create(invitedUser.id, {
                    ...(currentPerms[invitedUser.id] ?? {}), // this is required to maintain the default permissions
                    CONNECT: true,
                    STREAM: perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                    SPEAK: perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1,
                    SEND_MESSAGES: perms.allow.indexOf(Permissions.FLAGS.SEND_MESSAGES) > -1
                });
                
                if (ownedChannel.ping ?? true) {
                    await interaction.reply({ 
                        content: getLang(lang, "command_add_user_can_join", "<@%1$s> can now join <#%2$s>", invitedUser.id, ownedChannel.id)
                    });
                }
            } else {
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
            }
        } catch (err) {
            console.log(`Error in /add: ${err}`);
        }
	},
};