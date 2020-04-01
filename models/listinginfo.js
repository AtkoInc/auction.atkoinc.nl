var logger = require('../logger.js')

class ListingInfo {
    constructor(infoJson) {
        if(infoJson){
            try {
                this.seller = infoJson.seller
                this.product = infoJson.product
                this.currentprice = infoJson.currentprice
                this.region = infoJson.region
                this.startprice = infoJson.startprice
            }
            catch(error) {
                logger.error(error);
            }
        }
    }
}

module.exports = ListingInfo