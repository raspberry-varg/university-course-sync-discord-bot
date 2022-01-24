const mongoose = require('mongoose');

module.exports = {
    name: 'ping',
    description: 'Replies with Pong, and your status!',
    guilds: ['903924793542311947', '910745675006877757'],
    async execute( interaction ) {
        await interaction.reply({ content: 'Pong! Loading your stats...', ephemeral: true });

        if ( interaction.user.id == process.env.OWNER_ID )
            return await interaction.client.emit('guildCreate', interaction.guild );
        
        const User = mongoose.model('User', require('../../database/schemas/user').userSchema );
        const found = await User.findOne({ userId: interaction.user.id }).exec();
        if ( found )
            return await interaction.editReply({ content: "Pong! Stats loaded!\nYou're already registered! You are userId: " + found.userId + " and joined the bot on " + new Date( found.joinedBot ) });
        else {
            await interaction.editReply({ content: "Pong! Stats loaded!\nNo user profile found in the system! If you'd like to get started, go ahead and use `/register` to get started!" });
        }
    },
};