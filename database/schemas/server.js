const { Schema } = require("mongoose");

// class schema
const serverSchema = new Schema({
    guildId: {
        type: String,
        unique: true,
        required: true,
    },
    any: {
        type: Boolean,
        default: false,
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
    }
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