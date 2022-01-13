const verifyOneSubjectSupport = require('../VerifySupport/VerifyOneSubjectSupport');
const verifyClassSupport = require('../VerifySupport/VerifyOneClassSupport');
const serverSchema = require('../../database/schemas/server');
const { Interaction } = require('discord.js');

/**
 * Refresh and delete all classes in the server that are no longer supported.
 * @param {Interaction} interaction Discord client interaction.
 * @param {serverSchema} foundServer Server data from database.
 * @returns {Promise<string>}
 */
async function refreshServerClasses( interaction, foundServer ) {
    
    // cycle through each course in course data and check against server data
    for ( let [ subject, courseMap ] of foundServer.courseData ) {

        // if the subject is NOT supported in the server
        if ( !verifyOneSubjectSupport( subject, foundServer ) ) {

            for ( let [ course, courseData ] of courseMap ) {

                // delete roles
                await interaction.guild.roles.fetch( courseData.roleId )
                    .then( async r => await r.delete() )
                    .catch();
                
                // delete channels
                await interaction.guild.channels.fetch( courseData.channelId )
                    .then( async c => await c.delete() )
                    .catch();
                
                // delete course off the server data
                courseMap.delete( course );

            }
            
            // delete course category
            await interaction.guild.channels.fetch( foundServer.courseParents.get( subject )?.replace(/[^0-9]/g, '') )
                .then( async c => await c.delete() )
                .catch();
            foundServer.courseParents.delete( subject );

            continue; // proceed as there is no need to check individual courses
            
        }

        
        // cycle through each course within the subject type ( I.E.   { CS: [...] }, { ENGL: [...] } )
        for ( let [ course, courseData ] of courseMap ) {

            // if server does NOT support the course
            if ( !verifyClassSupport([ subject, course ], foundServer ) ) {
                
                // delete roles
                await interaction.guild.roles.fetch( courseData.roleId )
                    .then( async r => await r.delete() )
                    .catch();
                
                // delete channel
                await interaction.guild.channels.fetch( courseData.channelId )
                    .then( async c => await c.delete() )
                    .catch();
                
                // delete course off the server data
                courseMap.delete( course );
                
            }

        } // end for [ course, courseData ] : courseMap

    } // end for [ subject, courseMap ] : server.courseData

    return Promise.resolve('Successfully reloaded.');
    
}

module.exports = refreshServerClasses