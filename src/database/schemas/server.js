const { Schema } = require("mongoose");
const { SupportedClasses } = require('coursesync');;

/**
 * @typedef {{
 *      guildId: string,
 *      any: boolean,
 *      roleColor: string,
 *      courseSpecific: Map<SupportedClasses, string[]>
 *      courseType: Set<string>
 *      courseBlacklist: Map<SupportedClasses, string[]>
 *      courseParents: Map<SupportedClasses, string>
 *      courseData: Map<SupportedClasses, Map<CourseNumber, CourseData>>
 * }} ServerSchema
 * @typedef {{
 *      roleId: string | '-1'
 *      channelId: string | '-1'
 *}} CourseData
 */

/**
 * Server Schema
 * @type {ServerSchema}
 */
const serverSchema = new Schema({
    guildId: {
        type: String,
        unique: true,
        required: true,
    },
    any: {
        type: Boolean,
        default: 'false',
    },
    roleColor: {
        type: String,
        default: "0xeeacd5",
    },
    courseSpecific: {
        type: Map,
        of: [String],
        default: new Map(),
    },
    courseType: {
        type: Map,
        default: new Set(),
    },
    courseBlacklist: {
        type: Map,
        of: [String],
        default: new Map(),
    },
    courseParents: {
        type: Map,
        of: String,
        default: new Map(),
    },
    courseData: {
        type: Map,
        of: {
            type: Map,
            of: {
                type: {},
                default: {
                    roleId: '-1',
                    channelId: '-1',
                },
            },
            default: new Map(),
        },
        default: new Map(),
    },
    /*
     * courseData.key.value: {
     *     roleId: String,
     *     channelId: String,
     * }
     */
});

module.exports = serverSchema;

/*
 *
 *
 * Course specific --(overrides)--> Course type.
 * Course blacklist --(overrides)--> { Course specific & Course type }
 * 
 * 
 * ( Course specific --(override)--> Course type ) - Course blacklist
 * ( CS || ( CT && !CS ) ) - CBL
 * 
 * 
 * CS213 will restrict all CS courses only to CS213
 * CS global will allow all CS courses
 * CS global, CS172 blacklist, will allow all CS courses except CS172
 * 
 * 
 */