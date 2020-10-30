# workers-study

serviceWorker

https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

一般作为web应用程序、浏览器和网络（如果可用）之前的代理服务器。它们旨在（除开其他方面）创建有效的离线体验，拦截网络请求，以及根据网络是否可用采取合适的行动并更新驻留在服务器上的资源。他们还将允许访问推送通知和后台同步API。



只有worker和sharedWorker才是标准通用的

为什么sharedWorker在手机端的浏览器基本都没有实现？手机端谁会开启多个窗口？？



除了serviceworker，专用的还有audioWorker：

https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API#Audio_Workers

使得在web worker上下文中直接完成脚本化音频处理成为可能。



web worker 不能访问sessionStorage，localStorage！

self 相当于this，相当于不写。（不写时即使"use strict"了也正确）

onMessage 和 addEventListener 都行,其他类似

内部关闭 this.close() 外部关闭 worker.terminate()

importScripts('script1.js', 'script2.js'); 在worker内部引用其他脚本 ---  脚本下载顺序不固定，但执行会按顺序。

监听错误：worker.onerror(外部),this.onerror(内部) --- lineno,filename,message

worker内部还能再创建worker，父worker和子worke的交互方式相同 --- 所有worker均遵循同源限制。

onmessageerror和onerror不同，onmessageerror仅仅是发送的数据无法序列化成字符串时，会触发这个事件



专用worker，即普通的worker，仅能被生成它的脚本所使用，下文是DedicatedWorkerGlobalScope对象

共享worker，即sharedWorker，可以被不同的window，iframe，worker访问。上下文是 SharedWorkerGlobalScope 对象

```js
if(!(this instanceof SharedWorkerGlobalScope)){
    throw new Error('this jsFile must be executed in sharedWorker!')
}
```

这两种scope的基类都是WorkerGlobalScope



## 工程构建中的worker

如果路径错误，在new worker时能成功创建worker，但worker实例中会报错：

![image-20201010135544671](E:\MGh\workers-study\image-20201010135544671.png)

在webpack构建的项目中：worker依赖不能被识别出来，也不会被打包，下面的语句创建的worker，最终一定会报上面的错误

``` js
new SharedWorker('./gloable-tasks/opCacheWorker.js',{name:'配音步骤缓存服务'})   // 依赖的文件不会被识别，打包
```

如何解决？

添加多入口，以便打包worker.js，也不行。因为经过打包转换后，通常会为文件添加hash后缀——你没法知道最终的文件路径。另外，即便通过添加多入口来打包，但在worker.js中引入其他js 也无法识别出来：

``` js
importScripts('./opDb.js')  // 这样的引入也无法被webpack识别出来，importScripts会被当做普通方法直接忽略。
```

由于无法识别以上两种依赖，所以不能被打包转换！**所以在vue这样的webpack项目中，只能将worker js 放到public静态目录中**！！！由于不会被babel等打包编译，**worker js必须要用原生语言编写**！



非要对worker脚本编译，只能对每个文件单独编译，并且不要改变文件名。显然webpack不是一个很好的工具，也许gulp这类基于任务流的打包工具可以。gulp我不是很懂，不过这里写的脚本都是原生的！

## worker的多文件集成

worker中文件引入只有一种方法 `importScripts` ，这是**同步引入执行脚本**的方法！

第三方文件需要暴露的变量或函数，没法像es6那样精确进行，我们需要像传统的`<script src="...">` 这样来进行多文件的集成——我们只能单纯的引用（并执行）脚本，所以只能借助全局作用域来做功能集成！举个例子：

``` js
// worker.js
importScripts('./dbOpen.js')  
// 【这里是重点】：打开数据库，是个异步操作：worker.js 没法知道什么时候完成或出错，除非运用本例中的技巧！具体看下方dbOpen.js
this.dbPromise.then(DB => {   // 引入脚本是同步的，这里可以安全的使用 脚本注入的全局变量'dbPromise'
    this.DB = DB
    importScripts('./dbServiceGenerate.js')  // 拿到DB后，创建事务服务。这是个同步过程，所以下方可以直接使用
    console.log(this.dbService)
}).catch(e=>{
    console.warn(e)
}).finally(()=>{
    this.dbPromise = undefined;  // 可以删除这个不再用到的变量！
})
```

