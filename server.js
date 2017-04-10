/*Require Modules*/
var express = require('express')
var fs = require('fs')
var path = require('path')
var shortid = require('shortid')
var http = require('http')
var AWS = require('aws-sdk')
var s3 = new AWS.S3()
// var S3FS = require('s3fs')

var multiparty = require('connect-multiparty')
var multipartyMiddleware = multiparty()

/*Global Variables*/
AWS.config.loadFromPath('./s3_config.json')
var s3 = new AWS.S3( {
    endpoint: 's3-ap-south-1.amazonaws.com',
    signatureVersion: 'v4',
    region: 'ap-south-1'
} );
var bucketName ='sketch.arjun.ninja'

var app = express()
app.use(multipartyMiddleware)

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {
  res.sendFile('static/index1.html' , { root : __dirname});
})

app.get('/static/:file', function(req, res) {
  res.sendFile(path.join(__dirname, '/static/', req.params['file']));
})


app.get('/:sketch_id', function (req, res) {
  var sketchID = `${req.params["sketch_id"]}.png`  
  var params = {
    Bucket: bucketName,
    Key: sketchID
  }
  s3.headObject(params, function(err, data) {
    if(err) {
      console.log(err)
      res.redirect('/')
    }
    else {
      res.send(`
        <html>
            <head>
                <link rel="stylesheet" href="./static/sketch.css">
            </head>
            <body>
                <img src="" alt="logo" class="logo">
                <img class="sketch" src="https://s3.ap-south-1.amazonaws.com/sketch.arjun.ninja/${sketchID}" alt="Sketch">    
                <script src="./static/sketch.js"></script>
            </body>
        </html>
      `)
    }
  })
})


app.post('/', function (req, res) {

  var newID = `${shortid.generate()}.png`
  function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    var response = {}
    if (matches.length !== 3) {
      return new Error('Invalid input string')
    }
    response.type = matches[1]
    response.data = new Buffer(matches[2], 'base64')
    return response
  }
  // res.send(req.body.imageBinary)
  var imageBuffer = decodeBase64Image(req.body.imageBinary)
  fs.writeFile('./files/image.png', imageBuffer.data)
  var stream = fs.createReadStream('./files/image.png')
  
  res.statusMessage = 200;

  var data = {
    Bucket: bucketName,
    Key: newID, 
    Body: imageBuffer.data,
    ContentEncoding: 'base64',
    ContentType: 'image/png',
  }
  s3.putObject(data, function(err, data){
      if (err) { 
        console.log(err);
        console.log('Error uploading data: ', data); 
      } else {
        console.log('succesfully uploaded the image!');
        res.send(newID)
      }
  })
})


app.listen(app.get('port'));
// console.log('magic happens on '+port)