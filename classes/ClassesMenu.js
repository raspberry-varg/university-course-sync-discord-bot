const { MessageActionRow, MessageButton, MessageCollector, MessageEmbed } = require('discord.js');
const InteractiveMenu = require('./InteractiveMenu');
const validate = require('../classes/FormatCourse');
const verifyAllClassesSupport = require('./VerifyAllClassesSupport');

class ClassesMenu extends InteractiveMenu {
    
    constructor( interaction, userData, serverData ) {
        super( interaction );
        this.dbUser = userData;
        this.dbServer = serverData;

        let classes = verifyAllClassesSupport( interaction, userData, serverData );

        this.addPage({
            title: '🎉 Welcome to your personal class editor!',
            description: ( !Array.isArray( classes ) ? classes + '\n' : '' ) +
                'Home to all your classes for the Fall 2021 Semester!\n' +
                'Simply click `Add` or `Remove` below to add or remove classes respectively!',
            fields: Array.isArray( classes ) ? classes : [],
            thumbnail: interaction.user.avatarURL(),
            color: this.interaction.client.config.colors.neutral
        });
        console.log("Built ClassesMenu()");

        this.buttons = populateButtons( Array.isArray( classes ) );

    }

    startPage() {
        
        this.interaction.editReply({
            embeds: [ new MessageEmbed( this.pages[0] ) ],
            components: [ new MessageActionRow({ components: [ new MessageButton( this.buttons.add ), new MessageButton( this.buttons.remove ), new MessageButton( this.buttons.close ) ] }) ],
        });

        let filter = this.buttonFilter;

        let BCollector = this.interaction.channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', max: 1, time: 20 * 1000 });
        BCollector.on('collect', button => {
            
            // BCollector.stop();
            switch( button.customId ) {
                case 'class_add':
                    return this.addClassPage();
                case 'class_remove':
                    return this.removeClassPage();
                case 'class_close':
                    return this.close();
                default:
                    return this.close('time');
            }

        });

        BCollector.on('end', collected => {
            console.log(`Collected: ${collected.size}`);
            if ( collected.size < 1 )
                return this.close('time');
        })

    }

    updateStartPage() {

        let classes = verifyAllClassesSupport( this.interaction, this.dbUser, this.dbServer );

        this.pages[0] = new MessageEmbed( this.pages[0] )
            .setDescription((
                ( !Array.isArray( classes ) ? classes + '\n' : '' ) +
                'Home to all your classes for the Fall 2021 Semester!\n' +
                'Simply click `Add` or `Remove` below to add or remove classes respectively!'
            ))
            .setFields( Array.isArray( classes ) ? classes : [] );

    }

    async addClassPage() {

        await this.interaction.editReply({
            embeds: [
                new MessageEmbed( this.pages[0] )
                    .setColor( this.interaction.client.config.colors.positive )
                    .setTitle('✏️ Add-A-Class Wizard')
                    .setDescription("__**[Check out the currently supported list of classes here](https://github.com/robertvargas-irq/university-course-sync-discord-bot/blob/master/Supported%20Courses/readme.md), with many more to come!**__\n\n" +
                        "> This bot supports the full-length version of the course identifier.\n> \n" +
                        "> __I.E.__\n" +
                        "> `computer science` => `cs`\n> `c s` => `cs`\n\n" +
                        "> Please input your course in the following format without the box braces []:\n> \t`[course identifier] [course number]`\n> \n" +
                        "> __I.E.__\n> `cs172` `cs 172` `c s 172` `computer science 172`"),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle('❔ Send `cancel` to return to the main menu.')
            ],
            components: [],
        });

        const messageFilter = ( msg ) => msg.user.id === this.interaction.user.id;
        const MCollector = this.interaction.channel.createMessageCollector({ messageFilter, time: 60 * 1000 });


        // collect response and validate
        MCollector.on('collect', async c => {

            if ( c.size < 0 )
                return this.close('time');
            try {
                await c.delete().catch( e => console.error(e) );
            }
            catch ( error ) {
                console.error ( error );
            }
            if ( c.content.trim().toLowerCase() == 'cancel' ) {
                MCollector.stop();
                return this.startPage();
            }
            let validated = validate( c.content, this.interaction.client.courses );
            if ( !validated ) {
                return this.interaction.followUp({ content: 'That is not valid! Try again.', ephemeral: true });
            }


            // check if user has college type
            if ( !this.dbUser.classes.has( validated[0] ) )
                this.dbUser.classes.set( validated[0], [] );
            // add to array of course
            let courseMap = new Map( this.dbUser.classes );
            let courseArray = courseMap.get( validated[0] );
            if ( !courseArray.includes( validated[1] ) ) {
                courseArray.push( validated[1] );
                courseArray.sort( ( a, b ) => a - b );
            }

            // set to map
            courseMap.set( validated[0], courseArray );

            // save to user
            this.dbUser.classes = courseMap;
            console.log( this.dbUser.classes[validated[0]] );

            await this.dbUser.save();
            console.log( this.dbUser );

            this.updateStartPage();
            MCollector.stop();
            return this.startPage();

        });

        // report collected amount to console
        MCollector.on('end', collected => {
            console.log("MCollected: " + collected.size );
            if ( collected.size < 1 )
                return this.close('time');
        });

    }