``` js
// dbOpen.js
(function (self) {   
    // 优先使用自执行匿名函数，避免不必要的全局污染
    function openDB() {
        // 开启indexDB代码省略： 函数返回一个 Promise<IDBDatabase>
    }
    function updateDataByModifyTime(DB) {
        // db数据升级 代码省略，升级成功后，返回一个 Promise<IDBDatabase> 以便链式操作DB       
    }
    
    // 【这里是重点】：add a 'dbPromise' to workerGlobalScope ! 注意看上面worker.js中直接写dbPromise.then
    // 注意这个表达式，巧妙的运用Promise的链式操作，整个代码是同步的，所以上面worker.js中直接写dbPromise是没有任何问题的
    self.dbPromise = openDB().then(db => updateDataByModifyTime(db))
    
})(globalThis || self || this)

```

## worker内部运行异常的处理

通常抛出一个异常，外界就会捕获异常，但是worker内部的抛出异常，主线程无法捕获到！

``` js
throw e   // 外界无法获取
// 在sharedWorker例子中，如果worker脚本内只有一句异常抛出，可以很清楚发现，主线程没有任何影响！而worker的console会打印出错误未捕获提示
```

既然抛出异常无法通知到主线程，我们可以尝试dispatchEvent发出事件：

``` js
port.dispatchEvent(new CustomEvent('error',{error:e}))  // 这样向外界抛出事件不行！ 可能原因：port不是同一个对象！
self.dispatchEvent(new CustomEvent('error', { error: e }))   // 外界还是无法获取
```

dispatchEvent发出的事件，只能被同一个对象接收：

```js
setTimeout(() => {
    self.dispatchEvent(new CustomEvent('error', { error: e }))   // 外界还是无法获取
}, 33);
self.onerror = e=>{
    console.warn('eeee: ff===',e)
}
// self对象发出的事件，必须由self对象来监听
```

看来dispatchEvent也无法完成通知主线程的任务。

worker的onerror事件是创建时产生，如worker脚本不可用，这些交互都是不能被hack的。

worker内部的运行异常，要么自己消化掉（不处理仅仅会有console提示），要么通过postMessage告诉主线程，只有这一条路！

## worker与主线程交互的promise化

主线程向worker发送消息：各种不同类型的操作请求！

worker向主线程发送消息：对请求的结果响应，成功或失败+对应的数据

我们还需要一个请求id，响应时带上这个id，明确是对哪个请求的回应。想象：主线程不断发起操作请求，同时又不间断的收到响应，这中间可没有一个严格的时间顺序，请求与响应的对应关系必须由一个id关联起来。

promise化的关键是id，在编码时 充分运用代理，闭包等 封装自定义的数据，简化参数传递。

**worker内部：**

``` js
port.onmessage = e => {
    const customPostMessage = function (message, transfer) {
        // 运用闭包的技巧，临时创建一个发送消息方法，自动追加正确的reqId;后续使用customPostMessage发送的消息,是reqId无侵入的！        
        message.reqId = e.data.reqId   
        port.postMessage(message, transfer)
    }
    handleEntry(customPostMessage, e.data.type, e.data.params)
}


// worker中这样使用它发送消息：
customPostMessage({
    type: 'error',
    msg: dbOpenError.message
})
customPostMessage({
    type: 'success',
    data: res
})
```

**主线程：**

```js
/**
 * @type {Map<number,[resolve:{(p):void},reject:{(p):void}]}
 */
const asyncFnMap = new Map()
let id = 0;

function customPostMessage(resolve, reject, message, transfer) {
    message.reqId = id++   // 这样追加reqId, 后续使用customPostMessage发送的消息，是reqId无侵入的！
    asyncFnMap.set(message.reqId, [resolve, reject])    // 注意：1    
    port.postMessage(message, transfer)
}
port.onmessage = e => {
    const key = e.data.reqId
    if (!asyncFnMap.has(key)) {
        return;
    }
    const [resolve, reject] = asyncFnMap.get(key)
    if (e.data.type === 'error') {
        reject(new Error(e.data.msg))
    } else {
        resolve(e.data.data)
    }
    asyncFnMap.delete(key)
}

// 主线程中这样使用它发消息：
new Promise((resolve, reject) => {    // 注意：3
    customPostMessage(resolve, reject, {
        type: 'init',
        params: {
            bizId, articleId, fileKey
        }
    })            
})

// 注意上面标准的3个地方，是如何将消息交互 转化为 Promise交互的！
```

