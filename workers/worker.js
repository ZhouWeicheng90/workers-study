"use strict";
importScripts('other.js');
let buffArr = []

addEventListener('message', function (e) {
    const u8 = e.data  // u8
    // const u8 = new Uint8Array(e.data)  // buffer
    u8[0] = 9
    postMessage(u8.buffer)
}, false);



/**
 * web worker 不能访问sessionStorage，localStorage！
 * self 相当于this，相当于不写。（不写时即使"use strict"了也正确）
 * onMessage 和 addEventListener 都行,其他类似
 * 内部关闭 this.close() 外部关闭  worker.terminate()
 * importScripts('script1.js', 'script2.js');  在worker内部引用其他脚本  ---   脚本下载顺序不固定，但执行会按顺序。
 * 监听错误：worker.onerror(外部),this.onerror(内部)  --- lineno,filename,message
 * worker不一定非要单独创建一个文件，参考"单文件创建worker.md"
 * worker内部还能再创建worker，父worker和子worke的交互方式相同  ---  所有worker均遵循同源限制。
 * onmessageerror和onerror不同，onmessageerror仅仅是发送的数据无法序列化成字符串时，会触发这个事件
 *
 *
 * worker与主线程传递数据是 拷贝传值，传的是值的拷贝而不是引用，但：
 * 如果传递的是二进制，如一个500M的文件呢？
 * 把二进制数据直接转移给子线程，但是一旦转移，主线程就无法再使用这些二进制数据了,这个操作需要这个对象是 Transferable objects
 * 经过测试，直接创建的Uint8Array对象u8不是，而ArrayBuffer（u8.buffer）是！转移后虽然原buffer仍可访问，但其length已经为0了！
 * worker.postMessage(u8或u8.buffer, [u8.buffer])   ---  注意转移时的调用方式！
 * （消息要么被复制，要么被转移，而不是共享）
 */
