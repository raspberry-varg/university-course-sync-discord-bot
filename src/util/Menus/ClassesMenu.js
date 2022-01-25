const { MessageActionRow, MessageButton, MessageEmbed, Interaction, Base } = require('discord.js');
const InteractiveMenu = require('./InteractiveMenu');
const validate = require('../ValidateInput/ValidateCourseInput');
const verifyAllClassesSupport = require('../VerifySupport/VerifyAllClassesSupport');
const refreshUserClasses = require('../Refresh/RefreshUserClasses');
const { userSchema } = require('../../database/schemas/user');
const serverSchema = require('../../database/schemas/server');
const mongoose = require('mongoose');
// const Server = mongoose.model('Server', require('../../database/schemas/server') );
const MenuContents = require('./contents/ClassesMenu');
const TIME = 60 * 1000;
const { BotClient } = require('coursesync');

class ClassesMenu extends InteractiveMenu {
    
    /**@type {userSchema}*/ dbUser;
    /**@type {serverSchema}*/ dbServer;

    /**
     * 
     * @param {Interaction} interaction 
     * @param {userSchema} userData 
     * @param {serverSchema} serverData 
     */
    constructor( interaction, userData, serverData ) {
        super( interaction );
        this.dbUser = userData;
        this.dbServer = serverData;

        let classes = verifyAllClassesSupport( interaction, userData, serverData );

        this.addPage({
            ...MenuContents.startPage,
            description: MenuContents.startPage.description,
            fields: Array.isArray( classes ) ? classes : [{ name: '🏜️  Your classes are empty!', value: '> Press `Add` below to start addin\' \'em!' }],
            thumbnail: interaction.user.avatarURL(),
            color: this.interaction.client.config.colors.neutral
        });
        console.log("Built ClassesMenu()");

        this.buttons = populateButtons( Array.isArray( classes ) );

    }

