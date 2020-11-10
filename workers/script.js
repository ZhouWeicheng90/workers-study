const worker = new Worker('./worker.js',{name:'专用worker'})
const u8 = new Uint8Array(new ArrayBuffer(1))
u8[0] = 1

worker.onmessage = (e) => {
    // worker.terminate()
    const receive = e.data
    console.log('[main receive]:', receive, 'orginal:', u8)
    worker.postMessage('finish')
}
worker.postMessage(u8 , [u8.buffer])  



// worker.onerror=(e)=>{
//     console.log(e)
// }
// setTimeout(() => {
//     worker.dispatchEvent(new Event('error'))
// }, 400);
worker.onmessageerror