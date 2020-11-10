const express = require('express')
const path = require('path')
const fs = require('fs')
const options = {
    key: fs.readFileSync(__dirname + '/server.key'),
    cert: fs.readFileSync(__dirname + '/server.crt'),
}


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
const server = require('spdy').createServer(options, app3)
// const server = require('https').createServer(options, app3)
server.listen(1237, () => {
    console.log('service workers: http://localhost:1237 or https://localhost:1237')
})



/* // 开启：
const app4 = express()
app4.use(express.static(path.resolve(__dirname, 'chisheng-auido')))
app4.post('/php/sig.php', function (req, res) {
       res.send({
        "timestamp": "1565922075000023", //字符串，长度为13
        "sig": "1c613e2cfab4988c98c36ca835c8f2b1" //字符串，长度为40,其中字母是小写
    })
    // req.pipe(app4.get('/php/sig.php/php/sig.php')).pipe(res)

})
const server4 = require('spdy').createServer(options, app4)
server4.listen(1238, () => {
    console.log('service workers: http://localhost:1238 or https://localhost:1238')
}) */