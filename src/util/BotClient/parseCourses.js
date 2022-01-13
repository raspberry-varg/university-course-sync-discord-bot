const fs = require('fs');
const dirPath = '../';
const dirName = 'Supported Courses RAWJSON';

/**
 * Parse courses into JS object for assignment
 * @param {BotClient} client Bot Client
 * @return {{ courses: Map<string, Object>, commonNames: Map<string, string>, abbreviations: Set<string> }}
 */
function registerCourses() {
    // register all courses and their id's to client
    let courses = new Map();
    let commonNames = new Map();
    let abbreviations = new Set();
    fs.readdirSync(`${dirPath}${dirName}`, { withFileTypes: false }).filter( file => file.endsWith('.json') ).forEach( f => {
    
        // register to client
        let courseSubjectFromFile = JSON.parse( fs.readFileSync(`${dirPath}${dirName}/${f}`) );
        abbreviations.add( courseSubjectFromFile.metadata.abbreviation );
        courses.set(
            courseSubjectFromFile.metadata.abbreviation,
            {
                metadata: courseSubjectFromFile.metadata,
                listings: new Map( Object.entries( courseSubjectFromFile.courses ) ),
            },
        );
        courseSubjectFromFile.metadata.common.forEach( n => commonNames.set( n, courseSubjectFromFile.metadata.abbreviation ) );

    });

    return { courses: courses, commonNames: commonNames, abbreviations: abbreviations };
}

module.exports = registerCourses;