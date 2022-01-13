const fs = require('fs');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');

module.exports = {
    name: 'guildCreate',
    async execute( guild ) {

        console.log(`🎉 I've been added to a brand new server!\n\tI am now in ${guild.name}(${guild.id})`);
        
        // send welcome message
        const channels = await guild.channels.fetch();
        const channel = channels.find( channel => channel.type == 'GUILD_TEXT' && channel.permissionsFor(guild.me).has('SEND_MESSAGES') )
        if ( !channel ) return console.log("Unable to send.");
        else
            await channel.send({
                embeds: [
                    new MessageEmbed({
                        color: guild.client.config.colors.neutral,
                        thumbnail: { url: guild.iconURL() },
                        title: `♾️ Hey there, ${guild.name}!`,
                        description: `🎉 __**Thank you for making me a part of your community!**__\n\n` +
                            "> This service allows for multiple servers across NMSU Discord servers to be fully interconnected, and network with each other by allowing easy assignment of class roles, creation of class chats, and even pushing announcements to all users in a certain class.\n> \n" +
                            "> This will allow for new or existing servers to provide channels for certain departments, or even all depending on who joins. The bot does all the heavy lifting, all you have to do is declare which classes you are taking this semester, and the bot will take care of the rest! 🍵\n\n" +
                            "🔮 __**To get your server up and running, type in `/serverdash`!**__\n" +
                            "> If you are just a normal user and this server is ready, send `/register` to get started!\n" +
                            "> Already registered for Course Sync? Wait for your server admin to register this server!\n\n" +
                            ":tea: __**Thank you for using Course Sync**__\n> Course Sync's mission is to provide a safe, fun, and easy way to sync their courses along school servers that offer channels for students to collaborate and share ideas within.\n> It is beyond humbling to have incredible users like yourself use Course Sync within yet another community.\n> Thank you, the best of luck for this upcoming finals, and Happy Holidays :snowflake:"
                    }),
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel('Github Repo')
                            .setStyle('LINK')
                            .setURL( process.env.GITHUB_REPO_LINK ),
                    ]),
                ],
                ephemeral: true })
            .then(() => console.log(`Successfully sent welcome message in ${channel.name}(${channel.id})`))
            .catch(() => console.log(`Unable to send welcome message in ${guild.name}(${guild.id})`));

        const owner = await guild.fetchOwner()
        if ( !owner ) return console.log('No owner')
        else
            await owner.send({
                embeds: [
                    new MessageEmbed({
                        color: guild.client.config.colors.neutral,
                        thumbnail: { url: owner.user.avatarURL() },
                        title: `♾️ Hey there, ${owner.user.username}!`,
                        description: `🎉 __**Thank you for making me a part of your community!**__\n\n` +
                            "> This service allows for multiple servers across NMSU Discord servers to be fully interconnected, and network with each other by allowing easy assignment of class roles, creation of class chats, and even pushing announcements to all users in a certain class.\n> \n" +
                            "> This will allow for new or existing servers to provide channels for certain departments, or even all depending on who joins. The bot does all the heavy lifting, all you have to do is declare which classes you are taking this semester, and the bot will take care of the rest! 🍵\n\n" +
                            "🔮 __**To get your server up and running, type in `/serverdash`!**__\n" +
                            "> Just follow the prompts, and you'll be ready in seconds!\n\n" +
                            ":tea: __**Thank you for using Course Sync**__\n> Course Sync's mission is to provide a safe, fun, and easy way for students to sync their courses along school servers that offer channels for students to collaborate and share ideas within.\n> It is beyond humbling to have incredible users like yourself use Course Sync within yet another community.\n> Thank you, the best of luck for this upcoming finals, and Happy Holidays :snowflake:"
                    }),
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel('Github Repo')
                            .setStyle('LINK')
                            .setURL( process.env.GITHUB_REPO_LINK ),
                    ]),
                ],
                ephemeral: true })
            .then(() => console.log(`Successfully sent welcome message to server owner.`))
            .catch(() => console.log(`Unable to send welcome message to server owner.`));
    }
}