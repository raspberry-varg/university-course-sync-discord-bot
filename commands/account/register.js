const mongoose = require('mongoose');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'register',
    description: `Start using ${require('../../config.json').serviceName}!`,
    guilds: ['903924793542311947'],
    global: false,
    async execute( interaction ) {
        await interaction.deferReply({ ephemeral: true });
        var embed = new MessageEmbed({ color: interaction.client.config.colors.positive });

        // search for user in the database
        const User = mongoose.model('User', require('../../database/schemas/user').userSchema );
        const found = await User.findOne({ userId: interaction.user.id }).exec();

        // if a user is found, notify of registration, else prompt with registration
        if ( found ) {
            embed
                .setTitle("🎉 You're already registered!")
                .setDescription("You have full access to the features of this bot!\nIf you wish to delete your data entirely from the bot, you may use `/deactivate`.")
                .addFields({ name: "Bot Registration Date", value: "> <t:" + Math.floor( Date.parse( found.joinedBot ) / 1000 ) + ">" });
            return await interaction.editReply({ embeds: [ embed ] });
        }
        else {

            // prompt with description and legal
            embed
                .setTitle(`👋 Welcome to ${interaction.client.config.serviceName}, ${interaction.member.displayName}!`)
                .setDescription(
                    "Let's get you started as soon as possible!\n\n" +
                    "This service allows for multiple servers across NMSU Discord servers to be fully interconnected, and network with each other by allowing easy assignment of class roles, creation of class chats, and even pushing announcements to all users in a certain class.\n\n" +
                    "This will allow for new or existing servers to provide channels for certain departments, or even all depending on who joins. The bot does all the heavy lifting, all you have to do is declare which classes you are taking this semester, and the bot will take care of the rest!\n\n" +
                    "By proceeding, you agree to the Privacy Policy listed below, and acknowledge that any content in channels created by this bot are strictly the responsibility of the server owner, this bot only creates said channels but does not monitor them or endorse any content that is sent within.\n\n" +
                    "If you witness any form of academic misconduct, please be sure to file a report at https://report.nmsu.edu/#sc4."
                )
                .addFields({ name: "Semi-Legal Stuff", value: "> [Privacy Policy]()" })
                .setThumbnail( interaction.user.avatarURL() )
                .setFooter("This bot is NOT affiliated with New Mexico State University in any way, shape, or form, and never claims to be.")
            const buttons = [
                new MessageButton()
                    .setLabel('Sign me up!')
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
            interaction.channel.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60 * 1000, errors: [ 'TIME' ] })
                .then( collected => {
                    // parse accept or reject
                    switch ( collected.customId ) {
                        case 'accept':

                            // create user info in database
                            const doc = new User({ userId: interaction.user.id });
                            doc.save()
                                .then( console.log('Success!') )
                                .catch( e => console.error( e.stack ) );
                            
                            embed
                                .setTitle("You're all set!")
                                .setDescription("Welcome to the bot! To start declaring your classes, start by typing `/class add`!\nYou may now dismiss this menu.")
                            return interaction.editReply({ embeds: [ embed ], components: [] });
                        case 'reject':
                            embed = new MessageEmbed({ color: interaction.client.config.colors.positive })
                                .setAuthor(`That's alright ${interaction.member.displayName}!`, interaction.user.avatarURL())
                                .setDescription("If at any point you wish to register, don't hesitate to run `/register` again!");
                            return interaction.editReply({ embeds: [ embed ], components: [] });
                    }
                })
                .catch( error => {
                    embed = new MessageEmbed({ color: interaction.client.config.colors.positive })
                        .setAuthor(`⏰ Hey, time's up ${interaction.member.displayName}!`, interaction.user.avatarURL())
                        .setDescription("If at any point you wish to register though, don't hesitate to run `/register` again!");
                    return interaction.editReply({ embeds: [ embed ], components: [] });
                });

        }
    },
};