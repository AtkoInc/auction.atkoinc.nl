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