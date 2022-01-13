const { MessageActionRow, MessageButton, MessageEmbed, RoleManager, Role } = require('discord.js');
const mongoose = require('mongoose');
const InteractiveMenu = require('./InteractiveMenu');
const validate = require('../ValidateCourseInput');
const refreshServerClasses = require('../RefreshServerClasses');
const refreshUserClasses = require('../RefreshUserClasses');
const { userSchema } = require('../../database/schemas/user');
const validateSubjectInput = require('../ValidateSubjectInput');
const MenuContents = require('./contents/ServerDashboardMenu');
const TIME = 60 * 1000;

class ServerDashboardMenu extends InteractiveMenu {
    
    constructor( interaction, databaseInfo ) {
        super( interaction );

        this.dbServer = databaseInfo;
        this.changesMade = false;

        this.addPage({
            title: '⚙️ Hello, ' + interaction.member.displayName + '!\nWelcome to your server dashboard!',
            description:
                MenuContents.startPage.description,
            fields: [
                {
                    name: '⚙️ **Config**\n**= = = = = = =**\n\u200b\n♾️ Any Class Allowed: ' + ( this.dbServer.any ? '৹ Yes' : '✕ No' ),
                    value: '\n**🎨 Course Role Colors: ' + this.dbServer.roleColor.toString() + '**\n\u200b\n**= = = = = = =**',
                    inline: false,
                },
                {
                    name: /*'[' + ( databaseInfo.courseType.size > 0 ? '✅' : '❌' ) + ']*/ '__🏫 Allowed Subjects__',
                    value: databaseInfo.courseType.size > 0
                        ?
                        [...databaseInfo.courseType.keys()].map( key => {
                            return `> ৹ **\`${key.toUpperCase()}\`**`;
                        }).join('\n') + '\n\u200b'
                        :
                        '> 🏜️  Empty\u200b\n\u200b',
                    inline: true,
                },
                {
                    name: /*'[' + ( databaseInfo.courseSpecific.size > 0 ? '✅' : '❌' ) + ']*/ '__📔 Course Whitelist__',
                    value: databaseInfo.courseSpecific.size > 0
                        ?
                        [...databaseInfo.courseSpecific.keys()].map( key => {
                            return `> ৹ **${key.toUpperCase()}**: [${databaseInfo.courseSpecific.get(key).join(', ')}]`;
                        }).join('\n') + '\n\u200b'
                        :
                        '> 🏜️  Empty\u200b\n\u200b',
                    inline: true,
                },
                {
                    name: /*'[' + ( this.dbServer.courseBlacklist.size > 0 ? '✅' : '❌' ) + ']*/ '__🎴 Course Blacklist__',
                    value: databaseInfo.courseBlacklist.size > 0
                        ?
                        [...databaseInfo.courseBlacklist.keys()].map( key => {
                            return `> ✕ **${key.toUpperCase()}**: [${databaseInfo.courseBlacklist.get(key).join(', ')}]`;
                        }).join('\n') + '\n\u200b'
                        :
                        '> 🏜️  Empty\u200b\n\u200b',
                    inline: true,
                },
            ],
            thumbnail: interaction.guild.iconURL(),
            color: interaction.client.config.colors.neutral,
        });
        console.log("Built ServerDashboardMenu()");

        this.buttons = populateButtons( databaseInfo.any );

    }

