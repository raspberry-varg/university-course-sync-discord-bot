import { ApplicationCommandData, Client, Collection, Base } from "discord.js";

declare module 'coursesync';

declare class BotClient extends Client {
    commands: Collection<command.name, ApplicationCommandData>;
    courses: Map<SupportedClasses, Subject>;
    abbreviations: Set<SupportedClasses>;
    commonNames: Map<string, SupportedClasses>;
}