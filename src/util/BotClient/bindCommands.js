const { Collection } = require('discord.js');
const fs = require('fs');

function bindCommands( client ) {
    
    // populate command files with all available commands
    client.commands = new Collection();
    const commandFiles = fs.readdirSync('./commands').filter( file => file.endsWith('.js') );

    // check for nested commands, and populate commandFiles with them
    const commandSubDirectories = fs.readdirSync('./commands').filter( subdir => fs.statSync(`./commands/${subdir}`).isDirectory() );
    for ( let dir of commandSubDirectories ) {
        let files = fs.readdirSync(`./commands/${dir}`);
        for ( let file of files )
            commandFiles.push([ dir, file ]);
    }

    // register each command to the client
    for ( let file of commandFiles ) {
        let command;
        if ( Array.isArray( file ) )
            command = require(`../../commands/${file[0]}/${file[1]}`);
        else
            command = require(`../../commands/${file}`);
        
        // push command to commands collection
        client.commands.set( command.name, command );
    }

}

module.exports = bindCommands;