# workers-study

serviceWorker

https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

一般作为web应用程序、浏览器和网络（如果可用）之前的代理服务器。它们旨在（除开其他方面）创建有效的离线体验，拦截网络请求，以及根据网络是否可用采取合适的行动并更新驻留在服务器上的资源。他们还将允许访问推送通知和后台同步API。



只有worker和sharedWorker才是标准通用的

为什么sharedWorker在手机端的浏览器基本都没有实现？手机端谁会开启多个窗口？？



除了serviceworker，专用的还有audioWorker：

https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API#Audio_Workers

使得在web worker上下文中直接完成脚本化音频处理成为可能。