const express = require('express');

let server = express();
server.listen(3000, function () {
    console.log('server start')
});

server.get('/', (req, res) => {
    res.sendFile("/Users/zhengyuanhao/Documents/Virus/index.html")
});
server.get('/src/main.js', (req, res) => {
    res.sendFile("/Users/zhengyuanhao/Documents/Virus/src/main.js")
});
server.get('/src/simulator.js', (req, res) => {
    res.sendFile("/Users/zhengyuanhao/Documents/Virus/src/simulator.js")
});

server.get('/stylesheets/index.css', (req, res) => {
    res.sendFile("/Users/zhengyuanhao/Documents/Virus/stylesheets/index.css")
});
