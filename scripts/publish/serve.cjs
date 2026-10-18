const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

function createServer(site) {
    site = path.resolve(site);
    const file = path.join(site,'.publish/redirects.json');
    const manifest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : {redirects:[],assetPrefixes:[]};
    const redirects = new Map(manifest.redirects.map(([from,to,preserveQuery,status = 301]) => [decodeURIComponent(from),{to,preserveQuery,status}]));
    return http.createServer((request,response) => {
        try {
            const url = new URL(request.url,'http://preview');
            const lookup = decodeURIComponent(url.pathname).replace(/\/index\.html$/,'/');
            let redirect = redirects.get(lookup) ?? redirects.get(lookup+'/');
            if (!redirect) {
                const prefix = manifest.assetPrefixes.find(prefix => url.pathname.startsWith(prefix));
                if (prefix) {
                    const target = '/assets/'+url.pathname.slice(prefix.length);
                    if (fs.existsSync(path.join(site,decodeURIComponent(target)))) redirect = {to:target,preserveQuery:true,status:302};
                }
            }
            if (redirect) {
                const target = new URL(redirect.to,'http://preview');
                if (redirect.preserveQuery) target.search = url.search;
                const location = target.origin === 'http://preview' ? target.pathname+target.search+target.hash : target.href;
                response.writeHead(redirect.status,{Location:location,...(redirect.status === 302 ? {'Cache-Control':'no-store'} : {})});
                response.end(); return;
            }
            const requested = path.resolve(site,'.'+decodeURIComponent(url.pathname));
            if (!requested.startsWith(site+path.sep) && requested !== site) throw new Error('Outside site');
            const target = fs.existsSync(requested) && fs.statSync(requested).isDirectory() ? path.join(requested,'index.html') : requested;
            if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {response.writeHead(404);response.end('Not found');return;}
            const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css',
                '.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
                '.jpeg':'image/jpeg','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2'};
            response.writeHead(200,{'Content-Type':types[path.extname(target)] ?? 'application/octet-stream',
                'Content-Length':fs.statSync(target).size});
            fs.createReadStream(target).pipe(response);
        } catch {response.writeHead(400);response.end('Invalid request');}
    });
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const value = (name,fallback) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
    const server = createServer(value('--site','build'));
    server.listen(Number(value('--port','3000')),'127.0.0.1',() => console.log(`Preview: http://127.0.0.1:${server.address().port}`));
}
module.exports = {createServer};
