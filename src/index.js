// api/index.js
const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")

const app = express()
const PREFIX = "/proxy/"

// Script to inject into proxied HTML pages
const proxyPatch = `
<script>
(function(){
const PREFIX="/proxy/";

function fixProxyUrl(input){
  if(typeof input!=="string") return input;
  if(!input.startsWith(PREFIX)) return input;

  const raw=input.slice(PREFIX.length);
  try{
    decodeURIComponent(raw);
    return input;
  }catch(e){
    return PREFIX+encodeURIComponent(raw);
  }
}

const origFetch=window.fetch;
window.fetch=function(input,init){
  if(typeof input==="string"){
    input=fixProxyUrl(input);
  }else if(input instanceof URL){
    input=fixProxyUrl(input.toString());
  }else if(input instanceof Request){
    const newUrl=fixProxyUrl(input.url);
    if(newUrl!==input.url){
      input=new Request(newUrl,input);
    }
  }
  return origFetch.call(this,input,init);
};
})();
</script>
`

// Normalize user input URL
function normalizeUrl(url){
  if(!url.startsWith("http")) url = "https://" + url
  try{
    const u = new URL(url)
    if(u.pathname === "") u.pathname = "/"
    return u.toString()
  }catch(e){
    return null
  }
}

// Create Unblocker
const unblocker = new Unblocker({
  prefix: PREFIX,
  cookies: true,
  hsts: true,
  hpkp: true,
  csp: true,
  redirects: true,
  decompress: true,
  charsets: true,
  urlPrefixer: true,
  metaRobots: true,
  contentLength: true,
  
})

// Homepage form
app.get("/", (req,res) => {
  res.send(`
  <html>
  <head><title>Proxubaum</title></head>
  <body>
    <h1>Proxubaum</h1>
    <form action="/go">
      <input name="url" placeholder="example.com">
      <button>Go</button>
    </form>
  </body>
  </html>
  `)
})

// Redirect /go to proxied URL
app.get("/go", (req,res) => {
  let url = req.query.url
  if(!url) return res.send("Missing url")

  url = normalizeUrl(url)
  if(!url) return res.send("Invalid url")

  const encoded = encodeURIComponent(url)
  res.redirect(PREFIX + encoded)
})

// Decode only first segment in /proxy/
app.use(PREFIX, (req,res,next) => {
  const parts = req.url.split("/")
  if(parts.length > 1){
    try{
      parts[1] = decodeURIComponent(parts[1])
      req.url = parts.join("/")
    }catch(e){}
  }
  next()
})

// Inject HTML script safely
app.use((req,res,next) => {
  const send = res.send
  res.send = function(body){
    const contentType = res.get("Content-Type") || res.get("content-type") || ""
    if(typeof body === "string" && contentType.includes("text/html")){
      body = body.replace("<head>", "<head>" + proxyPatch)
    }
    return send.call(this, body)
  }
  next()
})

// Let Unblocker handle everything else
app.use(unblocker)

// Export handler for Netlify
module.exports.handler = serverless(app)
