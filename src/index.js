const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")

const app = express()
const PREFIX = "/proxy/"

// Minimal Unblocker setup optimized for site compatibility
const unblocker = new Unblocker({
  prefix: PREFIX,
  cookies: true,       // preserve cookies
  redirects: true,     // handle 3xx redirects
  decompress: true,    // decompress gzip/deflate HTML
  urlPrefixer: true,   // rewrite all asset URLs through /proxy/
  charsets: false,     
  hsts: true,          
  hpkp: true,         
  csp: true,         
})

// Simple homepage
app.get("/", (req,res)=>{
  res.send(`
  <html>
    <head><title>Proxy</title></head>
    <body>
      <h1>Proxy</h1>
      <form action="/go">
        <input name="url" placeholder="https://example.com">
        <button>Go</button>
      </form>
    </body>
  </html>
  `)
})

// Normalize user input
function normalizeUrl(url){
  if(!url.startsWith("http://") && !url.startsWith("https://")){
    url = "https://" + url
  }
  return url
}

// Redirect /go to proxied URL
app.get("/go", (req,res)=>{
  let url = req.query.url
  if(!url) return res.send("Missing url")

  url = normalizeUrl(url)
  res.redirect(PREFIX + url) // do NOT encode
})

// Let Unblocker handle all proxied requests
app.use(unblocker)

// Export serverless handler
module.exports.handler = serverless(app)
