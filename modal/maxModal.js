const { Modal, CommandInteraction, TextInputComponent, MessageActionRow } = require('discord.js');
const logActivity = require("../logic/logActivity");
const { getOwnedChannel, deleteClone } = require("../dal/databaseApi");
const { getLang } = require("../lang");
const { execute } = require("../commands/max");

/**
 * 
 * @param {CommandInteraction} interaction 
 */
async function createModal(interaction) {
    try {
        const lang = interaction.guild.preferredLocale;
            
        await logActivity(interaction.client, 
            interaction.guild.id, 
            getLang(lang, "command_max_modal_log_name", "User loaded max modal"), 
            getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, getLang(lang, "command_max_modal_description", "Clicked button 'max'")));

        const guildId = interaction.guild.id;
        const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);

        if (ownedChannel) {
            try {
                await interaction.guild.channels.fetch(ownedChannel.id);
            } catch (nochannel) {
                if (nochannel.message === "Unknown Channel")
                    await deleteClone(ownedChannel.id);
                    
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
                return;
            }
        } else {
            await interaction.reply({ 
                content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                ephemeral: true 
            });
            return;
        }

        const modal = new Modal()
            .setCustomId("maxmodal")
            .setTitle(getLang(lang, "command_max_modal_title", "Set max users for your voice chat"));

        const maxMembersInput = new TextInputComponent()
            .setCustomId("limit")
            .setLabel(getLang(lang, "command_max_modal_param_limit", "The max number of users"))
            .setStyle("SHORT");

        const firstActionRow = new MessageActionRow().addComponents(maxMembersInput);

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    } catch (err) {
        console.log(`Error in max modal: ${err}`);
    }
}

const onlyNumbers = /^\d*$/;

/**
 * 
 * @param {CommandInteraction} interaction 
 */
async function modalSubmit(interaction) {
    try {
        const lang = interaction.guild.preferredLocale;
            
        await logActivity(interaction.client, 
            interaction.guild.id, 
            getLang(lang, "command_max_modalsubmit_log_name", "User submitted max modal"), 
            getLang(lang, "command_user_used", "<@%1$s> used:\n %2$s", interaction.user.id, getLang(lang, "command_max_modalsubmit_description", "Submitted max modal")));

        const guildId = interaction.guild.id;
        const ownedChannel = await getOwnedChannel(interaction.member.user.id, guildId);

        if (ownedChannel) {
            try {
                await interaction.guild.channels.fetch(ownedChannel.id);
            } catch (nochannel) {
                if (nochannel.message === "Unknown Channel")
                    await deleteClone(ownedChannel.id);
                    
                await interaction.reply({ 
                    content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                    ephemeral: true 
                });
                return;
            }
        } else {
            await interaction.reply({ 
                content: getLang(lang, "command_you_dont_own_vc", "You do not own a voice chat. Join a clonable voice chat to claim it"), 
                ephemeral: true 
            });
            return;
        }

        // make sure this interaction contains a limit and it's only a number
        const limit = interaction.fields.getTextInputValue('limit');

        if (!onlyNumbers.test(limit)) {
            // it's not just numbers
            await interaction.reply({ 
                content: getLang(lang, "command_max_modal_response_not_numbers", "The limit must be a number from 0 to 99"), 
                ephemeral: true 
            });
            return;
        }

        const limitNumber = limit ? parseInt(limit) : 0;

        if (limitNumber < 0 || limitNumber > 99) {
            await interaction.reply({ 
                content: getLang(lang, "command_max_modal_response_not_numbers", "The limit must be a number from 0 to 99"), 
                ephemeral: true 
            });
            return;
        }

        await execute(interaction, limitNumber);
    } catch (err) {
        console.log(`Error in max modal: ${err}`);
    }
}

module.exports = {
    createModal,
    modalSubmit
};