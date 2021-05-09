require.ensure('./a.js').then(res=>{
    console.log(res());
})

console.log('test2 has been loaded');