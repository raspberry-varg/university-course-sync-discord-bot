const verifyOneCourseTypeSupport = require('./VerifyOneCourseTypeSupport');
const verifyClassSupport = require('./VerifyOneClassSupport');
const { Mongoose } = require('mongoose');

/**
 * Refresh and delete all classes in the server that are no longer supported.
 * @param {Discord.client.interaction} interaction Discord client interaction.
 * @param {Mongoose.module} foundServer Server data from database.
 * @returns 
 */
async function refreshServerClasses( interaction, foundServer ) {
    
    // cycle through each course in course data and check against server data
    console.log("CYCLING THROUGH EACH COURSE AND CHECKING AGAINST SERVER DATA");
    console.log( foundServer.courseData );
    for ( [ key, map ] of foundServer.courseData ) {

        console.log({ map: map, key: key });

        console.log("\n\nCURRENT KEY: ");
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
            console.log("THIS ENTIRE SUBJECT IS NOT SUPPORTED");
            for ( [ course, courseData ] of map ) {

                // delete roles
                await interaction.guild.roles.fetch( courseData.roleId )
                    .then( async r => {
                        await r.delete();
                        console.log(`${r.name}(${r.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log(`ROLEID:${courseData.roleId} has already been deleted.`));
                
                // delete channels
                await interaction.guild.channels.fetch( courseData.channelId )
                    .then( async c => {
                        await c.delete();
                        console.log(`${c.name}(${c.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log(`CHANNELID:${courseData.roleId} has already been deleted.`));
                
                // delete course off the server data
                map.delete( course );
            }
            
            // delete course category
            await interaction.guild.channels.fetch( foundServer.courseParents.get( key )?.replace(/[^0-9]/g, '') )
                .then( async c => {
                    await c.delete();
                    console.log(`${c.name}(${c.id}) category has been successfully deleted.`);
                })
                .catch(() => console.log(`CATEGORY_CHANNELID:${foundServer.courseParents.get( key )} has already been deleted.`));
            foundServer.courseParents.delete( key );

            continue; // proceed as there is no need to check individual courses
        }
        console.log("THIS SUBJECT IS NOT FULLY UNSUPPORTED - PROCEEDING INDIVIDUAL CHECKS");
        
        // cycle through each course within the subject type ( I.E.   { CS: [...] }, { ENGL: [...] } )
        // await array.forEach( async value => {
        for ( [ course, courseData ] of map ) {
            console.log("\n\tCURRENT CLASS: " + course );
            
            // if server supports the course
            if ( !verifyClassSupport([ key, course ], foundServer ) ) {
                
                // delete roles
                await interaction.guild.roles.fetch( courseData.roleId )
                    .then( async r => {
                        await r.delete();
                        console.log(`${r.name}(${r.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log(`ROLEID:${courseData.roleId} has already been deleted.`));
                
                // delete channel
                await interaction.guild.channels.fetch( courseData.channelId )
                    .then( async c => {
                        await c.delete();
                        console.log(`${c.name}(${c.id}) has been successfully deleted.`)
                    })
                    .catch(() => console.log(`CHANNELID:${courseData.roleId} has already been deleted.`));
                
                // delete course off the server data
                map.delete( course );
                
            }
            else
                console.log('\tThis class is fully supported.');

        }; // end for each
        console.log();
    }//); // end outer loop
    console.log("THE OUTER LOOP HAS BEEN BROKEN");

    return Promise.resolve('Successfully reloaded.');
    
}

module.exports = refreshServerClasses