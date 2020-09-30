this.oninstall = function (e) {
    console.log('Service Worker install', e);
}
this.onactivate = function (e) {
    console.log('Service Worker activate', e);
}
console.log('helloworld')