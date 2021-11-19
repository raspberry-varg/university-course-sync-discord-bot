const { Schema } = require('mongoose');

// user schema
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
/**
 * enum for semesters
 * @readonly
 * @enum {String}
 */
const semesters = {
    FALL: 'f',
    FALL_MINIMESTER_1: 'fm1',
    FALL_MINIMESTER_2: 'fm2',
    SPRING: 'sr',
    SPRING_MINIMESTER_1: 'srm1',
    SPRING_MINIMESTER_2: 'srm2',
    SUMMER_1: 'sm1',
    SUMMER_2: 'sm2',
}
module.exports = { userSchema, ...semesters };