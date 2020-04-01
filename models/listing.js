var logger = require('../logger.js')
var ListingInfo = require('./listinginfo.js')

class Listing {
    constructor(listingJson) {
        if(listingJson){
            try {
                this.lot = listingJson.lot
                this.day = listingJson.day
                this.info = new ListingInfo(listingJson.info)
            }
            catch(error) {
                logger.error(error);
            }
        }
    }
}

module.exports = Listing