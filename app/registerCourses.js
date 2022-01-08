const fs = require('fs');

function registerCourses( client ) {
    // register all courses and their id's to client
    client.courses = new Map();
    client.commonNames = new Map();
    client.abbreviations = new Set();
    fs.readdirSync('./courses', { withFileTypes: false }).filter( file => file.endsWith('.json') ).forEach( f => {
    
        // register to client
        let coursesFromFile = JSON.parse( fs.readFileSync('./courses/' + f ) );
        client.abbreviations.add( coursesFromFile.metadata.abbreviation );
        client.courses.set(
            coursesFromFile.metadata.abbreviation,
            new Map( Object.entries( coursesFromFile.courses ) ),
        );
        coursesFromFile.metadata.common.forEach( n => client.commonNames.set( n, coursesFromFile.metadata.abbreviation ) );

    });
}

module.exports = registerCourses;