module.exports = {
    name: 'ready',
    once: 'true',
    execute( client ) {
        client.user.setPresence({
            activities: [
                {
                    name: 'I am in beta',
                    type: 'WATCHING',
                },
            ],
            status: 'dnd',
        });

        let boot = client.user.tag + ' is now online!';
        console.log(`${'='.repeat( boot.length )}\n${boot}\n${'='.repeat( boot.length )}`);
    }
}