    async startPage() {
        
        await this.interaction.editReply({
            embeds: [ new MessageEmbed( this.pages[0] ) ],
            components: [
                new MessageActionRow({ components: [ this.buttons.courses, this.buttons.whitelist, this.buttons.blacklist ] }),
                new MessageActionRow({ components: [ this.buttons.colors ] }),
                new MessageActionRow({ components: [ this.buttons.any, this.buttons.close ] }),
            ],
        });

        let filter = this.filters.button;

        let BCollector = await this.interaction.channel.createMessageComponentCollector({ filter: filter, componentType: 'BUTTON', max: 1, time: TIME });
        BCollector.on('collect', async button => {

            // BCollector.stop();
            switch( button.customId ) {
                case 'dashboard_any':
                    ( this.dbServer.any
                    ? (() => {
                        this.dbServer.any = false
                        this.buttons.any.setLabel('Any (Disabled)').setEmoji('❌').setStyle('DANGER');
                    })()
                    : (() => {
                        this.dbServer.any = true;
                        this.buttons.any.setLabel('Any (Enabled)').setEmoji('✅').setStyle('SUCCESS');
                    })())
                    this.changesMade = true;
                    await this.dbServer.save().then(() => console.log(`Settings saved for guildId:${this.interaction.guild.id}`));
                    await this.updateStartPage();
                    return this.startPage();
                case 'dashboard_courses':
                    return this.subjectPage();
                case 'dashboard_whitelist':
                    return this.courseWhitelistPage();
                case 'dashboard_blacklist':
                    return this.courseBlacklistPage();
                case 'dashboard_colors':
                    return this.roleColorPage();

                // begin refreshing EVERY member
                case 'dashboard_close':

                    if ( this.changesMade ) {
                        // begin refresh
                        let allRefresh = new MessageEmbed()
                            .setColor( this.interaction.client.config.colors.neutral )
                            .setThumbnail(process.env.PRELOADER)
                            .setTitle('⏳ Refreshing channels and each user...')
                            .setDescription('⚠️ **THIS MAY TAKE A WHILE, PLEASE DO NOT CLOSE THIS MENU**\n...cleaning up a little~ 🧹💨\n\n**Did you know?**\n'
                                + this.interaction.client.config.hints[ Math.floor( Math.random() * this.interaction.client.config.hints.length ) ]);
                        await this.interaction.editReply({ embeds: [ allRefresh ], components: [] });
                        await refreshServerClasses( this.interaction, this.dbServer )
                        this.dbServer.markModified('courseData');
                        await this.dbServer.save();

                        await this.interaction.guild.members.fetch().then( async m => {
                            
                            // search for the user in the database
                            const User = mongoose.model('User', userSchema );

                            console.log("Refreshing ALL users.");
                            for ( const [ k, member ] of m ) {

                                // if bot continue
                                if ( member.user.bot ) continue;

                                // refresh data
                                console.log("Refreshing data for: " + member.displayName );
                                let userData = await User.findOne({ userId: member.user.id }).exec();
                                if ( userData )
                                    await refreshUserClasses( this.interaction, userData, this.dbServer, true );
                                
                            }
                            console.log("Refresh done.");
                            this.dbServer.markModified('courseData');
                            await this.dbServer.save();
        
                        });
                        return this.close('refresh');
                    }
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
        
        if ( this.changesMade ) {
            this.pages[0].setFields([
                {
                    name: '⚙️ **Config**\n**= = = = = = =**\n\u200b\n♾️ Any Class Allowed: ' + ( this.dbServer.any ? '৹ Yes' : '✕ No' ),
                    value: '\n**🎨 Course Role Colors: ' + this.dbServer.roleColor.toString() + '**\n\u200b\n**= = = = = = =**',
                    inline: false,
                },
                {
                    name: /*'[' + ( databaseInfo.courseType.size > 0 ? '✅' : '❌' ) + ']*/ '__🏫 Allowed Subjects__',
                    value: this.dbServer.courseType.size > 0
                        ?
                        [...this.dbServer.courseType.keys()].map( key => {
                            return `> ৹ **\`${key.toUpperCase()}\`**`;
                        }).join('\n') + '\n\u200b'
                        :
                        '> 🏜️  Empty\u200b\n\u200b',
                    inline: true,
                },
                {
                    name: /*'[' + ( databaseInfo.courseSpecific.size > 0 ? '✅' : '❌' ) + ']*/ '__📔 Course Whitelist__',
                    value: this.dbServer.courseSpecific.size > 0
                        ?
                        [...this.dbServer.courseSpecific.keys()].map( key => {
                            return `> ৹ **${key.toUpperCase()}**: [${this.dbServer.courseSpecific.get(key).join(', ')}]`;
                        }).join('\n') + '\n\u200b'
                        :
                        '> 🏜️  Empty\u200b\n\u200b',
                    inline: true,
                },
                {
                    name: /*'[' + ( this.dbServer.courseBlacklist.size > 0 ? '✅' : '❌' ) + ']*/ '__🎴 Course Blacklist__',
                    value: this.dbServer.courseBlacklist.size > 0
                        ?
                        [...this.dbServer.courseBlacklist.keys()].map( key => {
                            return `> ✕ **${key.toUpperCase()}**: [${this.dbServer.courseBlacklist.get(key).join(', ')}]`;
                        }).join('\n') + '\n\u200b'
                        :
                        '> 🏜️  Empty\u200b\n\u200b',
                    inline: true,
                },
            ],);

            this.pages[0] = new MessageEmbed( this.pages[0] );
        
            this.buttons.close
                .setLabel('Close and begin refreshing channels and users.')
                .setEmoji('🔃')
                .setStyle('PRIMARY');
            
            return Promise.resolve('Page successfully updated.');
        }
        return Promise.resolve('No changes made, page not updated.');
    }

    async subjectPage() {

        await this.interaction.editReply({
            embeds: [
                new MessageEmbed( this.pages[0] )
                    .setColor( this.interaction.client.config.colors.positive )
                    .setTitle('🏫 Add/Remove-A-Whole-Subject Wizard')
                    .setDescription( MenuContents.subjectPage.description + "\n\n" +
                        MenuContents.sbjTooltip ),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle("🔃 If the global course subject already is set, send it again to remove it!\n\n❔ Send `cancel` to return to the main menu.")
            ],
            components: [],
        });

        const messageFilter = ( msg ) => msg.author.id === this.interaction.user.id;
        const MCollector = this.interaction.channel.createMessageCollector({ filter: messageFilter, time: TIME });


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
            console.log(c.content)
            let validated = validateSubjectInput( c.content.toString(), this.interaction.client );
            if ( !validated ) {
                return this.interaction.followUp({ content: 'That is not a valid course subject! Try again.', ephemeral: true });
            }


            // set course type Set
            if ( this.dbServer.courseType.has( validated ) )
                this.dbServer.courseType.delete( validated )
            else
                this.dbServer.courseType.set( validated, validated );

            // save to server
            this.dbServer.markModified('courseType');
            await this.dbServer.save();
            console.log( this.dbServer );

            this.changesMade = true;
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

    async courseWhitelistPage() {

        await this.interaction.editReply({
            embeds: [
                new MessageEmbed( this.pages[0] )
                    .setColor( this.interaction.client.config.colors.positive )
                    .setTitle('✅ Specific Allowed Courses Wizard')
                    .setDescription( MenuContents.whitelistPage.description + "\n\n" +
                        MenuContents.crnTooltip ),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle('🔃 If the allowed course already is set, send it again to remove it!\n\n❔ Send `cancel` to return to the main menu.')
            ],
            components: [],
        });

        const messageFilter = ( msg ) => msg.author.id === this.interaction.user.id;
        const MCollector = this.interaction.channel.createMessageCollector({ filter: messageFilter, time: TIME });


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
            console.log(c.content)
            let validated = validate( c.content.toString(), this.interaction.client );
            if ( !validated ) {
                return this.interaction.followUp({ content: 'That is not a valid course! Try again.', ephemeral: true });
            }


            // set course type array
            if ( !this.dbServer.courseSpecific.has( validated[0] ) )
                this.dbServer.courseSpecific.set( validated[0], [] );

            // if exists remove, else add and sort
            const courseSpecificArray = this.dbServer.courseSpecific.get( validated[0] );
            const courseSpecificIndex = courseSpecificArray.indexOf( validated[1] );
            if ( courseSpecificIndex >= 0 ) {
                courseSpecificArray.splice( courseSpecificIndex, 1 );
                if ( courseSpecificArray.length < 1 )
                    this.dbServer.courseSpecific.delete( validated[0] );
            }
            else {
                this.dbServer.courseSpecific.get( validated[0] ).push( validated[1] );
                this.dbServer.courseSpecific.get( validated[0] ).sort( (a, b) => a - b );
            }

            // save to server
            this.dbServer.markModified('courseSpecific');
            await this.dbServer.save();
            console.log( this.dbServer );

            this.changesMade = true;
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

    async courseBlacklistPage() {

        await this.interaction.editReply({
            embeds: [
                new MessageEmbed( this.pages[0] )
                    .setColor( this.interaction.client.config.colors.positive )
                    .setTitle('🎴 Specific Denied Courses Wizard')
                    .setDescription( MenuContents.blacklistPage.description + "\n\n" +
                        MenuContents.crnTooltip ),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle('🔃 If the disallowed course already is set, send it again to remove it!\n\n❔ Send `cancel` to return to the main menu.')
            ],
            components: [],
        });

        const messageFilter = ( msg ) => msg.author.id === this.interaction.user.id;
        const MCollector = this.interaction.channel.createMessageCollector({ filter: messageFilter, time: TIME });


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
            console.log(c.content)
            let validated = validate( c.content.toString(), this.interaction.client );
            if ( !validated ) {
                return this.interaction.followUp({ content: 'That is not a valid course! Try again.', ephemeral: true });
            }


            // set course type array
            if ( !this.dbServer.courseBlacklist.has( validated[0] ) )
                this.dbServer.courseBlacklist.set( validated[0], [] );

            // if exists remove, else add and sort
            const courseBlacklistArray = this.dbServer.courseBlacklist.get( validated[0] );
            const courseBlacklistIndex = courseBlacklistArray.indexOf( validated[1] );
            if ( courseBlacklistIndex >= 0 ) {
                courseBlacklistArray.splice( courseBlacklistIndex, 1 );
                if ( courseBlacklistArray.length < 1 )
                    this.dbServer.courseBlacklist.delete( validated[0] );
            }
            else {
                this.dbServer.courseBlacklist.get( validated[0] ).push( validated[1] );
                this.dbServer.courseBlacklist.get( validated[0] ).sort( (a, b) => a - b );
            }

            // save to server
            this.dbServer.markModified('courseBlacklist');
            await this.dbServer.save();
            console.log( this.dbServer );

            this.changesMade = true;
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

    async roleColorPage() {

        await this.interaction.editReply({
            embeds: [
                new MessageEmbed( this.pages[0] )
                    .setColor( this.interaction.client.config.colors.positive )
                    .setTitle('🎨 Let\'s color!')
                    .setDescription( MenuContents.roleColorPage.description + "\n\n" +
                        MenuContents.clrTooltip ),
                new MessageEmbed({ color: this.interaction.client.config.colors.muted })
                    .setTitle('Please send a valid color in HEX code (i.e. #1B3FFF)!\n\n❔ Send `default` to return to the default color.\n\n❔ Send `cancel` to return to the main menu.')
            ],
            components: [],
        });

        const messageFilter = ( msg ) => msg.author.id === this.interaction.user.id;
        const MCollector = this.interaction.channel.createMessageCollector({ filter: messageFilter, time: TIME });


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

            // validate input
            let validated = "";
            console.log( c.content );
            if ( c.content.trim().toLowerCase() == 'default' ) {
                validated = "0xeeacd5";
            }
            else {
                // parse hex code
                validated = c.content.replace(/(0x)|(#)/g, '');
                console.log( validated.replace(/[0-9A-Fa-f]{6}/g, 'W') );
                if ( !validated.match(/[0-9A-Fa-f]{6}/) ) {
                    return this.interaction.followUp({ content: 'That is not a valid HEX color! Please try again.', ephemeral: true });
                }
                validated = "0x" + validated;
            }
            console.log( validated );

            // if this is already the color, return out
            if ( this.dbServer.roleColor === validated ) {
                MCollector.stop();
                await this.interaction.followUp({ content: `> 🌠 \`${validated}\` **is already your preferred role color!**`, ephemeral: true });
                return this.startPage();
            }

            
            // set to server
            this.dbServer.roleColor = validated;

            // begin cycling through roles and updating their color
            await this.dbServer.courseData.forEach( ( courseArray ) => {
                courseArray.forEach( async course => {
                    /**
                     * @type {Role}
                     */
                    let role = await this.interaction.guild.roles.fetch( course.roleId ).catch( e => console.log('Role no longer exists.'));
                    if ( !role ) return;

                    await role.setColor( validated, "Admin requested course default color change.");
                });
            });

            // save to server
            this.dbServer.markModified('roleColor');
            await this.dbServer.save();
            console.log( this.dbServer );

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

}


function populateButtons( isAny ) {
    return {
        any: isAny
            ?
            new MessageButton()
                .setLabel('Any (Enabled)')
                .setCustomId('dashboard_any')
                .setEmoji('✅')
                .setStyle('SUCCESS')
            :
            new MessageButton()
                .setLabel('Any (Disabled)')
                .setCustomId('dashboard_any')
                .setEmoji('❌')
                .setStyle('DANGER'),
        courses: new MessageButton()
            .setLabel('All Courses from Subject')
            .setCustomId('dashboard_courses')
            .setEmoji('🏫')
            .setStyle('PRIMARY'),
        whitelist: new MessageButton()
            .setLabel('Specific Courses')
            .setCustomId('dashboard_whitelist')
            .setEmoji('📔')
            .setStyle('PRIMARY'),
        blacklist: new MessageButton()
            .setLabel('Unallowed Courses')
            .setCustomId('dashboard_blacklist')
            .setEmoji('🎴')
            .setStyle('PRIMARY'),
        colors: new MessageButton()
            .setLabel('Role Color')
            .setCustomId('dashboard_colors')
            .setEmoji('🎨')
            .setStyle('PRIMARY'),
        close: new MessageButton()
            .setLabel('Close')
            .setCustomId('dashboard_close')
            .setStyle('SECONDARY'),
        back: new MessageButton()
            .setLabel('Back')
            .setCustomId('class_back')
            .setEmoji('↩️')
            .setStyle('SECONDARY')
    }
}


module.exports = ServerDashboardMenu;