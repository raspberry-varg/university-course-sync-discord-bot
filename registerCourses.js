const fs = require('fs');

function registerCourses( client ) {
    // register all courses and their id's to client
    client.courses = new Map();
    fs.readdirSync('./courses', { withFileTypes: false }).filter( file => file.endsWith('.json') ).forEach( f => {
    
        let coursesFromFile = JSON.parse( fs.readFileSync('./courses/' + f ) );
        client.courses.set(
            f.slice(0, -5),
            new Map([
                ...Object.entries(
                    coursesFromFile
                )
            ])
        );

        const updateCourses = false;
        if ( updateCourses == true ) {
            let toSave = `# [${f.slice(0, -5).toUpperCase()}] SUPPORTED COURSES\n` + [
                ...Object.entries(
                    coursesFromFile
                )
            ].map( c => `- __**${c[0]}**__ - ${ c[1].name }${ c[1].taughtWith ? (`\n\t - Equivalent to: [ ${c[1].taughtWith.map(c=>c.toUpperCase()).join(', ')} ]` ) : '' }`).join('\n\n');
            fs.writeFileSync(`./Supported Courses/${f.slice(0, -5).toUpperCase()}.md`, toSave );
        }

    });
}

module.exports = registerCourses;