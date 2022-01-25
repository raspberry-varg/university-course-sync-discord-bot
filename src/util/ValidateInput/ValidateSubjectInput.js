const { BotClient } = require('coursesync');;

/**
 * Validate input to ensure course is valid.
 * @param {string} input The input to validate.
 * @param {BotClient} client The Discord Client.
 */
function validateSubjectInput( input, client ) {

    // format to ABBREV
    input = input.trim().replace(/[^a-zA-Z]/g, '').toUpperCase();

    // validate
    let courseSearch = client.courses.has( input ) ? input : false;
    console.log({ input: input, courseSearch: courseSearch });

    // check common name to short-hand
    if ( !courseSearch )
        return client.commonNames.has( input.toLowerCase() ) ? client.commonNames.get( input.toLowerCase() ).toLowerCase() : false;
    else
        return courseSearch?.toString().toLowerCase();

}

module.exports = validateSubjectInput;