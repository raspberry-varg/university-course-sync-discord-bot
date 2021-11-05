const { MessageActionRow } = require('discord.js');
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
        this.user = interaction.user;
        this.member = interaction.member;
        this.channel = interaction.channel;
        this.guild = interaction.guild;
        this.pages = [];
        this.currentPage = 1;
        this.messageFilter = ( msg ) => msg.author.id === interaction.user.id;
        this.buttonFilter = ( button ) => {
            button.deferUpdate();
            return button.user.id === interaction.user.id;
        }
        this.selectMenuFilter = ( menu ) => {
            menu.deferUpdate();
            return menu.user.id === interaction.user.id;
        }
        this.buttons = new MessageActionRow();
        this.selectMenus = new MessageActionRow();

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
     * @param {number} pageNumber Page to return.
     * @returns {Promise} If page change was successful.
     */
    async display( pageNumber ) {
        
        // human-readable pages 1..n
        if ( pageNumber < 1 || pageNumber > this.pages.length )
            throw new Promise.reject("REQUESTED PAGE IS OUT OF BOUNDS: " + ( pageNumber < 1 ? " ( P < 1 )" : ` ( P > ${this.pages.length} )` ) );
    
        this.currentPage = pageNumber;
        return await this.interaction.editReply({ embeds: [ this.pages[ pageNumber - 1 ] ], buttons: [ this.buttons ] });

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

    async close() {
        return await this.interaction.editReply({ content: 'This menu has been successfully closed, you may now dismiss this menu.' });
    }
}

module.exports = InteractiveMenu;