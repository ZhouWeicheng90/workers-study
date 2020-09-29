const worker = new Worker('./worker.js')
const u8 = new Uint8Array(new ArrayBuffer(1))
u8[0] = 1
worker.onmessage = (e) => {
    const newU8 = new Uint8Array(e.data)
    console.log("onmessage", newU8, u8)
}

worker.postMessage(u8, [u8.buffer])
