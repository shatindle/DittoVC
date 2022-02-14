const { Permissions } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getOwnedChannel } = require("../dal/databaseApi");
const allowedPermissions = require("../logic/permissionsLogic");
const logActivity = require("../logic/logActivity");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('public')
		.setDescription('Make this channel public'),
	async execute(interaction) {
        try {
            await logActivity(interaction.client, interaction.guild.id, "User made VC public", `<@${interaction.user.id}> used:\n ${interaction.toString()}`);
            
            const guildId = interaction.guild.id;
            const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);

            if (ownedChannel) {
                const channel = await interaction.guild.channels.fetch(ownedChannel.id);
                const perms = allowedPermissions(ownedChannel.publicPermissions ?? ownedChannel.permissions, interaction.guild.roles.everyone.id);

                channel.permissionOverwrites.cache.each(async perm => {
                    if (perm.id !== interaction.client.user.id && perm.type === "member") {
                        let allowed = new Permissions(perm.allow);
                        let streamPerms, speakPerms;

                        if (ownedChannel.owner === perm.id) {
                            // this is the owner, they get full perms allowed
                            streamPerms = perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1;
                            speakPerms = perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1;
                        } else {
                            streamPerms = perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1 && allowed.has(Permissions.FLAGS.STREAM);
                            speakPerms = perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1 && allowed.has(Permissions.FLAGS.SPEAK);
                        }

                        await channel.permissionOverwrites.create(perm.id, {
                            CONNECT: true,
                            STREAM: streamPerms,
                            SPEAK: speakPerms
                        });

                        if (!streamPerms) {
                            // if the user is streaming, disconnect them
                            const member = await interaction.guild.members.fetch(perm.id);

                            if (member.voice.streaming && member.voice.channel && member.voice.channel.id === ownedChannel.id) {
                                await member.voice.disconnect();
                            }
                        }
                    }
                });

                await channel.permissionOverwrites.create(interaction.guild.roles.everyone.id, {
                    CONNECT: true,
                    STREAM: perms.allow.indexOf(Permissions.FLAGS.STREAM) > -1,
                    SPEAK: perms.allow.indexOf(Permissions.FLAGS.SPEAK) > -1
                });
                
                await interaction.reply({ content: `everyone can now join <#${ownedChannel.id}>`, ephemeral: true });
            } else {
                await interaction.reply({ content: `You do not own a voice chat. Join a clonable voice chat to claim it`, ephemeral: true });
            }
        } catch (err) {
            console.log(`Error in /public: ${err}`);
        }
	},
};