const mongoose = require('mongoose');

module.exports = {
    name: 'ping',
    description: '🟢 ALL: Replies with Pong!',
    guilds: ['903924793542311947'],
    async execute( interaction ) {
        await interaction.reply('Pong!');

        const User = mongoose.model('User', require('../../database/schemas/user').userSchema );
        const found = await User.findOne({ userId: interaction.user.id }).exec();
        if ( found )
            return await interaction.editReply({ content: "You're already registered! You are userId: " + found.userId + " and joined the bot on " + new Date( found.joinedBot ) });
        else {
            await interaction.editReply({ content: "Woah there, you need to register first! Let me get that started..." });
            const doc = new User({ userId: interaction.user.id });
            console.log(doc);

            doc.save()
                .then( console.log('Success!') )
                .catch( e => console.error( e.stack ) );
        }
    },
};