require('coursesync/types/BotClient');

/**
 * Validate input to ensure course is valid.
 * @param {string} input The input to validate.
 * @param {BotClient} client The Discord Client.
 */
function validateInput( input, client ) {

    // split at the alphabet/digit line
    input = input.trim().toLowerCase();
    const split = input.replace(/[^a-zA-Z0-9]+/g, '').split(/(\d+)/, 2);
    console.log({ splitRAW: split });

    // trim word-input
    split[0] = split[0]?.trim()?.replace(/ +/, ' ').toUpperCase() || '';
    split[1] = split[1]?.trim() || '';

    console.log({ split_0: split[0], split_1: split[1] });

    // validate
    let courseSearch = client.courses.get( split[0] );

    // check common name to short-hand
    if ( !courseSearch ) {
        if ( client.commonNames.has(split[0].toLowerCase()) ) {
            split[0] = client.commonNames.get( split[0].toLowerCase() );
            courseSearch = client.courses.get( split[0] );
        }
        else
            return false;
    }

    // finally check if course has the requested crn
    if ( courseSearch.listings.has( split[1].toString() ) )
        return [split[0].toLowerCase(), split[1].toString()];
    else
        return false;

}

module.exports = validateInput;