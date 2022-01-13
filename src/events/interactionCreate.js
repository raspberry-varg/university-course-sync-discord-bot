const fs = require('fs');

module.exports = {
    name: 'interactionCreate',
    async execute( interaction ) {

        // route interactions
        if ( interaction.isCommand() )
            return require('./interactions/command')( interaction );
        
    }
}