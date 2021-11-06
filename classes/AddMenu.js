const InteractiveMenu = require('./InteractiveMenu');

class AddMenu extends InteractiveMenu {
    
    constructor( interaction, databaseInfo ) {
        super( interaction );
        this.dbUser = databaseInfo;

        let classes = [];

        if ( databaseInfo.classes && databaseInfo.classes.size > 0 ) {
            for ( const key of databaseInfo.classes.keys() )
                classes.push({
                    name: key.toUpperCase() + "\n=======\n",
                    value: databaseInfo.classes.get( key ).map( ( value ) => `৹ **${key.toUpperCase()}** ${value}`).join('\n'),
                    inline: true,
                }) 
        }
        else
            classes = "> **Woah!** You are currently not in any classes!\n\n__Get started by clicking/tapping 'Add' below!__";

        this.addPage({
            title: '🎉 Welcome to your personal class editor!',
            description: !Array.isArray( classes ) ? classes : null,
            fields: Array.isArray( classes ) ? classes : null,
        });
        console.log("Built AddMenu()");

        this.display(1);

    }
}

module.exports = AddMenu;