# 代码优化

## proxy控制方法调用的前置限制

在设计worker指令时有5个指令，init、last、push、pop-then-last、clear

除了init，和部分clear外，所有指令执行前必须先执行对应的init指令。这个校验难道要在last，push，clear，pop-then-last各写一遍吗？想使用代理：

问题1：

``` js
const commandHandlerProxy = new Proxy(commandHandler, {
    apply: function (fn, target, args) {
        console.log('proxy:', fn, args)
        return Reflect.apply(fn, target, args)
    },
    get:function(obj,prop){
        console.log('proxy get:',prop)
        
    }
})

commandHandlerProxy.last(customPostMessage, params)   // 这里尽然触发了 get！ 而不是代理里面的apply！！！
//apply 只能拦截对 proxy 本身的调用，不能拦截对 proxy 下面的方法的调用：
```

所以只能通过get进行了！

```js
 const commandHandlerProxy = new Proxy(commandHandler, {
    get: function (obj, prop, proxy) {
        if (typeof obj[prop] !== 'function' || 'init' === prop) {
            return obj[prop]
        }
        return (...args) => {
            // 你的代理操作！
            Reflect.apply(obj[prop], obj, args)
        }
    }
})
```



# https（service Worker初探）

## 安装OpenSSL

http://slproweb.com/products/Win32OpenSSL.html 注意网址是Window 的openssl的安装包的下载地址

并不是官网：https://www.openssl.org/source/

