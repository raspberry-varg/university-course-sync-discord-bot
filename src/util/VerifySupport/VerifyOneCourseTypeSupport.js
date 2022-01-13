const { Mongoose } = require("mongoose");

/**
 * Verify that the server allows this course.
 * @param {Array<String>} courseSplit
 * @param {Mongoose.module} serverData 
 */
function verifyOneCourseTypeSupport( courseSubject, serverData ) {

    // check any
    if ( serverData.any )
        return true;
    
    // check course specific type
    if ( serverData.courseSpecific.has( courseSubject ) )
        return true;
    
    // else check course global type as specific overrides
    if ( serverData.courseType.has( courseSubject ) )
        return true;
    
    // if all checks fail, return false
    return false;
    
}

module.exports = verifyOneCourseTypeSupport;