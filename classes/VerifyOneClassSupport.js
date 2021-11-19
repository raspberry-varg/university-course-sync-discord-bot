const { Mongoose } = require("mongoose");

/**
 * Verify that the server allows this course.
 * @param {Array<String>} courseSplit
 * @param {Mongoose.module} serverData 
 */
function verifyClassSupport( courseSplit, serverData ) {

    // if any return true
    if ( serverData.any )
        return true;
    
    // check blacklist
    if ( serverData.courseBlacklist.has( courseSplit[0] ) && serverData.courseBlacklist.get( courseSplit[0] ).includes( courseSplit[1] ) )
        return false;
    
    // check course specific type
    if ( serverData.courseSpecific.has( courseSplit[0] ) && serverData.courseSpecific.get( courseSplit[0] ).includes( courseSplit[1] ) )
        return true;
    
    // else check course global type as specific overrides
    else if ( !serverData.courseSpecific.has( courseSplit[0] ) && serverData.courseType.has( courseSplit[0] ) )
        return true;
    
    // if all checks fail, return false
    else
        return false;
}

module.exports = verifyClassSupport;