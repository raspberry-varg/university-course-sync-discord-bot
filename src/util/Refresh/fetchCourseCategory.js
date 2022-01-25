const { Guild } = require('discord.js');
const serverSchema = require('../../database/schemas/server');
const { BotClient } = require('coursesync');

/**
 * Fetch a subject's Discord category channel,
 * or create one if it does not exist, along with
 * binding any stray channels that may have been
 * left behind.
 * @param {Guild} guild 
 * @param {BotClient} client
 * @param {serverSchema} foundServer 
 * @param {*} subject 
 * @param {*} parentId 
 * @returns 
 */
module.exports = async function( guild, client, foundServer, subject, parentId ) {
    return guild.channels.fetch( parentId.toString() )
        .then( async found => {
            // if category does not exist, create a new category and store
            if ( found == undefined )
                return await guild.channels.create('⌬ ' + client.courses.get( subject.toUpperCase() ).metadata.subject, {
                    type: 4, // category
                    permissionOverwrites: [],
                }).then( async created => foundServer.courseParents.set( subject, created ) );
            
            return found;
        })
        .catch( async () => {

            return await guild.channels.create('⌬ ' + client.courses.get( subject.toUpperCase() ).metadata.subject, {
                type: 4, // category
                permissionOverwrites: [],
            }).then( async created => {

                // set to database courseParents
                foundServer.courseParents.set( subject, created );

                // re-append
                for ( const channel of foundServer.courseData.get( subject ) ) {
                    try {
                        ( await guild.channels.fetch( channel[1].channelId ) ).setParent( created, { lockPermissions: false, reason: "Re-appending to new category parent." } );
                    }
                    catch ( error ) {
                        console.log("Unable to set channel to new parent.");
                    }
                }
                return created;
                
            });
        });
}