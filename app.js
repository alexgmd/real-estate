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


function callleboncoin(){
    var url = 'https://www.leboncoin.fr/ventes_immobilieres/1086696284.htm?ca=12_s'

    request(url,function(error,response,html){           
    //console.log(response.statusCode);

        if(!error && response.statusCode == 200){


            const $ = cheerio.load( html )

            const lbcDataArray = $('section.properties span.value');

            let lbcData={
                price: parseInt($(lbcDataArray.get(0)).text().replace(/\s/g,''),10),
                city: $(lbcDataArray.get(1)).text().trim().toLowerCase().replace(/\_|\s/g,'-'),
                type: $(lbcDataArray.get(2)).text().trim().toLowerCase(),
                surface: parseInt($(lbcDataArray.get(4)).text().replace(/\s/g,''),10)
            }
            // Display the data of the real-estate ad of lbc
            console.log(lbcData);

            // Estimation of the price by m²
            estimation(lbcData.price,lbcData.surface);

            
            //console.log($('h2.item_price span.value').text()); // show the text of the item
            //console.log($('h2 span[itemprop="address"]').text()); // show the text of the item
            //console.log($('h2.clearfix span.value').text()); // show the text of the item
            
            //console.log(lbcData.surface);
        }
        else{
            console.log(error);
        }
    })
}

function callmeilleursagents(){
    var url = 'https://www.meilleursagents.com/prix-immobilier/paris-75000/'

    request(url,function(error,response,html){           
    //console.log(response.statusCode);

        if(!error && response.statusCode == 200){


            const $ = cheerio.load( html )

            const lbcDataArray = $('div.prices-summary div.prices-summary__cell--median');

            let lbcData={
                priceAppart: parseInt($(lbcDataArray.get(0)).text().replace(/\s/g,''),10),
                priceHouse: parseInt($(lbcDataArray.get(1)).text().replace(/\s/g,''),10),
                priceRent: parseInt($(lbcDataArray.get(2)).text().replace(/\s/g,''),10)
            }
            // Display the data of the real-estate ad of lbc
            console.log(lbcData);
        }
        else{
            console.log(error);
        }
    })
}


function estimation(price, surface){
    let estimate = {
        priceByM: parseFloat((price/surface).toFixed(2))
    }
    console.log(estimate);
}


//makes the server respond to the '/' route and serving the 'home.ejs' template in the 'views' directory
app.get( '/', function ( req, res ) {
    callleboncoin();
    callmeilleursagents();

    res.render( 'home', {
        message: 'The Home Page!',
        test: 'test'
    });
});


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});