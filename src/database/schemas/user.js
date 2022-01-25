const { Schema } = require('mongoose');
const { SupportedClasses } = require('coursesync')

/**
 * @typedef {{
 *      userId: string,
 *      university: string,
 *      joinedBot: Date,
 *      trustedUsers: Set<string>
 *      cachedServers: string[],
 *      classes: Map<SupportedClasses, string[]>
 *      classesCount: number,
 *      staff: boolean
 * }} UserSchema
 */

/**
 * User Schema
 * @type {UserSchema}
 */
const userSchema = new Schema({
    userId: {
        type: String,
        unique: true,
        required: true,
    },
    university: {
        type: String,
        lowercase: true,
        default: 'New Mexico State University',
    },
    joinedBot: {
        type: Date,
        default: Date.now,
    },
    trustedUsers: {
        type: Map,
        of: String,
        default: new Set(),
    },
    cachedServers: {
        type: [String],
        default: [],
    },
    classes: {
        type: Map,
        of: [String],
        default: new Map(),
    },
    classesCount: {
        type: Number,
        default: 0,
    },
    staff: {
        type: Boolean,
        default: false,
    },
});
module.exports = { userSchema };