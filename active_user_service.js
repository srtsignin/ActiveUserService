// var express = require('express');
// var app = express();

// app.get('/', function(req, res){
//   res.send('hello world');
// });

// app.listen(3000);

const express = require('express')
const app = express()
const port = 3000

app.get('/courses', (req, res) => res.send('Hello World!'))
app.get('/classes', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))