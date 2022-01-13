const verifyOneCourseTypeSupport = require('../VerifySupport/VerifyOneCourseTypeSupport');
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
    
    const debugId = `[${foundServer.guildId}] `;

    // cycle through each course in course data and check against server data
    console.log( debugId + "CYCLING THROUGH EACH COURSE AND CHECKING AGAINST SERVER DATA");
    console.log( foundServer.courseData );
    for ( [ key, map ] of foundServer.courseData ) {

        console.log({ map: map, key: key });

        console.log( debugId + "\n\nCURRENT KEY: ");
        console.log( key );
        /*
            * Okay so:
            * 
            * 1) Verify that the course subject is NOT supported
            * 2) If the course subject is not explicitly unsupported, check individual classes.
            * 3) Delete data, roles, and channels when necessary.
            * 
            */

        // check to ensure the key is valid in the server
        if ( !verifyOneCourseTypeSupport( key, foundServer ) ) {
            console.log( debugId + "THIS ENTIRE SUBJECT IS NOT SUPPORTED");
            for ( [ course, courseData ] of map ) {

                // delete roles
                await interaction.guild.roles.fetch( courseData.roleId )
                    .then( async r => {
                        await r.delete();
                        console.log( debugId + `${r.name}(${r.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log( debugId + `ROLEID:${courseData.roleId} has already been deleted.`));
                
                // delete channels
                await interaction.guild.channels.fetch( courseData.channelId )
                    .then( async c => {
                        await c.delete();
                        console.log( debugId + `${c.name}(${c.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log( debugId + `CHANNELID:${courseData.roleId} has already been deleted.`));
                
                // delete course off the server data
                map.delete( course );
            }
            
            // delete course category
            await interaction.guild.channels.fetch( foundServer.courseParents.get( key )?.replace(/[^0-9]/g, '') )
                .then( async c => {
                    await c.delete();
                    console.log( debugId + `${c.name}(${c.id}) category has been successfully deleted.`);
                })
                .catch(() => console.log( debugId + `CATEGORY_CHANNELID:${foundServer.courseParents.get( key )} has already been deleted.`));
            foundServer.courseParents.delete( key );

            continue; // proceed as there is no need to check individual courses
        }
        console.log( debugId + "THIS SUBJECT IS NOT FULLY UNSUPPORTED - PROCEEDING INDIVIDUAL CHECKS");
        
        // cycle through each course within the subject type ( I.E.   { CS: [...] }, { ENGL: [...] } )
        // await array.forEach( async value => {
        for ( [ course, courseData ] of map ) {
            console.log( debugId + "\n\tCURRENT CLASS: " + course );
            
            // if server supports the course
            if ( !verifyClassSupport([ key, course ], foundServer ) ) {
                
                // delete roles
                await interaction.guild.roles.fetch( courseData.roleId )
                    .then( async r => {
                        await r.delete();
                        console.log( debugId + `${r.name}(${r.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log( debugId + `ROLEID:${courseData.roleId} has already been deleted.`));
                
                // delete channel
                await interaction.guild.channels.fetch( courseData.channelId )
                    .then( async c => {
                        await c.delete();
                        console.log( debugId + `${c.name}(${c.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log( debugId + `CHANNELID:${courseData.roleId} has already been deleted.`));
                
                // delete course off the server data
                map.delete( course );
                
            }
            else
                console.log( debugId + '\tThis class is fully supported.');

        }; // end for each
        console.log();
    }//); // end outer loop
    console.log( debugId + "THE OUTER LOOP HAS BEEN BROKEN");

    return Promise.resolve('Successfully reloaded.');
    
}

module.exports = refreshServerClasses