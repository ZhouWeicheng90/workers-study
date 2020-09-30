# workers-study

serviceWorker

https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

一般作为web应用程序、浏览器和网络（如果可用）之前的代理服务器。它们旨在（除开其他方面）创建有效的离线体验，拦截网络请求，以及根据网络是否可用采取合适的行动并更新驻留在服务器上的资源。他们还将允许访问推送通知和后台同步API。



只有worker和sharedWorker才是标准通用的

为什么sharedWorker在手机端的浏览器基本都没有实现？手机端谁会开启多个窗口？？



除了serviceworker，专用的还有audioWorker：

https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API#Audio_Workers

使得在web worker上下文中直接完成脚本化音频处理成为可能。





```javascript
app.use(express.static('public'))
app.use(express.static('files'))
```

访问静态资源文件时，`express.static` 中间件函数会根据目录的添加顺序查找所需的文件。





# 安装OpenSSL

http://slproweb.com/products/Win32OpenSSL.html 注意网址是Window 的openssl的安装包的下载地址

并不是官网：https://www.openssl.org/source/

注意这里是下载的地方（我选的是[Win64 OpenSSL v1.1.1h Light EXE](http://slproweb.com/download/Win64OpenSSL_Light-1_1_1h.exe) )：

![image-20200930140907903](.\image-20200930140907903.png)

下载安装之后，请检查cmd中能否识别openssl命令，如果不能将其加到环境变量中。



# 生成ssl 证书

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
Email Address []:**llll@qq.com**

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

# node 开启https服务

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



# openssl参考：

https://blog.51cto.com/shjia/1427138

https://www.cnblogs.com/pluslius/p/9936327.html

https://blog.csdn.net/qq_27489007/article/details/100597938

"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir=C:\ChromeTempFiles --unsafely-treat-insecure-origin-as-secure=https://localhost:1237 --allow-running-insecure-content --reduce-security-for-testing



