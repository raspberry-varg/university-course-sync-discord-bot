const { Client, Collection, ClientOptions, ApplicationCommandData, Base } = require("discord.js");
const bindCommands = require("./bindCommands");
const bindEvents = require("./bindEvents");
const parseCourses = require("./parseCourses");
require('coursesync/types/Subject');

/**
 * For simplicity, types are defined in /node_modules/coursesync/BotClient/types/BotClient.js
 * by requiring this file in the typedef statement
 * 
 * Types can be required via require('coursesync/types/BotClient') and will be within production.
 * Base.client type has been overriden in discord.js/typings/index.d.ts
 */
class BotClient extends Client {

    /**@type {Collection<command.name, ApplicationCommandData>}*/ commands;
    /**@type {Map<SupportedClasses, Subject>}*/                   courses;
    /**@type {Set<SupportedClasses>}*/                            abbreviations;
    /**@type {Map<string, SupportedClasses>}*/                    commonNames;

    /**
     * Create a new Bot client.
     * @param {ClientOptions} clientOptions Discord Client options
     */
    constructor( clientOptions ) {
        super( clientOptions );
        bindEvents( this );
        bindCommands( this );

        let courseReg = parseCourses();
        this.config = require('../../config.json');
        this.abbreviations = courseReg.abbreviations;
        this.commonNames = courseReg.commonNames;
        this.courses = courseReg.courses;
    }

}

module.exports = BotClient;