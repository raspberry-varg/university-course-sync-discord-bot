import { Client, Intents, Collection, Permissions, ClientOptions } from "discord.js";
import { config, course } from "../interfaces/BotClientProperties";
import { subjects } from "../interfaces/Subjects";

export class BotClient extends Client {

    commands: Collection<string, any>;
    config: config;
    courses: Map<subjects, course>;
    abbreviations: Set<subjects>;
    commonNames: Map<string, subjects>;
    
    constructor( config: ClientOptions ) { super( config ); }

}