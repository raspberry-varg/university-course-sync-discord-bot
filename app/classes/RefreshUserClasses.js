const mongoose = require('mongoose');
const { Permissions, Channel } = require('discord.js');
const serverSchema = require('../database/schemas/server');
const verifyClassSupport = require('./VerifyOneClassSupport');
const verifyOneCourseTypeSupport = require('./VerifyOneCourseTypeSupport');
const refreshProxyUserClasses = require('./RefreshProxyUserClasses');


/**
 * 
 * @param {Discord.client.interaction} interaction Original interaction.
 * @param {mongoose.module} foundUser User data from database.
 * @param {mongoose.module} foundServer Server data from database.
 * @param {boolean} bypassProxy Skip proxy reloads for user.
 * @returns 
 */
async function refreshUserClasses( interaction, foundUser, foundServer, bypassProxy ) {
    
    const memberObj = await interaction.guild.members.fetch( foundUser.userId );
    const debugId = `[${ memberObj.user.username }(${foundUser.userId})] `;

    // cycle through each course and check against server data
    console.log( debugId + "CYCLING THROUGH EACH COURSE AND CHECKING AGAINST SERVER DATA");
    console.log( foundUser.classes );
    for ( [ key, array ] of foundUser.classes ) {
    // await foundUser.classes.forEach( async ( array, key ) => {
        console.log({ array: array, key: key });

        console.log( debugId + "\n\nCURRENT KEY: ");
        console.log( key );
        /*
            * Okay so:
            * 
            * 1) Verify that the course subject is supported
            * 2) Get the course CATEGORY CHANNEL; create one and save if not found
            *         TODO: go through every channel and re-append to the new category channel.
            * 3) Check every course the user has against: ROLE & CHANNEL FOR IT
            * 
            */

        // check to ensure the key is valid in the server
        if ( !verifyOneCourseTypeSupport( key, foundServer ) ) {
            console.log( debugId + "THIS ENTIRE SUBJECT IS NOT SUPPORTED");
            continue;
        }
        else
            console.log( debugId + "REFRESHING " + key);
        
        //// THIS WORKS
        // ! nevermind
        // grab category for the current course key or create and save if non-existent
        var parentId = foundServer.courseParents.get( key )?.replace(/[^0-9]/g, '') || '-1';
        console.log({ parentId: parentId });

        // retrieve course category channel
        await interaction.guild.channels.fetch();
        const courseCategory = await interaction.guild.channels.fetch( parentId.toString() )
            .then( async found => {
                console.log( debugId + "FIXME: VAR found IN ARROW: " + found );
                if ( found == undefined )
                    return await interaction.guild.channels.create( key.toUpperCase(), {
                        type: 4, // category
                        permissionOverwrites: [],
                    }).then( async created => { // save to database
                        console.log( debugId + 'THEN -> FOUND IS UNDEFINED-- HAD TO CREATE A NEW CHANNEL: created new channel category. ID: ' + created.id );

                        // set to database courseParents
                        foundServer.courseParents.set( key, created );
                        // return created;
                    });
                return found;
            })
            .catch( async (e) => {
                // console.error(e);
                console.log( debugId + "\tNo channel category found, creating...");
                return await interaction.guild.channels.create( key.toUpperCase(), {
                    type: 4, // category
                    permissionOverwrites: [],
                }).then( async created => { // save to database
                    console.log( debugId + 'created new channel category. ID: ' + created.id );

                    // set to database courseParents
                    foundServer.courseParents.set( key, created );

                    // re-append
                    for ( const channel of foundServer.courseData.get( key ) ) {
                        console.log( channel );
                        try {
                            ( await interaction.guild.channels.fetch( channel[1].channelId ) ).setParent( created, { lockPermissions: false, reason: "Re-appending to new category parent." } );
                        }
                        catch ( error ) {
                            console.log("Unable to set channel to new parent.");
                        }
                    }
                    return created;
                });
            });
        console.log( debugId + `CURRENT COURSE CATEGORY: ${courseCategory.name}(${courseCategory.id})[${courseCategory.type}]`);




        // if database does NOT have a config set for current key, create
        if ( !foundServer.courseData.has( key ) )
            foundServer.courseData.set( key, {} );
        
        // cycle through each course within the subject type ( I.E.   { CS: [...] }, { ENGL: [...] } )
        // await array.forEach( async value => {
        for ( value of array ) {
            console.log( debugId + "\n\tCURRENT CLASS: " + value );
            
            // if server supports the course
            if ( verifyClassSupport([ key, value ], foundServer ) ) {

                // check if server has role and channel data
                let courseConfig = foundServer.courseData.get( key ).get( value );
                if ( !courseConfig ) {
                    console.log( debugId + "\tNO COURSE CONFIG FOUND, CREATING...");
                    courseConfig = {
                        roleId: '-1',//'910034972058976276',
                        channelId: '-1',
                    }
                    foundServer.courseData.get( key ).set( value, courseConfig );
                    // foundServer.courseData = new Map( foundServer.courseData );
                    console.log( foundServer.courseData.get( key ) );
                }
                else
                    console.log( debugId + "\tCOURSE CONFIG FOUND.");

                console.log( debugId + "\tPARENT: " + courseCategory.id);

                // create new role and channel dedicated to the course
                console.log( debugId + "\tcourseConfig:")
                console.log(courseConfig);

                console.log( debugId + "\tFetching role...");
                var newRoleCreated = false;
                const fetchedRole = await interaction.guild.roles.fetch( courseConfig.roleId.toString() )
                    .then( found => {
                        console.log( debugId + `Role successfully found! Role: ${found.name}(${found.id})`);
                        memberObj.roles.add( found ).catch( e => console.error( e ) );
                        return found;
                    })
                    .catch( async () => {
                        console.log( debugId + "\tNo role found, creating...");
                        return await interaction.guild.roles.create({
                            name: key.toUpperCase() + value,
                            permissions: [],
                            color: foundServer.roleColor,
                        })
                        .then( created => {
                            console.log( debugId + "New role created.");
                            newRoleCreated = true;
                            // save to database
                            // foundServer.courseData.get( key );
                            foundServer.courseData.get( key ).get(value).roleId = created.id;
                            console.log(foundServer.courseData.get( key ).get(value));
                            memberObj.roles.add( created ).catch( e => console.error( e ) );

                            return created;
                        });
                    });

                // fetch given channel
                console.log( debugId + "Fetching channel...");
                const fetchedChannel = await interaction.guild.channels.fetch( courseConfig.channelId.toString() )
                    .then( found => {
                        console.log( debugId + `Channel successfully found! ${found.name}(${found.id})`);
                        return found;
                    })
                    .catch( async () => {
                        console.log( debugId + "\tNo channel found, creating...");
                        return await interaction.guild.channels.create( key.toUpperCase() + value, {
                            type: 0, // guild text
                            parent: courseCategory?.id || courseCategory,
                            permissionOverwrites: [
                                {
                                    id: interaction.guild.id,
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
                            console.log( debugId + `New channel created. ${created.name}(${created.id})`);
                            // save to database
                            foundServer.courseData.get( key ).get(value).channelId = created.id;
                            console.log( foundServer.courseData.get(key).get(value) );
                            // foundServer.courseData.get( key ).set( value, {...data} );

                            return created;
                        });
                    });
                
                
                // if new role was created, refresh permissions
                if ( newRoleCreated ) {
                    fetchedChannel.edit({
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
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
            else
                console.log( debugId + '\tThis class is not supported.');

        }; // end for each
        console.log();
    }//); // end outer loop
    console.log( debugId + "THE OUTER LOOP HAS BEEN BROKEN");

    if ( !bypassProxy ) {
        console.log( debugId + 'refreshing proxy servers...')
        let promiseResolves = [];
        foundUser.cachedServers.forEach( async s => {
    
            // if current server, skip
            if ( s == interaction.guild.id ) return;
    
            // fetch and refresh
            const Server = mongoose.model('Server', serverSchema );
            await interaction.client.guilds.fetch( s )
                .then( async guild => {
                    await refreshProxyUserClasses( guild, foundUser, await Server.findOne({ guildId: guild.id }) );
                })
                .catch( e => {
                    console.log( debugId + `server ${s} does not exist, skipping...`);
                    foundUser.cachedServers.splice( foundUser.cachedServers.indexOf( s ), 1 );
                });
            
        });
        await Promise.all( promiseResolves ).then( s => console.log( debugId + "ALL PROXIES RELOADED") );
    }
    else
        console.log('Proxy refresh bypassed.');
    
    return Promise.resolve('Successfully reloaded.');
    
}

module.exports = refreshUserClasses