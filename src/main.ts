import { Client } from "discord.js";
import { BotClient } from "./classes/BotClient";

// shift to ./app
const process = require('process');
process.chdir('./app');

const { Permissions, Collection, Intents } = require('discord.js');
const { register } = require('./register');
const registerCourses = require('./registerCourses');
import * as fs from 'fs';
const dotenv = require('dotenv');
dotenv.config();

// initialize Discord client then connect to the mongodb database
// const client: any = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES ], partials: ["CHANNEL"] });
let client = new BotClient({
    intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES ],
    partials: ["CHANNEL"]
});
require('./database/connect.js')();

// pass config variables to client
client.config = require('./config.json');




// init events
const eventFiles = fs.readdirSync('./events').filter( file => file.endsWith('.js') );
for ( const file of eventFiles ) {
    const event = require(`./events/${file}`);
    if ( event.once )
        client.once( event.name, (...args) => event.execute(...args, client) );
    else
        client.on( event.name, (...args) => event.execute(...args, client) );
}

// populate command files with all available commands
client.commands = new Collection();
const commandFiles: any = fs.readdirSync('./commands').filter( file => file.endsWith('.js') );

// check for nested commands, and populate commandFiles with them
const commandSubDirectories = fs.readdirSync('./commands').filter( subdir => fs.statSync(`./commands/${subdir}`).isDirectory() );
for ( let dir of commandSubDirectories ) {
    let files = fs.readdirSync(`./commands/${dir}`);
    for ( let file of files )
        commandFiles.push([ dir, file ]);
}

// register each command to the client
for ( let file of commandFiles ) {
    let command;
    if ( Array.isArray( file ) )
        command = require(`./commands/${file[0]}/${file[1]}`);
    else
        command = require(`./commands/${file}`);
    
    // push command to commands collection
    client.commands.set( command.name, command );
}
register( client )
    .then( success => console.log( success ) )
    .catch( error => console.error("Unable to parse client commands. " + error.stack ) );


// register all courses and their id's to client
registerCourses( client );

// login
client.login( process.env.CLIENT_TOKEN );
console.log( require('./classes/ValidateCourseInput')('cs273', client) );
console.log( require('./classes/ValidateCourseInput')('engl273', client) );
console.log( require('./classes/ValidateCourseInput')('computer science 273', client) );