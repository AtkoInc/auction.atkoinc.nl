const axios = require('axios')
const Listing = require('./models/listing')

exports.getAuctions = async function (userToken){
    axios.defaults.headers.common['Authorization'] = `Bearer `+userToken
    const response = await axios.get(process.env.AUCTION_ENDPOINT+"/auction")
    var listings = []
    response.data.Items.forEach(element => {
        listings.push(new Listing(element))
    });
    return listings
}

exports.submitBid = async function (userToken, auction, bid){
    axios.defaults.headers.common['Authorization'] = `Bearer `+userToken
    var auctions = await this.getAuctions(userToken)
    var auction = auctions.find(element => element.lot === auction)
    if(parseFloat(bid) <= auction.info.currentprice){
        throw Error("You have been outbid")
    }
    auction.info.currentprice = parseFloat(bid)
    await axios.put(process.env.AUCTION_ENDPOINT+"/auction",auction)
}