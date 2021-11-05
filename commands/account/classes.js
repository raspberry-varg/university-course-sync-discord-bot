const mongoose = require('mongoose');
const { ApplicationCommandOptionType: OptionTypes } = require('discord-api-types/v9');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const AddMenu = require('../../classes/AddMenu');

module.exports = {
    name: 'classes',
    description: `Add or remove classes all in one menu!`,
    guilds: ['903924793542311947'],
    global: false,
    async execute( interaction ) {
        
        await interaction.deferReply({ ephemeral: true });
        var embed = new MessageEmbed({ color: interaction.client.config.colors.positive });

        // search for user in the database
        const User = mongoose.model('User', require('../../database/schemas/user').userSchema );
        const found = await User.findOne({ userId: interaction.user.id }).exec();

        // if a user is found, notify of registration, else prompt with registration
        if ( !found ) {
            embed
                .setTitle("♦️ Woah! You're not registered yet!")
                .setDescription("You aren't in the system!\nTo gain full access to the features of this bot, get started by using `/register`!");
            return await interaction.editReply({ embeds: [ embed ] });
        }
        else {

            found.classes?.set('cs278');
            found.classes = new Map();
            found.classes.set('cs', ['272', '278']);
            found.classes.set('engl', ['1102', '2210']);
            await found.save();
            console.log( found.classes );
            console.log("Starting AddMenu...");
            return new AddMenu( interaction, found );


        }
    },
};