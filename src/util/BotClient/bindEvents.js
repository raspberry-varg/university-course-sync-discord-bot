const fs = require('fs');

function bindEvents( client ) {
    // init events
    const eventFiles = fs.readdirSync('./events').filter( file => file.endsWith('.js') );
    for ( const file of eventFiles ) {
        const event = require(`../../events/${file}`);
        if ( event.once )
            client.once( event.name, (...args) => event.execute(...args, client) );
        else
            client.on( event.name, (...args) => event.execute(...args, client) );
    }
}

module.exports = bindEvents;