//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

//creating a new express server
var app = express();

//setting EJS as the templating engine
app.set( 'view engine', 'ejs' );

//setting the 'assets' directory as our static assets dir (css, js, img, etc...)
app.use( '/assets', express.static( 'assets' ) );

// faire modules ...
function callleboncoin(lbcurl,receivedLBCData){
    //var url = 'https://www.leboncoin.fr/ventes_immobilieres/1058817150.htm?ca=12_s'
    
    request(lbcurl,function(error,response,html){ 

        if(!error && response.statusCode == 200){

            const $ = cheerio.load( html )

            const lbcDataArray = $('section.properties span.value');

            let lbcData={
                price: parseInt($(lbcDataArray.get(0)).text().replace(/\s/g,''),10),
                city: $(lbcDataArray.get(1)).text().trim().toLowerCase().replace(/\_|\s/g,'-'),
                type: $(lbcDataArray.get(2)).text().trim().toLowerCase(),
                surface: parseInt($(lbcDataArray.get(4)).text().replace(/\s/g,''),10)
            }

            receivedLBCData(lbcData)
        }
        else{
            console.log(error);
        }
    })
}

function callmeilleursagents(lbcData,callback){
    var url = 'https://www.meilleursagents.com/prix-immobilier/'+lbcData.city;

    request(url,function(error,response,html){

        if(!error && response.statusCode == 200){

            
            const $ = cheerio.load( html )

            const maDataArray = $('div.prices-summary div.prices-summary__cell--median');

            let maData={
                priceAppart: parseInt($(maDataArray.get(0)).text().replace(/\s/g,''),10),
                priceHouse: parseInt($(maDataArray.get(1)).text().replace(/\s/g,''),10),
                priceRent: parseFloat($(maDataArray.get(2)).text().replace(/\s/g,''),10)
            }

            callback(lbcData, maData);
        }
        else{
            console.log(error);
        }
    })
}

//makes the server respond to the '/' route and serving the 'home.ejs' template in the 'views' directory
app.get( '/', function ( req, res ) {
    res.render( 'home', {
        message: 'Faites le test !'
    });
});

//makes the server respond to the '/result' route and serving the 'result.ejs' template in the 'views' directory
app.get( '/result', function ( req, res ) {
    var lbcurl = req.query.urlLBC;

    if (lbcurl == undefined) {
        lbcurl = '';
    }
    
    callleboncoin( lbcurl, function ( lbcData ) {
        callmeilleursagents( lbcData, function(lbcdata, maData) {
            var message = '';
            var mean = 0;

            console.log(lbcData);
            console.log(maData);
            if (lbcData.type == 'appartement') {
                if (lbcData.price/lbcData.surface == maData.priceAppart) {
                    message = 'Le bien présenté dans l\'annonce est au prix marché moyen de la région.';
                } else if (lbcData.price/lbcData.surface < maData.priceAppart) {
                    message = 'Le bien présenté dans l\'annonce est en dessous du prix marché moyen, c\'est une bonne affaire !';
                }else if (lbcData.price/lbcData.surface > maData.priceAppart) {
                    message = 'Le bien présenté dans l\'annonce est au dessus du prix marché moyen, ce n\'est pas une bonne affaire !';
                }
                mean = maData.priceAppart; 
            } else if (lbcData.type == 'maison') {
                if ((lbcData.price/lbcData.surface).toFixed(2) == maData.priceHouse) {
                    message = 'Le bien présenté dans l\'annonce est au prix marché moyen de la région.';
                }else if ((lbcData.price/lbcData.surface).toFixed(2) < maData.priceHouse) {
                    message = 'Le bien présenté dans l\'annonce est en dessous du prix marché moyen, c\'est une bonne affaire !';
                }else if ((lbcData.price/lbcData.surface).toFixed(2) > maData.priceHouse) {
                    message = 'Le bien présenté dans l\'annonce est au dessus du prix marché moyen, ce n\'est pas une bonne affaire !';
                }
                mean = maData.priceHouse; 
            }
            // rajouter conditions avec prix le plus bas et plus haut...

            console.log(message);

            res.render( 'result', {
                result: message,
                typeBien: lbcData.type,
                pricem2: (lbcData.price/lbcData.surface).toFixed(2),
                meanprice: mean,
                city: lbcData.city
            });
        });
    });
});


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});