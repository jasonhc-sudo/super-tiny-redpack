const {readFileSync,writeFileSync,existsSync} = require('fs');
const path = require('path');
const projectPath = path.resolve(__dirname,'../');

//module.simpleTmp 为合并bundle模板，将每个模块通过对象包裹，抛出一个function，带有三个入参module,exports,require
//chunk.simple 为异步chunk模板，将每个模块通过__asyncRequire包裹，通过回调function的方式，为了使异步读取的chunk能通过promise进行异步加载
//bundle.simpleTmp 为打包模块（类似于require的打包方式），IIFE的原理

//读取redpack.config配置
const redpackConfig = require('../redpack.config');

//进行打包
pack(redpackConfig);

//redpack打包方法
function pack(redpackConfig) {
    
    //默认配置
    const defaultConfig = {
        entry:'index.js',
        output:'./',
        filename:'index.bundle.js'
    }

    //将默认配置和redpack.config配置合并为config
    const config = Object.assign(defaultConfig,redpackConfig);

    !Array.isArray(config.entry) ? config.entry = [config.entry] : void 0;

    //遍历config入口
    config.entry.forEach(entry => {
        
        //存放异步加载chunk
        let chunks = [];

        //获取入口文件位置
        const filePath = path.resolve(projectPath, entry);

        //判断是否当前位置是否存在
        if(!existsSync(filePath)) throw new TypeError(filePath+' has no this path');

        //读取入口文件信息
        const fileStr = readFileSync(path.resolve(projectPath, entry)).toString();
        const entryStr = fileStr;

        //深挖异步加载依赖
        deepPackFind(chunks , fileStr, path.resolve(filePath,'../'));

        //获取入口文件，作为入口文件及bundle总文件的entryId
        const entryId = entry.split('/')[entry.split('/').length-1];

        //深依赖文件与打包好以后的分片bundle文件(chunk)的映射关系对象
        const depChunk = {};

        //遍历chunks
        chunks.forEach((item,index)=>{
            //将chunks的索引与bundle文件名合并为分片bundle文件名
            const chunkId = (index+1)+"."+config.filename;

            //设置深依赖文件与打包好以后的分片bundle文件(chunk)
            depChunk[item.chunkName] = chunkId;

            //chunk模板替换写入
            const chunkTemp = readFileSync(path.resolve(__dirname,'./chunk.simpleTmp'),'utf-8').toString()
                .replace('/* chunk id */',item.chunkName)
                .replace('/* chunk module */',item.fileStr);
            writeFileSync(path.resolve(filePath,'../')+'/'+chunkId,chunkTemp);
        })

        //module的模板填充
        const moduleTemp = readFileSync(path.resolve(__dirname,'./module.simpleTmp'),"utf-8").toString()
            .replace('/* module id */',entryId)
            .replace('/* modules */',entryStr)
            ;

        const entryName = config.filename;
        let depChunks = [];
        for(let dep in depChunk){
            depChunks.push(`'${dep}':'${depChunk[dep]}'`);
        }

        //bundle的模板填充
        const bundleTemp = readFileSync(path.resolve(__dirname,'./bundle.simpleTmp'),"utf-8").toString()
            .replace('/* dep chunks */',depChunks.join(','))
            .replace('/* bundle modules */',moduleTemp)
            .replace('/* entry */',entryId)
        writeFileSync(path.resolve(filePath,'../')+'/'+entryName,bundleTemp);
        
    });

    //深挖异步加载依赖方法
    function deepPackFind(chunks , file , basePath) {
        const modulePathMatcher = /require(\.ensure)?\((\[)?["`'](.+?)["`'](\])?\)/g;
        //找寻require.ensure方法
        while((match = modulePathMatcher.exec(file))){
            
            //获取ensure和deep依赖
            const [,ensure,,deep] = match;
            //获取deep依赖路径
            const deepFilePath = path.resolve(basePath, deep);

            //判断是否deep依赖位置文件是否存在
            if(!existsSync(deepFilePath)) throw new TypeError(deepFilePath+' has no this path');

            //读取deep依赖文件信息
            const deepFileStr = readFileSync(path.resolve(basePath, deep)).toString();

            //如果是ensure方法则继续深挖
            if(ensure){
                chunks.push({
                    chunkName:deep,
                    fileStr:deepFileStr
                });
                deepPackFind(chunks,deepFileStr,basePath);
            }
            
        }
        
        return;

    }

}
