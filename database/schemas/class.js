const { Schema } = require("mongoose");

// class schema
const classSchema = new Schema({
    department: {
        type: String,
        lowercase: true,
        required: true,
    },
    courseNumber: {
        type: Number,
        required: true,
    },
    taughtWith: {
        department: String,
        courseNumber: String,
    },
    name: {
        type: String,
        required: true,
    },
    description: String,
    credits: Number,
});

module.exports = classSchema;