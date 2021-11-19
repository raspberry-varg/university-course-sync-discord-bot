const { Client } = require("discord.js");

/**
 * Validate input to ensure course is valid.
 * @param {string} input The input to validate.
 * @param {Client.courses} courses The Map of courses mapped to the Discord Client.
 */
function validateInput( input, courses ) {

    // split at the alphabet/digit line
    input = input.trim().toLowerCase();
    const split = input.split(/(\d+)/, 2);

    // trim word-input
    split[0] = split[0]?.trim()?.replace(/ +/, ' ') || '';
    split[1] = split[1]?.trim() || '';

    // validate
    let courseSearch = courses.get( split[0] );

    // check common name to short-hand
    if ( !courseSearch ) {
        if ( commonNames.has(split[0]) ) {
            split[0] = commonNames.get( split[0] );
            courseSearch = courses.get( split[0] );
        }
        else
            return false;
    } 

    // finally check if course has the requested crn
    if ( courseSearch.has( split[1] ) )
        return split;
    else
        return false;

}

/**
 * @enum
 */
const commonNames = new Map( ...[Object.entries({

    'computer science':'cs',
    'english':'engl',
    'astronomy':'astr',

})]);

module.exports = validateInput;