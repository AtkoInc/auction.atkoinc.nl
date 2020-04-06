var logger = require('../logger.js')

class ListingInfo {
    constructor(infoJson) {
        if(infoJson){
            try {
                this.seller = infoJson.seller
                this.product = infoJson.product
                this.currentprice = infoJson.currentprice.toFixed(2)
                this.region = infoJson.region
                this.startprice = infoJson.startprice
            }
            catch(error) {
                logger.error(error);
            }
        }
    }

    nextBid(){
        return (parseFloat(this.currentprice) + 0.01).toFixed(2)
    }
}

module.exports = ListingInfo