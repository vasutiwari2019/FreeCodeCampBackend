var express = require('express');
var cors = require('cors');
require('dotenv').config()
const multer = require('multer');
const bodyParser = require('body-parser'); // Import body-parser (if needed)

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

var app = express();

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/fileanalyse', upload.single('upfile'), function (req, res) {
  if (!req.file) {
    return res.status(400).send({ error: 'No file uploaded' });
  }

  // Extract file information
  const { originalname, mimetype, size } = req.file;

  // Respond with file metadata
  res.send({
    name: originalname,
    type: mimetype,
    size: size,
  });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
