
console.log(this instanceof WorkerGlobalScope)
const clients = new Set()
this.onconnect = function (c) {
    let port = c.ports[0]
    clients.add(port)


    port.onmessage = (m) => {
        console.log('worker receive:', m.data)
        port.postMessage('reply from worker' + m.data)
    }
 
}













// this.onerror = e=>{
//     console.log(e)
// }



