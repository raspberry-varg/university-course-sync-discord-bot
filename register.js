const Discord = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = {
    /**
     * Registers all slash commands from the client.
     * @param {Discord.Client} client Discord client.
     * @returns {Promise<String>}
     */
    async register( client ) {

        const commands = client.commands.map( ({ execute, ...data }) => data );
        const rest = new REST({ version: '9' }).setToken( process.env.CLIENT_TOKEN );
        const queue = [];

        for ( command of commands ) {

            // handle error
            if ( command.guild && command.global )
                throw new Promise.reject('Methods that are pushed to guilds cannot be pushed to global. Conflict: ' + command.name );
            
            // register command if being deployed in guilds
            if ( command.guilds )
                for ( g of command.guilds ) {
                    queue.push( client.guilds.cache.get( g )?.commands.set( commands ) );
                    queue.push(
                        rest.put(
                            Routes.applicationGuildCommands( process.env.CLIENT_ID, g ), { body: commands },
                        )
                    );
                }
            
            // register command if being deployed globally
            // if ( command.global )
            //     client.commands.set( command ).catch( e => console.error(e) );

        }

        // ensure all items in queue complete
        await Promise.all( queue );
        return Promise.resolve('Successfully reloaded all application commands.');

    }
}