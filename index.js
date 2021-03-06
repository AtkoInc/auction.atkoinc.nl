require('dotenv').config()
const express = require('express')
const hbs  = require('express-handlebars')
const session = require('express-session')
const bodyParser = require('body-parser')
const urlencodedParser = bodyParser.urlencoded({ extended: true });

const Auctions = require('./auction')

var passport = require('passport');
var logger = require('./logger')

const tenantResolver = require('./tenantResolver')
const userProfile = require('./models/userprofile')

const PORT = process.env.PORT || 3000;

app = express();

app.use(urlencodedParser);

app.engine('hbs',  hbs( { 
    extname: 'hbs', 
    defaultLayout: 'main', 
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
        ifEquals: (arg1, arg2, options) => {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        },
        json: (context) => {
            return JSON.stringify(context)
        },
        nextBid: (listinginfo) => {
            return listinginfo.nextBid()
        }
    }
  } ) );

app.set('view engine', 'hbs');

app.use('/static', express.static('static'));

app.use(session({
  cookie: { httpOnly: true },
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: true
}));

app.use(passport.initialize({ userProperty: 'userContext' }));
app.use(passport.session());

passport.serializeUser((user, next) => {
    next(null, user);
  });
  
  passport.deserializeUser((obj, next) => {
    next(null, obj);
  });

const tr = new tenantResolver();

function parseError(error){
    try{
        if(error.response.status === 403 && error.response.headers['www-authenticate']){
            var error_description_pattern = /.*error_description=\"([^\"]+)\",.*/
            var scope_pattern = /.*scope=\"([^\"]+)\".+/
            var des = error.response.headers['www-authenticate'].match(error_description_pattern)[1]
            var scopeRequired = error.response.headers['www-authenticate'].match(scope_pattern)[1]
            return des+ " Required Scope: "+scopeRequired
        } 

        if(error.response.data.errorSummary){
            return error.response.data.errorSummary
        }
        if (error.response.data.error_description){
        return error.response.data.error_description
        }
        else {
            logger.error(error)
            return "Unable to parse error cause. Check console."
        }
    } catch(error){
        return "Unable to parse error cause. Check console."
    }
}

const router = express.Router();

router.get("/", tr.ensureAuthenticated(), async (req, res, next) => {
    logger.verbose("/ requested")
    const requestingTenant = tr.getRequestingTenant(req);

    try {
        var auctions = await Auctions.getAuctions(req.userContext.tokens.access_token)
        res.render("index",{
            tenant: requestingTenant.tenant,
            listings: auctions
        });
    }
    catch(err){
        res.render("index",{
            tenant: tr.getRequestingTenant(req).tenant,
            error: err
        })
    }
});

router.post("/bid", tr.ensureAuthenticated(), async (req, res, next) => {
    logger.verbose("/bid requested")
    const requestingTenant = tr.getRequestingTenant(req);
    try {
        await Auctions.submitBid(req.userContext.tokens.access_token, req.body.auction, req.body.userBid)
        res.redirect("/");
    }
    catch(err){
        res.render("error",{
            msg: err
           });
    }
})

app.get("/logout", tr.ensureAuthenticated(), (req, res) => {
    logger.verbose("/logout requsted")
    let protocol = "http"
    if(req.secure){
        logger.verbose("Request was secure")
        protocol = "https"
    }
    else if(req.get('x-forwarded-proto')){
        protocol = req.get('x-forwarded-proto').split(",")[0]
        logger.verbose("Request had forwarded protocol "+protocol)
    }
    const tenant = tr.getRequestingTenant(req).tenant
    const tokenSet = req.userContext.tokens;
    const id_token_hint = tokenSet.id_token
    req.logout();
    req.session.destroy();
    res.redirect(tenant+'/oauth2/v1/logout?id_token_hint='
        + id_token_hint
        + '&post_logout_redirect_uri='
        + encodeURI(protocol+"://"+req.headers.host)
        );
});

router.get("/error",async (req, res, next) => {
    console.log(req)
    res.render("error",{
        msg: "An error occured, unable to process your request."
       });
});

app.use(router)  

app.listen(PORT, () => logger.info('app started'));