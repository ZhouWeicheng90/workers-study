let receive
globalThis.addEventListener('message', function (e) {
    close()
    if (e.data === 'finish') {
        console.log('[worker after transfer]', receive)
        return;
    }
    receive = e.data
    receive[0] = 9
    console.log('[worker change]:', receive)
    setTimeout(() => {
        console.log('===')
        self.postMessage(receive, [receive.buffer])   // 转移typedArray的buffer，typedArray长度将变成0！
    }, 1000);

}, false);
this.onerror = e=>{
    console.log(e)
}