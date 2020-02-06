const express = require('express');
let path = require("path");
let dirname = path.resolve('./');

let server = express();
server.listen(3000, function () {
    console.log('server start')
});

server.get('/', (req, res) => {
    res.sendFile(path.join(dirname, "/index.html"))
});
server.get('/src/main.js', (req, res) => {
    res.sendFile(path.join(dirname, '/src/main.js'))
});
server.get('/src/simulator.js', (req, res) => {
    res.sendFile(path.join(dirname, '/src/simulator.js'))
});

server.get('/stylesheets/index.css', (req, res) => {
    res.sendFile(path.join(dirname, '/stylesheets/index.css'));
});
