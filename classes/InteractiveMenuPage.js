const { MessageEmbed } = require('discord.js');
/**
 * Supported custom fields.
 * @typedef {Object} pageProperties
 * @property {string?} [author] Author line.
 * @property {string?} [authorImage] Author line image (URL).
 * @property {string?} [title] Page title.
 * @property {string?} [color] Override for the initial page color.
 * @property {string?} [description] Main page contents.
 * @property {[Object]} [fields] Main page fields.
 * @property {string?} [thumbnail] Thumbnail image (URL).
 * @property {string?} [body] Large page body image (URL).
 * @property {string} [footer] Footer line.
 * @property {string} [footerImage] Footer image (URL).
 * @property {boolean} [timestamp] Show timestamp?
 */

/**
 * Interactive Menu page.
 */
class InteractiveMenuPage {

    /**
     * Construct a page for a page in an InteractiveMenu.
     * @param {...pageProperties} pageProperties
     */
    constructor( pageProperties ) {
        
        const p = { ...pageProperties };
        return new MessageEmbed({
            author: {
                name: p.author || null,
                iconURL: p.authorImage || null,
            },
            title: p.title || null,
            color: p.color || null,
            description: p.description || null,
            fields: p.fields ? [...p.fields] : null,
            thumbnail: p.thumbnail,
            image: p.body || null,
            timestamp: p.timestamp || null,
            footer: {
                text: ( p.footer || '' ) + 'This bot is not affiliated with New Mexico State University.',
                iconURL: p.footerImage || null,
            },
        });
        
    }
}

module.exports = InteractiveMenuPage;