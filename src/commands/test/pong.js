module.exports = {
    name: 'pong',
    description: 'Replies with Ping!',
    guilds: ['903924793542311947', '910745675006877757'],
    async execute( interaction ) {
        await interaction.reply('Ping!');
        if ( interaction.user.id == process.env.OWNER_ID )
            await interaction.client.emit('guildMemberAdd', interaction.member );
    },
};