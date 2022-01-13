/**
 * Connect to the bot database
 */
const mongoose = require('mongoose');
const uri = `mongodb+srv://rvarga95:${process.env.ATLAS_TOKEN}@s-data-main.cja8s.mongodb.net/NMSU?retryWrites=true&w=majority`;
const connect = async () => {
    await mongoose.connect( uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }), (err) => {
        if ( err ) console.error(err)
        else console.log('Database connection successful!')
    }
};
module.exports = connect;