注意这里是下载的地方（我选的是[Win64 OpenSSL v1.1.1h Light EXE](http://slproweb.com/download/Win64OpenSSL_Light-1_1_1h.exe) )：

![image-20200930140907903](.\image-20200930140907903.png)

下载安装之后，请检查cmd中能否识别openssl命令，如果不能将其加到环境变量中。



## 生成ssl 证书

 ```bash
openssl genrsa -des3 -passout pass:x12yab45c -out server.pass.key 2048    # genrsa 生成私钥
 ```

Generating RSA private key, 2048 bit long modulus (2 primes)
......................................+++++
...........................+++++
e is 65537 (0x010001)

 ``` bash
openssl rsa -passin pass:x12yab45c -in server.pass.key -out server.key   # 完成后，上面命令产生的server.pass.key文件可以删除了！  rsa从私钥中提取公钥
 ```

以上两个命令也可以使用默认参数直接一步生成私钥：

``` bash
openssl genpkey -algorithm RSA -out server.key -pkeyopt rsa_keygen_bits:2048 # 前面两个命令，现在只需要这一个了！
```





writing RSA key

```bash
openssl req -new -key server.key -out server.csr     #req 生成自签证书
```

You are about to be asked to enter information that will be incorporated into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value, If you enter '.', the field will be left blank.

Country Name (2 letter code) [AU]:**CN**
State or Province Name (full name) [Some-State]:**shenzhen**
Locality Name (eg, city) []:**shenzhen**
Organization Name (eg, company) [Internet Widgits Pty Ltd]:**lsbc**
Organizational Unit Name (eg, section) []:**lsbc**
Common Name (e.g. server FQDN or YOUR name) []:lsbc
Email Address :llll@qq.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:**123456**
An optional company name []:**123456**

```bash
openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt
```

Signature ok
subject=C = CN, ST = shenzhen, L = shenzhen, O = lsbc, OU = lsbc, CN = lsbc, emailAddress = llll@qq.com
Getting Private key

## node 开启https服务

整体和原生的express搭建服务基本 一样，具体细节见代码：

```js
// 非常普通的express服务app
const express = require('express')
const path = require('path')
const app = express()
app.use(express.static(path.resolve(__dirname, 'service')))

// step1:读取生成好的证书文件，产生启动服务的配置：
const fs = require('fs')
const options = {
    key: fs.readFileSync(__dirname + '/server.key'),
    cert: fs.readFileSync(__dirname + '/server.crt'),
}

// step2：将前面创建的（非常普通的）app服务，包装成https服务
const server = require('spdy').createServer(options,app)   // 需要安装依赖：npm i -D spdy 
// 或者原生【但测试发现，原生实际创建的是 http1.1+ssl组成的https，所以不推荐】：
const server = require('https').createServer(options, app3)

// step3: 用包装后的server启动服务
server.listen(1237, () => {
    console.log('service workers: https://localhost:1237')  // 注意链接是 https协议！！
})
```



## openssl参考：

https://blog.51cto.com/shjia/1427138

https://www.cnblogs.com/pluslius/p/9936327.html

https://blog.csdn.net/qq_27489007/article/details/100597938

"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir=C:\ChromeTempFiles --unsafely-treat-insecure-origin-as-secure=https://localhost:1237 --allow-running-insecure-content --reduce-security-for-testing

# 其他

```javascript
app.use(express.static('public'))
app.use(express.static('files'))
```

访问静态资源文件时，`express.static` 中间件函数会根据目录的添加顺序查找所需的文件。





``` js
// 添加，修改时都必须显式的指明key。
objectStore.add(data, 'fkey1')
objectStore.put(data, 'fkey1')
objectStore.delete(data)      
// 'keyPath' 或 'autoIncrement'(key generator) 两两组合有以下四种定义key的方法：
const objStore = db.createObjectStore("storeName");
const objStore = db.createObjectStore("storeName", { autoIncrement : true });
const objStore = db.createObjectStore("storeName", { keyPath : 'id' });
const objStore = db.createObjectStore("storeName", { keyPath : 'id', autoIncrement : true });
```

数据中不会有任何key的信息，所以这种方式的objectStore通常作为其他store的附属，key就是另一个store的data的某个字段。









### Object.is

Object.is(a,b)  比较相等 类似于a===b, 不过 ：

`===` 运算符将数字 `-0` 和 `+0` 视为相等 ，而将[`Number.NaN`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/NaN) 与[`NaN`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/NaN)视为不相等.

Object.is将数字 `-0` 和 `+0` 视为不相等 ，而将[`Number.NaN`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/NaN) 与[`NaN`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/NaN)视为相等.

### Object之prototype相关

```js
Object.setPrototypeOf(object1, prototype)  // 设置 object1 的原型为 prototype 对象（可以为null）
prototype1.isPrototypeOf(object1)  // object1 是 prototype1 的原型吗？
const object1 = Object.create(prototype1,config?)  // 指定原型对象，创建一个对象.  config 是属性配置，参考defineProperties
Object.getPrototypeOf(object1)   // 返回对象 object1 的原型对象

```

### object常用

``` js
Object.assign(target,source1,source2...)   // 改变target 并返回target
Object.values(obj)  // 返回values
Object.keys(obj)  // 返回keys
Object.fromEntries(entries)  // entries是一个二维数组，内部的每个数组都有两个元素[key,value]
Object.entries(obj)  // 返回entries数组
```

### 对象的可扩展，密封 和 冻结：

```js
Object.seal(obj)
Object.freeze(obj)
Object.preventExtensions(obj)
Object.isSealed(obj)
Object.isFrozen(obj)
Object.isExtensible(obj)
```

### 属性相关

```js
Object.defineProperties(obj,configs)   // configs是 {key:config ...} 这样的对象
Object.defineProperty(obj,key,config)   // get set value writable enumerable configurable
Object.getOwnPropertyDescriptor(object1, 'property1');  // 返回config
Object.getOwnPropertyDescriptors(obj)   // 返回configs

Object.getOwnPropertyNames(obj)        // 返回的是所有 正常 的key   数字会变成字符串
Object.getOwnPropertySymbols(obj)   // 返回的是所有 symbol 的key
array1.propertyIsEnumerable(0)   // 返回true，0这个属性时可枚举的
// for...in语句以任意顺序遍历一个对象的 除Symbol以外的 可枚举属性。

obj.hasOwnProperty('key')   // 对象obj，是否有key这个属性
```

### try catch 能够完美的用于await

![image-20201030184227731](E:\MGh\workers-study\image-20201030184227731.png)

结果：

![image-20201030184249806](E:\MGh\workers-study\image-20201030184249806.png)

![image-20201030184315547](E:\MGh\workers-study\image-20201030184315547.png)

结果：

![image-20201030184331054](E:\MGh\workers-study\image-20201030184331054.png)

### 黑科技：用label控制多重循环

```js
var i, j;

loop1:
for (i = 0; i < 3; i++) {     
   loop2:
   for (j = 0; j < 3; j++) {  
      if (i == 1 && j == 1) {
         break loop1;    // 这里直接退出外层循环
         // continue loop1;   // 这里退出内层循环，继续外层的下一条循环
      }
      console.log("i = " + i + ", j = " + j);
   }
}
```

























Y101191200024

