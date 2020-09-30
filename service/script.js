navigator.serviceWorker.register('./worker.js',{scope:'./sw'}).then(res=>{
    console.log('success',res)
}).catch(err=>{
    console.log('error:',err)
})