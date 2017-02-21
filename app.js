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


function callleboncoin(lbcurl,receivedLBCData){
    
    request(lbcurl,function(error,response,html){ 

        if(!error && response.statusCode == 200){

            const $ = cheerio.load( html )

            const lbcDataArray = $('section.properties span.value');
            const properties = $('span.property');

            let lbcData = [];
            for (var i = 0; i < properties.length; i++) {
                var label = $(properties[i]).text().trim();
                if(label.includes("Prix"))
                    lbcData.price = parseInt($(lbcDataArray.get(i)).text().replace(/\s/g, ''), 10);
                if(label.includes("Ville"))
                    //Améliorations: accents, apostrophes...
                    lbcData.city = $(lbcDataArray.get(i)).text().trim().toLowerCase().replace(/\_|\s/g, '-');
                if(label.includes("Type"))
                    lbcData.type = $(lbcDataArray.get(i)).text().trim().toLowerCase();
                if(label.includes("Surface"))
                    lbcData.surface = parseInt($(lbcDataArray.get(i)).text().replace(/\s/g, ''), 10);
            };

            receivedLBCData(lbcData)
        }
        else{
            console.log(error);
        }
    })
}

function callmeilleursagents(lbcData,receivedMAData){

    var url ='';
    //A améliorer: prendre en compte les arrondissements
    if((lbcData.city).includes('paris')){
        url = 'https://www.meilleursagents.com/prix-immobilier/paris-75000'
    }else if((lbcData.city).includes('lyon')){
        url = 'https://www.meilleursagents.com/prix-immobilier/lyon-69000'
    }else{
        url = 'https://www.meilleursagents.com/prix-immobilier/'+lbcData.city;
    }

    request(url,function(error,response,html){

        if(!error && response.statusCode == 200){

            
            const $ = cheerio.load( html )

            const maMedianDataArray = $('div.prices-summary div.prices-summary__cell--median');
            const maLimitsDataArray = $('div.prices-summary div.prices-summary__cell--muted');

            let maData={
                priceMedianAppart: parseInt($(maMedianDataArray.get(0)).text().replace(/\s/g,''),10),
                priceLowAppart: parseInt($(maLimitsDataArray.get(0)).text().replace(/\s/g, ''), 10),
                priceHighAppart: parseInt($(maLimitsDataArray.get(1)).text().replace(/\s/g, ''), 10),
                priceMedianHouse: parseInt($(maMedianDataArray.get(1)).text().replace(/\s/g,''),10),
                priceLowHouse: parseInt($(maLimitsDataArray.get(2)).text().replace(/\s/g, ''), 10),
                priceHighHouse: parseInt($(maLimitsDataArray.get(3)).text().replace(/\s/g, ''), 10),
            }

            receivedMAData(lbcData, maData);
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
            var high = 0;
            var low = 0;

            console.log(lbcData);
            console.log(maData);
            if (lbcData.type == 'appartement') {
                if (lbcData.price/lbcData.surface == maData.priceMedianAppart) {
                    message = 'Le bien présenté dans l\'annonce est au prix marché moyen de la région.';
                } else if (lbcData.price/lbcData.surface < maData.priceMedianAppart) {
                    message = 'Le bien présenté dans l\'annonce est en dessous du prix marché moyen, c\'est une bonne affaire !';
                }else if (lbcData.price/lbcData.surface > maData.priceMedianAppart) {
                    message = 'Le bien présenté dans l\'annonce est au dessus du prix marché moyen, ce n\'est pas une bonne affaire !';
                }
                //details
                mean = maData.priceMedianAppart; 
                high = maData.priceHighAppart; 
                low = maData.priceLowAppart; 
            } else if (lbcData.type == 'maison') {
                if ((lbcData.price/lbcData.surface).toFixed(2) == maData.priceMedianHouse) {
                    message = 'Le bien présenté dans l\'annonce est au prix marché moyen de la région.';
                }else if ((lbcData.price/lbcData.surface).toFixed(2) < maData.priceMedianHouse) {
                    message = 'Le bien présenté dans l\'annonce est en dessous du prix marché moyen, c\'est une bonne affaire !';
                }else if ((lbcData.price/lbcData.surface).toFixed(2) > maData.priceMedianHouse) {
                    message = 'Le bien présenté dans l\'annonce est au dessus du prix marché moyen, ce n\'est pas une bonne affaire !';
                }
                //details
                mean = maData.priceMedianHouse; 
                high = maData.priceHighHouse; 
                low = maData.priceLowHouse; 
            }

            console.log(message);

            res.render( 'result', {
                result: message,
                typeBien: lbcData.type,
                pricem2: (lbcData.price/lbcData.surface).toFixed(2),
                meanprice: mean,
                city: lbcData.city,
                highprice: high,
                lowprice: low
            });
        });
    });
});


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});