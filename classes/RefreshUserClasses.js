const mongoose = require('mongoose');
const { Permissions } = require('discord.js');
const serverSchema = require('../database/schemas/server');
const verifyClassSupport = require('./VerifyOneClassSupport');
const verifyOneCourseTypeSupport = require('./VerifyOneCourseTypeSupport');
const refreshProxyUserClasses = require('./RefreshProxyUserClasses');


/**
 * 
 * @param {Discord.client.interaction} interaction Original interaction.
 * @param {mongoose.module} foundUser User data from database.
 * @param {mongoose.module} foundServer Server data from database.
 * @returns 
 */
async function refreshUserClasses( interaction, foundUser, foundServer ) {
    
    // cycle through each course and check against server data
    console.log("CYCLING THROUGH EACH COURSE AND CHECKING AGAINST SERVER DATA");
    console.log( foundUser.classes );
    for ( [ key, array ] of foundUser.classes ) {
    // await foundUser.classes.forEach( async ( array, key ) => {
        console.log({ array: array, key: key });

        console.log("\n\nCURRENT KEY: ");
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
            console.log("THIS ENTIRE SUBJECT IS NOT SUPPORTED");
            continue;
        }
        else
            console.log("REFRESHING " + key);
        
        //// THIS WORKS
        // ! nevermind
        // grab category for the current course key or create and save if non-existent
        var parentId = foundServer.courseParents.get( key )?.replace(/[^0-9]/g, '') || '-1';
        console.log({ parentId: parentId });

        // retrieve course category channel
        await interaction.guild.channels.fetch();
        const courseCategory = await interaction.guild.channels.fetch( parentId.toString() )
            .then( async found => {
                console.log("FIXME: VAR found IN ARROW: " + found );
                if ( found == undefined )
                    return await interaction.guild.channels.create( key.toUpperCase(), {
                        type: 4, // category
                        permissionOverwrites: [],
                    }).then( async created => { // save to database
                        console.log('THEN -> FOUND IS UNDEFINED-- HAD TO CREATE A NEW CHANNEL: created new channel category. ID: ' + created.id );

                        // set to database courseParents
                        foundServer.courseParents.set( key, created );
                        // return created;
                    });
                return found;
            })
            .catch( async (e) => {
                console.error(e);
                console.log("\tNo channel category found, creating...");
                return await interaction.guild.channels.create( key.toUpperCase(), {
                    type: 4, // category
                    permissionOverwrites: [],
                }).then( async created => { // save to database
                    console.log('created new channel category. ID: ' + created.id );

                    // set to database courseParents
                    foundServer.courseParents.set( key, created );
                    return created;
                });
            });
        console.log(`CURRENT COURSE CATEGORY: ${courseCategory.name}(${courseCategory.id})[${courseCategory.type}]`);




        // if database does NOT have a config set for current key, create
        if ( !foundServer.courseData.has( key ) )
            foundServer.courseData.set( key, {} );
        
        // cycle through each course within the subject type ( I.E.   { CS: [...] }, { ENGL: [...] } )
        // await array.forEach( async value => {
        for ( value of array ) {
            console.log("\n\tCURRENT CLASS: " + value );
            
            // if server supports the course
            if ( verifyClassSupport([ key, value ], foundServer ) ) {

                // check if server has role and channel data
                let courseConfig = foundServer.courseData.get( key ).get( value );
                if ( !courseConfig ) {
                    console.log("\tNO COURSE CONFIG FOUND, CREATING...");
                    courseConfig = {
                        roleId: '-1',//'910034972058976276',
                        channelId: '-1',
                    }
                    foundServer.courseData.get( key ).set( value, courseConfig );
                    // foundServer.courseData = new Map( foundServer.courseData );
                    console.log( foundServer.courseData.get( key ) );
                }
                else
                    console.log("\tCOURSE CONFIG FOUND.");

                console.log("\tPARENT: " + courseCategory.id);

                // create new role and channel dedicated to the course
                console.log("\tcourseConfig:")
                console.log(courseConfig);

                console.log("\tFetching role...");
                var newRoleCreated = false;
                const fetchedRole = await interaction.guild.roles.fetch( courseConfig.roleId.toString() )
                    .then( found => {
                        console.log(`Role successfully found! Role: ${found.name}(${found.id})`);
                        interaction.member.roles.add( found ).catch( e => console.error( e ) );
                        return found;
                    })
                    .catch( async () => {
                        console.log("\tNo role found, creating...");
                        return await interaction.guild.roles.create({
                            name: key.toUpperCase() + value,
                            permissions: [],
                            color: interaction.guild.client.config.colors.neutral,
                        })
                        .then( created => {
                            console.log("New role created.");
                            newRoleCreated = true;
                            // save to database
                            // foundServer.courseData.get( key );
                            foundServer.courseData.get( key ).get(value).roleId = created.id;
                            console.log(foundServer.courseData.get( key ).get(value));
                            interaction.member.roles.add( created ).catch( e => console.error( e ) );

                            return created;
                        });
                    });

                // fetch given channel
                console.log("Fetching channel...");
                const fetchedChannel = await interaction.guild.channels.fetch( courseConfig.channelId.toString() )
                    .then( found => {
                        console.log(`Channel successfully found! ${found.name}(${found.id})`);
                        return found;
                    })
                    .catch( async () => {
                        console.log("\tNo channel found, creating...");
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
                            console.log(`New channel created. ${created.name}(${created.id})`);
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
                console.log('\tThis class is not supported.');

        }; // end for each
        console.log();
    }//); // end outer loop
    console.log("THE OUTER LOOP HAS BEEN BROKEN");

    console.log('refreshing proxy servers...')
    let promiseResolves = [];
    foundUser.cachedServers.forEach( async s => {

        // if current server, skip
        if ( s == interaction.guild.id ) return;

        // fetch and refresh
        const Server = mongoose.model('Server', serverSchema );
        promiseResolves.push(
            interaction.client.guilds.fetch( s )
                .then( async guild => {
                    await refreshProxyUserClasses( guild, foundUser, await Server.findOne({ guildId: guild.id }) );
                })
                .catch( e => {
                    console.log("server does not exist, skipping...");
                    foundUser.cachedServers.splice( foundUser.cachedServers.indexOf( s ), 1 );
                })
        )
        
    });
    Promise.all( promiseResolves ).then( s => console.log("ALL PROXIES RELOADED") );
    return Promise.resolve('Successfully reloaded.');
    
}

module.exports = refreshUserClasses