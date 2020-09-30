
const key = Math.random().toString(16).substring(3)
const worker = new SharedWorker('worker.js', { name: '公共服务' })
// worker的name有id的功能，不同页面要想共享worker必须名称相同！




worker.port.postMessage(key)
worker.port.onmessage = e => {
    console.log(e.data)
}



const div = document.createElement('div')
div.innerText = "stop:" + key
div.onclick=()=>{
//     worker.port.postMessage("close:"+key)
}
document.body.append(div)








// worker.port.postMessage({
//     isTest:true,
//     msg:new Number(2)
// })


/* worker.port.start()
worker.port.addEventListener('message',e=>{
    console.log(e)
}) */