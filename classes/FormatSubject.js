const { Client } = require("discord.js");

/**
 * Validate input to ensure course is valid.
 * @param {string} input The input to validate.
 * @param {Client.courses} courses The Map of courses mapped to the Discord Client.
 */
function validateSubjectInput( input, courses ) {

    // split at the alphabet/digit line
    input = input.trim().toLowerCase();

    // validate
    let courseSearch = courses.has( input ) ? input : false;

    // check common name to short-hand
    if ( !courseSearch ) {
        if ( commonNames.has( input ) )
            return commonNames.get( input )?.toString();
        else
            return false;
    }
    else
        return courseSearch?.toString();

}

/**
 * @enum
 */
const commonNames = new Map( ...[Object.entries({

    'computer science':'cs',
    'english':'engl',
    'astronomy':'astr',

})]);

module.exports = validateSubjectInput;