const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const { userSchema } = require('../database/schemas/user');
const serverSchema = require('../database/schemas/server');
const refreshUserClasses = require('../classes/RefreshUserClasses');
const User = mongoose.model('User', userSchema );
const Server = mongoose.model('Server', serverSchema );

module.exports = {
    name: 'guildMemberAdd',
    async execute( member, client ) {

        console.log(`Member ${member.displayName}(${member.user.id}) has joined ${member.guild.name}(${member.guild.id})`);
        // search for user in the database
        const foundUser = await User.findOne({ userId: member.user.id }).exec();
        const foundServer = await Server.findOne({ guildId: member.guild.id }).exec();
        var embed = new MessageEmbed({ color: client.config.colors.positive });

        // if no user is found return
        if ( !foundUser ) {
            return console.log('This user is not a part of Course Sync!');
        }

        // if no guild is found, prompt with notice
        if ( !foundServer ) {
            embed
                .setTitle('⚠️ Hey there! Your server admin or admins have not set this bot up yet!')
                .setDescription("If you are said admin, get started right away along with getting the full terms and conditions by typing `/serverdash` !");
            
            try {
                member.user.send({ embeds: [ embed ] });
            }
            catch ( error ) {
                console.log("Unable to send !foundServer message to user.");
            }

            return;
        }

        // refresh data and cache server
        await refreshUserClasses( member, foundUser, foundServer );
        foundUser.cachedServers.push( member.guild.id );

        // save changes
        console.log("Refresh done.");
        foundServer.markModified('courseData');
        await foundServer.save();

        embed
            .setTitle('✨ Hey there! Thanks for using ' + client.config.serviceName + '!')
            .setDescription("Guess what?? **" + member.guild.name + "** uses " + client.config.serviceName + "!\n\n"
                + "Your classes have been automatically transferred, and all the hard work's done.\nNow sit back, drink a coffee or tea, whichever you prefer 🍵.");
    
        try {
            member.user.send({ embeds: [ embed ] }).catch( error => console.error(error) );
        }
        catch ( error ) {
            console.log("Unable to send !foundServer message to user.");
        }

        return;
        
    }
}