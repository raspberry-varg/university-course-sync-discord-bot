const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const inviteLink = process.env.INVITE_LINK;

module.exports = {
    name: 'invite',
    description: 'Add me to your server!',
    guilds: ['903924793542311947', '910745675006877757'],
    async execute( interaction ) {
        await interaction.reply({
            embeds: [
                new MessageEmbed({
                    color: interaction.client.config.colors.neutral,
                    thumbnail: { url: interaction.user.avatarURL() },
                    title: `♾️ Hey there, ${interaction.member.displayName}!`,
                    description: `__**Want to bring ${interaction.client.config.serviceName} directly to your community?**__\n>>> \nNow ya can! 🎉\n\n` +
                        "This service allows for multiple servers across NMSU Discord servers to be fully interconnected, and network with each other by allowing easy assignment of class roles, creation of class chats, and even pushing announcements to all users in a certain class.\n\n" +
                        "This will allow for new or existing servers to provide channels for certain departments, or even all depending on who joins. The bot does all the heavy lifting, all you have to do is declare which classes you are taking this semester, and the bot will take care of the rest! 🍵"
                }),
            ],
            components: [
                new MessageActionRow().addComponents([
                    new MessageButton()
                        .setLabel('Invite me!')
                        .setStyle('LINK')
                        .setURL( inviteLink ),
                ]),
            ],
            ephemeral: true });
    },
};