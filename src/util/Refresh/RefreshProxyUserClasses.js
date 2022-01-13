const { Permissions, Guild } = require('discord.js');
const { userSchema } = require('../../database/schemas/user');
const serverSchema = require('../../database/schemas/server');
const fetchCourseCategory = require('./fetchCourseCategory');
const verifyOneCourseTypeSupport = require('../VerifySupport/VerifyOneSubjectSupport');
const verifyClassSupport = require('../VerifySupport/VerifyOneClassSupport');
require('coursesync/types/Subject');

/**
 * Scan through user's classes and create roles and channels
 * for supported courses on servers EXTERNAL to the original
 * one in which the refresh was initially called in.
 * @param {Guild} guildSnowflake Original interaction.
 * @param {BotClient} client BotClient
 * @param {userSchema} foundUser User data from database.
 * @param {serverSchema} foundServer Server data from database.
 * @returns {Promise<string>} Promise when completed.
 */
async function refreshProxyUserClasses( guildSnowflake, client, foundUser, foundServer ) {
    
    // cycle through each course and check against server data
    for ( let [ subject, courseArray ] of foundUser.classes ) {

        /*
         * Verification
         * ------------
         * 
         * 1) Continue if subject is not hosted.
         * 2) Get and filter subject channel category ID from database.
         *    Default to '-1' if none found.
         * 3) Fetch subject category channel.
         */

        // check to ensure the key is valid in the server
        if ( !verifyOneCourseTypeSupport( subject, foundServer ) )
            continue;
        
        // grab category for the current course key or create and save if non-existent
        var parentId = foundServer.courseParents.get( subject )?.replace(/[^0-9]/g, '') || '-1';


        // retrieve course category channel
        await guildSnowflake.channels.fetch();
        const courseCategory = await fetchCourseCategory( guildSnowflake, guildSnowflake.client, foundServer, subject, parentId );



        // if database does NOT have a config set for current key, create
        if ( !foundServer.courseData.has( subject ) )
            foundServer.courseData.set( subject, {} );
        
        // cycle through each course within the subject type ( I.E.   { CS: [...] }, { ENGL: [...] } )
        for ( let courseNum of courseArray ) {
            courseNum = courseNum.toString();

            // if server supports the course
            if ( verifyClassSupport([ subject, courseNum ], foundServer ) ) {

                // check to see if the course is a GRAD course linked to an UNDERGRAD course
                let checkLinkCache = interaction.client.courses.get( subject.toUpperCase() ).listings.get( courseNum ).link;
                if ( checkLinkCache != null )
                    courseNum = checkLinkCache.toString();

                // check if server has role and channel data for the given course
                let courseConfig = foundServer.courseData.get( subject ).get( courseNum );
                if ( !courseConfig ) {
                    courseConfig = {
                        roleId: '-1',
                        channelId: '-1',
                    }
                    foundServer.courseData.get( subject ).set( courseNum, courseConfig );
                }



                // create new role and channel dedicated to the course
                var newRoleCreated = false;
                const fetchedRole = await new Promise( resolve => {
                    guildSnowflake.roles.fetch( courseConfig.roleId.toString() )
                        .then( found => {
                            if ( found != undefined ) { // if found add to member
                                memberObj.roles.add( found ).catch( e => console.error( e ) );
                                resolve( found );
                            }
                            else { // create role
                                guildSnowflake.roles.create({
                                    name: subject.toUpperCase() + courseNum,
                                    permissions: [],
                                    color: foundServer.roleColor,
                                }).then( created => {

                                    // mark flag and save to database
                                    newRoleCreated = true;
                                    foundServer.courseData.get( subject ).get( courseNum ).roleId = created.id;
        
                                    memberObj.roles.add( created ).catch( e => console.error( e ) );
                                    resolve( created );
                                });
                            }
                    });
                });

                // fetch given channel
                const fetchedChannel = await guildSnowflake.channels.fetch( courseConfig.channelId.toString() )
                    .then( found => { return found })
                    .catch( async () => {
                        return await guildSnowflake.channels.create( subject.toUpperCase() + courseNum, {
                            type: 0, // guild text
                            parent: courseCategory?.id || courseCategory,
                            permissionOverwrites: [
                                {
                                    id: guildSnowflake.id,
                                    type: 0, // role
                                    deny: [Permissions.FLAGS.VIEW_CHANNEL],
                                },
                                {
                                    id: fetchedRole,
                                    type: 0, // role
                                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                                },
                            ],
                        }).then( created => {
                            // save to database
                            foundServer.courseData.get( subject ).get( courseNum ).channelId = created.id;
                            return created;
                        });
                    });
                
                
                // if new role was created, refresh permissions
                if ( newRoleCreated ) {
                    fetchedChannel.edit({
                        permissionOverwrites: [
                            {
                                id: guildSnowflake.id,
                                type: 0, // role
                                deny: [Permissions.FLAGS.VIEW_CHANNEL],
                            },
                            {
                                id: fetchedRole,
                                type: 0, // role
                                allow: [Permissions.FLAGS.VIEW_CHANNEL],
                            },
                        ],
                    });
                }
            }

        } // end for courseNum : courseArray

    } // end for [subject, courseArray] : user.classes

    // save changes
    foundServer.markModified('courseData');
    await foundServer.save()
        .then(() => console.log( "SAVED"))
        .catch( e => console.error(e) );
    
    return Promise.resolve('Successfully reloaded proxy.');
    
}

module.exports = refreshProxyUserClasses