    startPage() {
        
        if ( this.dbUser.classesCount >= 7 )
            this.buttons.add.setEmoji('📚').setLabel('Max Classes Reached').setStyle('SECONDARY').setDisabled(true);
        else
            this.buttons.add.setEmoji('✏️').setLabel('Add').setStyle('PRIMARY').setDisabled(false);

        this.interaction.editReply({
            embeds: [ new MessageEmbed( this.pages[0] ) ],
            components: [ new MessageActionRow({ components: [ new MessageButton( this.buttons.add ), new MessageButton( this.buttons.remove ), new MessageButton( this.buttons.close ) ] }) ],
        });

        let filter = this.filters.button;

        let BCollector = this.interaction.channel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON', max: 1, time: TIME });
        BCollector.on('collect', button => {

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

    async updateStartPage() {
        
        await refreshUserClasses( this.interaction, this.dbUser, this.dbServer );
        this.dbServer.markModified('courseData');
        await this.dbServer.save();

        let classes = verifyAllClassesSupport( this.interaction, this.dbUser, this.dbServer );
        
        this.pages[0] = new MessageEmbed( this.pages[0] )
            .setDescription( MenuContents.startPage.description )
            .setFields( Array.isArray( classes ) ? classes : [{ name: '🏜️  Your classes are empty!', value: '> Press `Add` below to start addin\' \'em!' }] );

        return Promise.resolve('The start page has been successfully reloaded.');
    }

    async addClassPage() {

        await this.interaction.editReply({
            embeds: [
                new MessageEmbed( this.pages[0] )
                    .setColor( this.interaction.client.config.colors.positive )
                    .setTitle( MenuContents.addClassPage.title )
                    .setDescription(
                        MenuContents.addClassPage.description.replace(
                            "<SUPPORTED_CLASSES_URL>", this.interaction.client.config.supportedClassesURL
                        ) +
                        MenuContents.crnTooltip
                    ),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle('❔ Send `cancel` to return to the main menu.')
            ],
            components: [],
        });

        const messageFilter = ( msg ) => { return msg.guild.id == this.interaction.guild.id && msg.author.id == this.interaction.user.id };
        const MCollector = this.interaction.channel.createMessageCollector({ filter: messageFilter, time: TIME });


        // collect response and validate
        MCollector.on('collect', async c => {
            
            console.log({ collected: c.content.substring( 0, 20 ), user: this.interaction.user.username });
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
            let validated = validate( c.content, this.interaction.client );
            if ( !validated ) {
                MCollector.resetTimer();
                return this.interaction.followUp({ content: 'That is not valid! Try again.', ephemeral: true });
            }


            // check if user has subject type
            validated[0] = validated[0].toLowerCase();
            validated[1] = validated[1].toString();
            if ( !this.dbUser.classes.has( validated[0] ) )
                this.dbUser.classes.set( validated[0], [] );
            
            // add to array of courses
            let courseMap = new Map( this.dbUser.classes );
            let courseArray = courseMap.get( validated[0] );
            if ( !courseArray.includes( validated[1] ) ) {
                courseArray.push( validated[1] );
                courseArray.sort( ( a, b ) => a - b );
                this.dbUser.classesCount = this.dbUser.classesCount + 1;
            }

            // set to map
            courseMap.set( validated[0], courseArray );

            // save to user
            this.dbUser.classes = courseMap;
            this.dbUser.markModified('classes');

            await this.dbUser.save().catch( e => console.error(e) );
            console.log( this.dbUser );

            await this.updateStartPage();
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
                    .setTitle( MenuContents.removeClassPage.title )
                    .setDescription(
                        MenuContents.removeClassPage.description.replace(
                            "<SUPPORTED_CLASSES_URL>", this.interaction.client.config.supportedClassesURL
                        ) +
                        MenuContents.crnTooltip
                    ),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle('❔ Send `cancel` to return to the main menu.')
                
            ],
            components: [],
        });

        const messageFilter = ( msg ) => msg.guild.id === this.interaction.guild.id && msg.author.id === this.interaction.user.id;
        const MCollector = this.interaction.channel.createMessageCollector({ filter: messageFilter, time: TIME });

        MCollector.on('collect', async c => {

            console.log({ collected: c.content.substring( 0, 20 ), user: this.interaction.user.username });

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
            let validated = validate( c.content, this.interaction.client );
            if ( !validated ) {
                MCollector.resetTimer();
                return this.interaction.followUp({ content: 'That is not valid! Try again.', ephemeral: true });
            }

            // remove from array of courses
            validated[0] = validated[0].toLowerCase();
            validated[1] = validated[1].toString();
            let courseMap = this.dbUser.classes;
            let courseArray = courseMap.get( validated[0] );
            if ( !courseArray.includes( validated[1] ) ) {
                this.interaction.followUp({ content: "You're not in that class, but we made absolutely sure you don't have it!", ephemeral: true });
            }
            else {
                courseArray.splice( courseArray.indexOf( validated[1] ), 1 );
                this.dbUser.classesCount = this.dbUser.classesCount - 1;
            }

            // set to map
            if ( courseArray.length < 1 )
                courseMap.delete( validated[0] )
            else
                courseMap.set( validated[0], courseArray );

            // save to user
            this.dbUser.classes = courseMap;

            // delete role
            let checkLinkCache = this.interaction.client.courses.get( validated[0].toUpperCase() ).listings.get( validated[1] ).link?.toString();
            
            console.log("\tFetching role...");
            await this.interaction.guild.roles.fetch( this.dbServer.courseData?.get( validated[0] )?.get( checkLinkCache || validated[1] )?.roleId?.toString() || '-1' )
                .then( async found => {
                    await this.interaction.member.roles.remove( found )
                        .catch(() => console.log("\tRole not contained, no action required."));;
                    console.log(`Role successfully found and removed! Role: ${found.name}(${found.id})`);
                })
                .catch(() => console.log("\tNo role found, no action required."));
            console.log('refreshing proxy servers...')
            this.dbUser.cachedServers
                .forEach( async s => {
                    console.log("PROXY: " + s);
                    if ( s == this.interaction.guild.id ) return;
        
                    // fetch and refresh
                    this.interaction.client.guilds.fetch( s )
                        .then( async guild => {
                            const Server = mongoose.model('Server', require('../../database/schemas/server') );
                            let guildData = await Server.findOne({ guildId: guild.id })
                            guild.roles.fetch( guildData.courseData?.get( validated[0] )?.get( checkLinkCache || validated[1] )?.roleId?.toString() || '-1' )
                                .then( async found => {
                                    await guild.members.fetch( this.interaction.user.id ).then( m => m.roles.remove( found )).catch();
                                    console.log(`Role successfully found and removed! Role: ${found.name}(${found.id})`);
                                })
                                .catch(() => console.log("\tNo role found, no action required."));
                        })
                        .catch( e => {
                            console.log("server does not exist, skipping...");
                            this.dbUser.cachedServers.splice( this.dbUser.cachedServers.indexOf( s ), 1 );
                        });
                    
                });
            
            await this.dbUser.save();
            console.log( this.dbUser );

            await this.updateStartPage();
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