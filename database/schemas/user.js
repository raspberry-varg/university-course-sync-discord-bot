const { Schema } = require('mongoose');

// user schema
const userSchema = new Schema({
    userId: {
        type: String,
        unique: true,
    },
    university: {
        type: String,
        lowercase: true,
    },
    joinedBot: {
        type: Date,
        default: Date.now,
    },
    trustedUsers: {
        type: Map,
        of: String,
    },
    authServers: {
        type: Map,
        of: String,
    },
    classes: {
        type: Map,
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