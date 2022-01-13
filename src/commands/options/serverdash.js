const mongoose = require('mongoose');
const serverSchema = require('../../database/schemas/server');
const { userSchema } = require('../../database/schemas/user');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const ServerDashboardMenu = require('../../util/menus/ServerDashboardMenu');

module.exports = {
    name: 'serverdash',
    description: `(Administrator Priveleges Required) Your all-in-one menu for adding and removing supported classes!`,
    guilds: ['903924793542311947', '910745675006877757'],
    global: false,
    async execute( interaction ) {
        
        await interaction.deferReply({ ephemeral: true });
        var embed = new MessageEmbed({ color: interaction.client.config.colors.positive });

        // check permissions
        if ( !interaction.member.permissions.has( Permissions.FLAGS.ADMINISTRATOR ) )
            return interaction.editReply({ embeds: [
                embed.setTitle('❌ You need administrative priveleges to execute this command.')
            ]});

        // search for user in the database
        const User = mongoose.model('User', userSchema );
        const Server = mongoose.model('Server', serverSchema );
        const foundUser = await User.findOne({ userId: interaction.user.id }).exec();
        const foundServer = await Server.findOne({ guildId: interaction.guild.id }).exec();

        // if a user is found, notify of registration, else prompt with registration
        if ( !foundUser ) {
            embed
                .setTitle("♦️ Woah! You're not registered yet!")
                .setDescription("You aren't in the system!\nTo gain full access to the features of this bot, get started by using `/register`!");
            return await interaction.editReply({ embeds: [ embed ] });
        }
        if ( !foundServer ) {

            // prompt with description and legal
            embed
                .setTitle(`👋 Welcome to ${interaction.client.config.serviceName}, ${interaction.member.displayName}!`)
                .setDescription(
                    "Let's get you started as soon as possible!\n\n" +
                    "This pilot program allows for multiple servers across NMSU Discord servers to be fully interconnected, and network with each other by allowing easy assignment of class roles, creation of class chats, and even pushing announcements to all users in a certain class.\n\n" +
                    "This will allow for new or existing servers to provide channels for certain departments, or even all depending on who joins. The bot does all the heavy lifting, all you have to do is declare which classes you are taking this semester, and the bot will take care of the rest!\n\n" +
                    "By proceeding, you agree to the Privacy Policy listed below, and fully acknowledge and agree to the following:\n\n" +
                    interaction.client.config.disclaimer + "\n\n" +
                    "> If you witness any form of academic misconduct, please be sure to file a report at https://report.nmsu.edu/#sc4."
                )
                .addFields({ name: "Semi-Legal Stuff", value: "> [Privacy Policy]()" })
                .setThumbnail( interaction.guild.iconURL() )
                .setFooter("This bot is NOT affiliated with New Mexico State University in any way, shape, or form, and never claims to be.", interaction.guild.iconURL())
            const buttons = [
                new MessageButton()
                    .setLabel('Sign my server up!')
                    .setCustomId('accept')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setLabel('Better not...')
                    .setCustomId('reject')
                    .setStyle('DANGER'),
            ]
            const buttonRow = new MessageActionRow().addComponents( buttons );
            await interaction.editReply({ embeds: [ embed ], components: [ buttonRow ] });

            // collect accept / reject
            const filter = ( button ) => {
                button.deferUpdate();
                return button.user.id === interaction.user.id, button.channel.id === interaction.channel.id;
            };
            await interaction.channel.awaitMessageComponent({ filter: filter, componentType: 'BUTTON', time: 2 * 60 * 1000, errors: [ 'TIME' ] })
                .then( collected => {
                    // parse accept or reject
                    switch ( collected.customId ) {
                        case 'accept':

                            // create user info in database
                            const doc = new Server({ guildId: interaction.guild.id });
                            doc.save()
                                .then( console.log('Successfully signed up ' + interaction.guild.name + '!') )
                                .catch( e => console.error( e.stack ) );
                            
                            embed
                                .setTitle("You're all set!")
                                .setDescription(`Welcome aboard, **${interaction.guild.name}**! To start setting up which classes you want to support, start by typing \`/serverdash\` again!\nYou may now dismiss this menu.\``)
                            return interaction.editReply({ embeds: [ embed ], components: [] });
                        case 'reject':
                            embed = new MessageEmbed({ color: interaction.client.config.colors.positive })
                                .setAuthor(`That's alright ${interaction.member.displayName}!`, interaction.user.avatarURL())
                                .setDescription("If at any point you wish to get your server up and running, don't hesitate to run `/serverdash` again!");
                            return interaction.editReply({ embeds: [ embed ], components: [] });
                    }
                })
                .catch( error => {
                    embed = new MessageEmbed({ color: interaction.client.config.colors.positive })
                        .setAuthor(`⏰ Hey, time's up ${interaction.member.displayName}!`, interaction.user.avatarURL())
                        .setDescription("If at any point you wish to register your server though, don't hesitate to run `/serverdash` again!");
                    return interaction.editReply({ embeds: [ embed ], components: [] });
                });

            return;
        }


        // finally, open dashboard
        try {
            return new ServerDashboardMenu( interaction, foundServer ).startPage();
        }
        catch ( error ) {
            console.log( error );
            interaction.editReply({ content: "Something went wrong!\n" + error });
        }

    },
};