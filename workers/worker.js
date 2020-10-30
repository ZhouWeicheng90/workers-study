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
 * worker不一定非要单独创建一个文件，参考"单文件创建worker.md"
 * 
 * worker与主线程传递数据是 拷贝传值，传的是值的拷贝而不是引用，但：
 * 如果传递的是二进制，如一个500M的文件呢？
 * 把二进制数据直接转移给子线程，但是一旦转移，主线程就无法再使用这些二进制数据了,这个操作需要这个对象是 Transferable objects
 * 经过测试，直接创建的Uint8Array对象u8不是，而ArrayBuffer（u8.buffer）是！转移后虽然原buffer仍可访问，但其length已经为0了！
 * worker.postMessage(u8或u8.buffer, [u8.buffer])   ---  注意转移时的调用方式！
 * （消息要么被复制，要么被转移，而不是共享）
 */
