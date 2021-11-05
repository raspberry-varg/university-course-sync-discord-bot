const mongoose = require('mongoose');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'deactivate',
    description: `Deactivate your account, and entirely erase your data from ${require('../../config.json').serviceName}! (This is irreversable)`,
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

            // prompt with description and legal
            embed
                .setTitle(`⚠️ ${interaction.client.config.serviceName}, deactivation request by ${interaction.member.displayName}.`)
                .setDescription(
                    "So sorry to see you go!\n\n" +
                    `__**In full accordance to the [Privacy Policy](${interaction.client.config.privacyPolicy}), your data will be entirely erased from the database, and once you delete your account, all roles will go away. Please note, this is irreversable.**__`
                )
                .setThumbnail( interaction.user.avatarURL() )
                .setFooter("This bot is NOT affiliated with New Mexico State University in any way, shape, or form, and never claims to be.")
            const buttons = [
                new MessageButton()
                    .setLabel('Delete it all.')
                    .setCustomId('accept')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setLabel('Better not...')
                    .setCustomId('reject')
                    .setStyle('SECONDARY'),
            ]
            const buttonRow = new MessageActionRow().addComponents( buttons );
            await interaction.editReply({ embeds: [ embed ], components: [ buttonRow ] });

            // collect accept / reject
            const filter = ( button ) => {
                button.deferUpdate();
                return button.user.id === interaction.user.id, button.channel.id === interaction.channel.id;
            };
            interaction.channel.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60 * 1000, errors: [ 'TIME' ] })
                .then( async collected => {
                    // parse accept or reject
                    switch ( collected.customId ) {
                        case 'accept':

                            // delete user info from the database
                            await User.findOneAndDelete({ userId: interaction.user.id });
                            
                            embed
                                .setTitle("You're all set!")
                                .setThumbnail(null)
                                .setDescription("All your data has been successfully removed from the service, and your roles have been removed. You may now dismiss this menu.")
                            return interaction.editReply({ embeds: [ embed ], components: [] });
                        case 'reject':
                            embed = new MessageEmbed({ color: interaction.client.config.colors.positive })
                                .setAuthor(`That's alright ${interaction.member.displayName}!`, interaction.user.avatarURL())
                                .setDescription("If at any point you wish to deactivate your account, don't hesitate to run `/deactivate` again!");
                            return interaction.editReply({ embeds: [ embed ], components: [] });
                    }
                })
                .catch( error => {
                    embed = new MessageEmbed({ color: interaction.client.config.colors.positive })
                        .setAuthor(`⏰ Hey, time's up ${interaction.member.displayName}!`, interaction.user.avatarURL())
                        .setDescription("If at any point you wish to deactivate your account though, don't hesitate to run `/deactivate` again!");
                    return interaction.editReply({ embeds: [ embed ], components: [] });
                });

        }
    },
};