    async removeClassPage() {

        await this.interaction.editReply({
            embeds: [
                new MessageEmbed( this.pages[0] )
                    .setColor( this.interaction.client.config.colors.negative )
                    .setTitle('❌ Remove-A-Class Wizard')
                    .setDescription("> This bot supports the full-length version of the course identifier.\n> \n" +
                        "> __I.E.__\n" +
                        "> `computer science` => `cs`\n> `c s` => `cs`\n\n" +
                        "> Please input your course in the following format without the box braces []:\n> \t`[course identifier] [course number]`\n> \n" +
                        "> __I.E.__\n> `cs172` `cs 172` `c s 172` `computer science 172`"),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle('❔ Send `cancel` to return to the main menu.')
                
            ],
            components: [],
        });

        const messageFilter = ( msg ) => msg.user.id === this.interaction.user.id;
        const MCollector = this.interaction.channel.createMessageCollector({ messageFilter, time: 60 * 1000 });


        MCollector.on('collect', async c => {

            if ( c.size < 0 )
                return this.close('time');
            
            try {
                await c.delete().catch( e => console.error(e) );
            }
            catch ( error ) {
                console.error ( error );
            }
            if ( c.content.trim().toLowerCase() == 'cancel' ) {
                MCollector.stop();
                return this.startPage();
            }
            let validated = validate( c.content, this.interaction.client.courses );
            if ( !validated ) {
                MCollector.resetTimer();
                return this.interaction.followUp({ content: 'That is not valid! Try again.', ephemeral: true });
            }

            // remove from array of course
            let courseMap = new Map( this.dbUser.classes );
            let courseArray = courseMap.get( validated[0] );
            if ( !courseArray.includes( validated[1] ) ) {
                return this.interaction.followUp({ content: "You're not in that class! Try a class on your list!" });
            }

            courseArray.splice( courseArray.indexOf( validated[1] ), 1 );

            // set to map
            if ( courseArray.length < 1 )
                courseMap.delete( validated[0] )
            else
                courseMap.set( validated[0], courseArray );

            // save to user
            this.dbUser.classes = courseMap;
            console.log( this.dbUser.classes[validated[0]] );

            await this.dbUser.save();
            console.log( this.dbUser );

            this.updateStartPage();
            MCollector.stop();
            return this.startPage();

        });

        MCollector.on('end', collected => {
            console.log("Collected: " + collected.size );
            if ( collected.size < 1 )
                return this.close('time');
        });

    }

}


function populateButtons( hasClasses ) {
    return {
        add: new MessageButton()
            .setLabel('Add')
            .setCustomId('class_add')
            .setEmoji('✏️')
            .setStyle('PRIMARY'),
        remove: new MessageButton()
            .setLabel('Remove')
            .setCustomId('class_remove')
            .setEmoji('❌')
            .setStyle('DANGER')
            .setDisabled( !hasClasses ),
        close: new MessageButton()
            .setLabel('Close')
            .setCustomId('class_close')
            .setStyle('SECONDARY'),
        back: new MessageButton()
            .setLabel('Back')
            .setCustomId('class_back')
            .setEmoji('↩️')
            .setStyle('SECONDARY')
    }
}


module.exports = ClassesMenu;