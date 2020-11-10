
const worker = new SharedWorker('worker.js', { name: '公共服务' })


worker.port.onmessage = e => {
    console.log('[main receive]', e.data)

}
// worker.port.onmessageerror=e=>{
//     console.log('msg err:',e)
// }



console.log(worker.port)
function send() {
    const key = Math.random().toString(16).substring(2)
    worker.port.postMessage(key)
}

function close() {
    worker.port.close()
}
// 

function fn() {
    const btn1 = document.createElement('button')
    btn1.onclick = send
    btn1.innerText = "发送"

    const btn2 = document.createElement('button')
    btn2.onclick = close
    btn2.innerText = '关闭'

    document.body.append(btn1, btn2)

}

setTimeout(fn, 500);



