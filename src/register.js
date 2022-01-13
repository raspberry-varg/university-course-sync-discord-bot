const Discord = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const GUILDS = [/*'903924793542311947',*/ '910745675006877757'];

/**
 * Registers all slash commands from the client.
 * @param {Discord.Client} client Discord client.
 * @returns {Promise<String>}
 */
async function registerClientCommands( client ) {

    const commands = client.commands.map( ({ execute, ...data }) => data );
    const Rest = new REST({ version: '9' }).setToken( process.env.CLIENT_TOKEN );
    const queue = [];
    // const DELETE_LOCALS = true;
    // var deletePromises = [];
    
    // if ( DELETE_LOCALS ) {

    //     for ( g of GUILDS )
    //         deletePromises.push(
    //             Rest.put(
    //                 Routes.applicationGuildCommands( process.env.CLIENT_ID, g ), { body: [] }
    //             )
    //         );

    //     await Promise.all( deletePromises );
    
    // }
    
    queue.push(
        Rest.put(
            Routes.applicationCommands( process.env.CLIENT_ID ), { body: commands },
        )
    );

    for ( command of commands ) {
    
        // register command if being deployed in guilds
        for ( g of GUILDS ) {
            queue.push( client.guilds.cache.get( g )?.commands.set( commands ) );
            queue.push(
                Rest.put(
                    Routes.applicationGuildCommands( process.env.CLIENT_ID, g ), { body: commands },
                )
            );
        }
        
    }

    // ensure all items in queue complete
    await Promise.all( queue );
    return Promise.resolve('Successfully reloaded all application commands.');

}

module.exports = registerClientCommands;