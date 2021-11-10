const { MessageEmbed } = require('discord.js');
const InteractiveMenuPage = require('./InteractiveMenuPage');

/**
 * Base class for any interactive menu with users.
 */
class InteractiveMenu {

    /**
     * Construct an interactive menu.
     * @param {Snowflake} interaction Discord Interaction Snowflake.
     * @var {[InteractiveMenuPage]} this.pages Array of pages.
     */
    constructor( interaction ) {
        
        this.interaction = interaction;
        this.closed = false;
        this.interaction.client.on('interactionCreate', ( i ) => {
            if ( ( i.user.id === this.interaction.user.id ) && i.isCommand() && !this.closed ) {
                this.closed = true;
                return this.close('duplicateMenu');
            }
        });
        this.user = interaction.user;
        this.member = interaction.member;
        this.channel = interaction.channel;
        this.guild = interaction.guild;
        this.pages = [];
        this.currentPage = 1;
        this.messageFilter = ( msg ) => msg.author.id === interaction.user.id;
        this.buttonFilter = ( button ) => {
            if ( this.closed ) return;
            button.deferUpdate();
            return button.user.id === interaction.user.id;
        }
        this.selectMenuFilter = ( menu ) => {
            menu.deferUpdate();
            return menu.user.id === interaction.user.id;
        }

    }

    /**
     * Add a new page.
     * @param {...InteractiveMenuPage.pageProperties} pageInfo Full page info.
     */
    addPage( pageInfo ) {

        return this.pages[ this.pages.length ] = new InteractiveMenuPage( pageInfo );

    }

    /**
     * Remove a page from the list.
     * @param {number} pageNumber The page to remove.
     */
    removePage( pageNumber ) {

        // human-readable pages 1..n
        if ( pageNumber < 1 || pageNumber > this.pages.length )
            throw new Error("REQUESTED DELETE PAGE CANNOT BE LESS THAN 1 OR GREATER THAN " + this.pages.length + ".");
        
        return this.pages.splice( pageNumber - 1, 1 );
        
    }

    /**
     * Display requested page number
     * @protected
     * @param {number} pageNumbers Pages to return.
     * @returns {Promise} If page change was successful.
     */
    async display( ...pageNumbers ) {
        
        // human-readable pages 1..n
        pageNumbers.forEach( i => {
            if ( i < 1 || i > this.pages.length )
                throw new Promise.reject("REQUESTED PAGE IS OUT OF BOUNDS: " + ( pageNumbers[0] < 1 ? " ( P < 1 )" : ` ( P > ${this.pages.length} )` ) );
        });

        return await this.interaction.editReply({
            embeds: pageNumbers.map( n => new MessageEmbed( this.pages[ n - 1 ] ) ),
            buttons: [],
        });

    }

    /**
     * Go to the next page.
     */
    async nextPage() {

        // if at end of pages throw exception
        if ( this.currentPage + 1 > this.pages.length )
            throw new Promise.reject(`CANNOT CYCLE TO NEXT PAGE: ${this.currentPage + 1} IS OUT OF BOUNDS ( 1 <= P <= ${this.pages.length}).`);
        
        return this.display( this.currentPage + 1 );

    }

    /**
     * Go to previous page.
     */
    async prevPage() {

        // if at beginning of pages throw exception
        if ( this.pages - 1 < 0 )
            throw new Promise.reject("CANNOT CYCLE TO PREVIOUS PAGE: -1 IS OUT OF BOUNDS.");
        
        return this.display( this.currentPage - 1 );

    }

    /**
     * 
     * @param {[string]} type Type of closing action.
     * @returns 
     */
    async close( type ) {

        this.closed = true;
        let closeEmbed = new MessageEmbed({ color: this.interaction.client.config.colors.positive });
        switch ( type ) {
            case 'time':
                return await this.interaction.editReply({ embeds: [ closeEmbed.setTitle('⏰ This menu has run out of time!').setDescription('Please open it once more if you are still not finished by calling the command again!') ], components: [] });
            case 'duplicateMenu':
                return await this.interaction.editReply({ embeds: [ closeEmbed.setTitle('⚠️ A new command has been called!').setDescription('Please refrain from calling other commands while menus are active!') ], components: [] });
            default:
                return await this.interaction.editReply({ embeds: [ closeEmbed.setTitle('✅ This menu has been successfully closed.').setFooter('You may now dismiss this menu.') ], components: [] });
        }
    }
}

module.exports = InteractiveMenu;