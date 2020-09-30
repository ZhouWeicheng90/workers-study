const express = require('express')
const path = require('path')



const app1 = express()
app1.use(express.static(path.resolve(__dirname, 'workers')))
app1.listen(1235, () => {
    console.log('web workers: http://localhost:1235')
})

const app2 = express()
app2.use(express.static(path.resolve(__dirname, 'shared')))
app2.listen(1236, () => {
    console.log('shared workers: http://localhost:1236')
})



// 对于serviceWorker需要开启https服务，像这样开启：
const app3 = express()
app3.use(express.static(path.resolve(__dirname, 'service')))
const fs = require('fs')
const options = {
    key: fs.readFileSync(__dirname + '/server.key'),
    cert: fs.readFileSync(__dirname + '/server.crt'),
}
const server = require('spdy').createServer(options,app3)
// const server = require('https').createServer(options, app3)


server.listen(1237, () => {
    console.log('service workers: http://localhost:1237 or https://localhost:1237')
})