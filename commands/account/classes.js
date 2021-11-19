const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');
const { userSchema } = require('../../database/schemas/user');

const ClassesMenu = require('../../classes/menus/ClassesMenu');

module.exports = {
    name: 'classes',
    description: `Add or remove classes all in one menu!`,
    guilds: ['903924793542311947', '910745675006877757'],
    global: false,
    async execute( interaction ) {
        
        await interaction.deferReply({ ephemeral: true });
        var embed = new MessageEmbed({ color: interaction.client.config.colors.positive });

        // search for user in the database
        const User = mongoose.model('User', userSchema );
        const Server = mongoose.model('Server', serverSchema );
        const foundUser = await User.findOne({ userId: interaction.user.id }).exec();
        const foundServer = await Server.findOne({ guildId: interaction.guild.id }).exec();

        // if no user is found, prompt with registration
        if ( !foundUser ) {
            embed
                .setTitle("♦️ Woah! You're not registered yet!")
                .setDescription("You aren't in the system!\nTo gain full access to the features of this bot, get started by using `/register`!");
            return await interaction.editReply({ embeds: [ embed ] });
        }

        // if no guild is found, prompt with notice
        if ( !foundServer ) {
            embed
                .setTitle('⚠️ Woah there! Your server admin or admins have not set this bot up yet!')
                .setDescription("If you are said admin, get started right away along with getting the full terms and conditions by typing `/serverdash` !");
        }

        // cache server
        if ( !foundUser.cachedServers.includes( interaction.guild.id ) ) foundUser.cachedServers.push( interaction.guild.id );

        console.log("Starting ClassesMenu...");
        
        return new ClassesMenu( interaction, foundUser, foundServer ).startPage();



    },
};