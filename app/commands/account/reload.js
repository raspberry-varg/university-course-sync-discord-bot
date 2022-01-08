const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');
const { userSchema } = require('../../database/schemas/user');
const { MessageEmbed, Permissions } = require('discord.js');
const { ApplicationCommandOptionType: OptionTypes } = require('discord-api-types/v9');
const refreshUserClasses = require('../../classes/RefreshUserClasses');
const refreshServerClasses = require('../../classes/RefreshServerClasses');

module.exports = {
    name: 'reload',
    description: `Channels or roles not updated yet? Run this real fast to get your roles!`,
    guilds: ['903924793542311947', '910745675006877757'],
    global: false,
    options: [
        {
            name: 'roles',
            type: OptionTypes.Subcommand,
            description: 'Roles not updated? Missing a supported role? Fix it real quick with this command!',
        },
        {
            name: 'channels',
            type: OptionTypes.Subcommand,
            description: '(Administrators only) Channels in your server not updated properly? Get it fixed with this command!',
        },
        {
            name: 'all',
            type: OptionTypes.Subcommand,
            description: '(Server Owner only) Refresh all users and channels.',
        }
    ],
    async execute( interaction ) {

        await interaction.deferReply({ ephemeral: true });
        var embed = new MessageEmbed({ color: interaction.client.config.colors.positive });
        const refreshChoice = interaction.options.getSubcommand()

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

        // begin to reload based on chosen option
        console.log("BEGINNING REFRESH");
        switch( refreshChoice ) {
            case 'roles':

                let roleRefresh = new MessageEmbed( embed )
                    .setThumbnail('https://mir-s3-cdn-cf.behance.net/project_modules/disp/35771931234507.564a1d2403b3a.gif')
                    .setTitle('⏳ You got it! Refreshing all your roles...')
                    .setDescription('...cleaning up a little~ 🧹💨\n\n**Did you know?**\n' + interaction.client.config.hints[ Math.floor( Math.random() * interaction.client.config.hints.length ) ]);
                await interaction.editReply({ embeds: [ roleRefresh ] });
                // refresh user classes
                await refreshUserClasses( interaction, foundUser, foundServer, true );

                // save changes
                foundServer.markModified('courseData');
                await foundServer.save()
                    .then(() => console.log("SAVED"))
                    .catch( e => console.error(e) );
                
                roleRefresh = new MessageEmbed( embed )
                    .setTitle("✅ You're all set!")
                    .setDescription("All of your roles have been successfully cached.");
                
                await interaction.editReply({ embeds: [ roleRefresh ] });
                break;

            case 'channels':
                if ( !interaction.member.permissions.has( Permissions.FLAGS.ADMINISTRATOR ) )
                    return interaction.editReply({ content: 'Sorry, only administrators can run this command!' });
                
                // begin refresh
                let channelsRefresh = new MessageEmbed( embed )
                    .setThumbnail( process.env.PRELOADER )
                    .setTitle('⏳ You got it! Refreshing all your roles...')
                    .setDescription('...cleaning up a little~ 🧹💨\n\n**Did you know?**\n' + interaction.client.config.hints[ Math.floor( Math.random() * interaction.client.config.hints.length ) ]);
                await interaction.editReply({ embeds: [ channelsRefresh ] });
                // refresh user classes
                await refreshServerClasses( interaction, foundServer );

                // save changes
                foundServer.markModified('courseData');
                await foundServer.save()
                    .then(() => console.log("SAVED"))
                    .catch( e => console.error(e) );
                
                channelsRefresh = new MessageEmbed( embed )
                    .setTitle("✅ You're all set!")
                    .setDescription("All of your roles have been successfully cached.");
                
                await interaction.editReply({ embeds: [ channelsRefresh ] });
                break;
            
            case 'all':
                if ( interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.BOT_OWNER_ID )
                    return interaction.editReply({ content: 'Sorry, only the server owner can run this command!' });
                
                // begin refresh
                let allRefresh = new MessageEmbed( embed )
                    .setThumbnail(process.env.PRELOADER)
                    .setTitle('⏳ You got it! Refreshing all your roles...')
                    .setDescription('⚠️ **THIS MAY TAKE A WHILE**\n...cleaning up a little~ 🧹💨\n\n**Did you know?**\n'
                        + interaction.client.config.hints[ Math.floor( Math.random() * interaction.client.config.hints.length ) ]);
                    
                await interaction.editReply({ embeds: [ allRefresh ] });

                // save changes
                foundServer.markModified('courseData');
                await foundServer.save()
                    .then(() => console.log("SAVED"))
                    .catch( e => console.error(e) );
                
                // refresh user classes
                await refreshServerClasses( interaction, foundServer );
                interaction.guild.members.fetch().then( async m => {
                    
                    // search for the user in the database
                    const User = mongoose.model('User', userSchema );

                    console.log("Refreshing ALL users.");
                    for ( const [ k, member ] of m ) {
                        
                        // if bot continue
                        if ( member.user.bot ) continue;

                        // refresh
                        let userData = await User.findOne({ userId: member.user.id }).exec();
                        if ( userData ) {
                            console.log("[🔁] Refreshing data for: " + member.displayName );
                            await refreshUserClasses( interaction, userData, foundServer, true );
                        }
                        else
                            console.log("[❌] No data found: " + member.displayName );
                    }

                    // save changes
                    console.log("Refresh done.");
                    foundServer.markModified('courseData');
                    await foundServer.save();

                });
                
                allRefresh = new MessageEmbed( embed )
                    .setTitle("✅ You're all set!")
                    .setDescription("All of your roles have been successfully cached.");
                
                await interaction.editReply({ embeds: [ allRefresh ] });
                break;

            }

    },
};