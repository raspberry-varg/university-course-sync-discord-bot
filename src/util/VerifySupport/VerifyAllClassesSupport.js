const Discord = require("discord.js");
const mongoose = require("mongoose");
const { userSchema } = require('../../database/schemas/user');

/**
 * Verify that the server allows this course.
 * @param {Discord.Interaction} interaction
 * @param {Array<String>} courseSplit
 * @param {userSchema} userData
 * @param {mongoose.module} serverData 
 * @returns {Discord.MessageEmbed.fields} Formatted fields.
 */
function verifyAllClassesSupport( interaction, userData, serverData ) {

    if ( !userData.classes || userData.classes.size < 1 )
        return false;
    
    /**@type {BotClient}*/
    let client = interaction.client;
    let classes = [];
    let current;

    // format
    
    // if any are allowed, do not check
    if ( serverData.any )
        for ( const key of userData.classes.keys() ) {
            classes.push({
                name: key.toUpperCase() + "\n=======\n",
                value: userData.classes.get( key ).map( ( value ) => {
                    current = interaction.client.courses.get( key.toUpperCase() ).listings.get( value );

                    // if link
                    if ( current.link != null )
                        return `> ৹ **${key.toUpperCase()}** ${value}/${current.link} ${current.name}`;
                    return `> ৹ **${key.toUpperCase()}** ${value} ${current.name}`;
                }).join('\n'),
                inline: true,
            });
            userData.classes.get( key ).forEach( value => console.log( client.courses.get(key.toUpperCase()).listings.get(value) ) );
        }
    // if any is not enabled, check
    else
        for ( const key of userData.classes.keys() ) {

            let courseBloc = userData.classes.get( key ).map( ( value ) => {
                current = interaction.client.courses.get( key.toUpperCase() ).listings.get( value );
                
                if ( quickCheck( key, value, serverData ) )
                    return `> ৹ **${key.toUpperCase()}** ${value}${current.link != null ? `/${current.link}` : ''} ${client.courses.get(key.toUpperCase()).listings.get(value).name}`;
                else
                    return `> ✕ ~~${key.toUpperCase()} ${value}${current.link != null ? `/${current.link}` : ''} ${client.courses.get(key.toUpperCase()).listings.get(value).name}~~`;
                
            });

            classes.push({
                name: key.toUpperCase() + "\n======\n",
                value: courseBloc.join('\n'),
                inline: true,
            });
            console.log(classes);

        }
    
    return classes;
    
}

function quickCheck( key, value, serverData ) {
    
    // check if any is enabled
    if ( serverData.any )
        return true;
    
    // check blacklist
    if ( serverData.courseBlacklist.has( key ) && serverData.courseBlacklist.get( key ).includes( value ) )
        return false;
    
    // check course specific type
    if ( serverData.courseSpecific.has( key ) && serverData.courseSpecific.get( key ).includes( value ) )
        return true;
    
    // else check course global type as specific overrides
    else if ( !serverData.courseSpecific.has( key ) && serverData.courseType.has( key ) )
        return true;
    
    // if all checks fail, return false
    else
        return false;
    
}

module.exports = verifyAllClassesSupport;