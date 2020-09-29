

onconnect = function (c) {
    let port = c.ports[0]   
 
    port.onmessage = (m) => {  
        console.log(m.data)     
        port.postMessage('worker receive:' + m.data)
    }


    /* port.start()
    port.addEventListener('message',e=>{
            console.log('receive',e, e.data)
        port.postMessage('ffffff')
    }) */

}
// this.onerror = e=>{
//     console.log(e)
// }

/**
 * 专用worker，即普通的worker，仅能被生成它的脚本所使用，下文是DedicatedWorkerGlobalScope对象
 * 共享worker，即sharedWorker，可以被不同的window，iframe，worker访问。上下文是 SharedWorkerGlobalScope 对象
 * 共享worker需要通过port创建连接：
 **   如果不是onmessage,而是通过addEventListener监听message，必须显式调用start开启连接
 **   经过测试未开启连接的一方，将只能发送消息（能够成功），但不能接收消息
 * 不同页面发起的链接，在serviceWorker内部是不同的对象，可以通过这个来监听
 * worker.port.close() 只是关闭当前连接，其他连接（如果有的话）不会受到影响
 * 
 *
 * xhr的响应responseXML和channel总为null，
 * 一般（有特例），worker的CSP（Content-Security-Policy）配置是不受限于父worker或主线程，它有自己的执行上下文
 *
 * 结构化拷贝（indexDB也是），会产生一些副作用，比如（待测试）：
 * new Number(2) 是一个Object，拷贝后变成 number 2
 * new Person() 产生的对象obj的constructor是Person，拷贝后变成了Object
 */

 /**
  * 步骤缓存————单例页面的服务设计：
  * 1、缓存服务，ids--services
  * 2、服务队列，超出一定数量要释放服务（10个）
  *   过多的服务要提示，关闭部分页面吗？ 这可能是错误的提示，只有一个页面不断累积呢！--- 不考虑这个提示了，设置较大的队列长度 100！
  * 3、识别出页面打开了同一个内容，即使用的ids相同。所以每个service，要包含内容版本，操作的最大步骤或操作时间，一旦不一致将提示过期（请勿打开相同的页面）
  *   不能通过控制创建识别，考虑页面的刷新就行了。以及复制url，关闭当前页，在另一个页面访问 这样的操作。重复创建服务，却不是多窗口。
  * 
  * 断点续传————设计：
  * 整个断点续传都放在sharedWorker中
  * 主线程只有接收消息，显示进度的权限竞争。
  * token？ 上传权限？怎么办？  ----- 拦截登录登出，确定是否开启sharedWorker中。
  * ----可以全局了，原来只能有一个页面主要是因为刷新导致无法获取状态，现在在sharedWorker中可以随便刷新了。
  */