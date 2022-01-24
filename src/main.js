// shift to ./app
const process = require('process');
process.chdir('./src');

const BotClient = require("./util/BotClient/BotClient");
const { Intents } = require('discord.js');
const registerClientCommands = require('./register');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

// initialize Discord client then connect to the mongodb database
let client = new BotClient({
    intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES ],
    partials: ["CHANNEL"]
});
require('./database/connect.js')();

registerClientCommands( client )
    .then( success => console.log( success ) )
    .catch( error => console.error("Unable to parse client commands. " + error.stack ) );

// login
client.login( process.env.DISCORD_TOKEN );
console.log( require('./util/ValidateInput/ValidateCourseInput')('cs273', client) );
console.log( require('./util/ValidateInput/ValidateCourseInput')('engl273', client) );
console.log( require('./util/ValidateInput/ValidateCourseInput')('computer science 273', client) );