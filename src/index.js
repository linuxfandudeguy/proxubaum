const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")

const app = express()
const PREFIX = "/proxy/"

// Unblocker config optimized for modern sites
const unblocker = new Unblocker({
  prefix: PREFIX,
  cookies: true,
  redirects: true,
  decompress: true,
  urlPrefixer: true,
  charsets: true,
  csp: false,   // disable CSP to avoid breaking scripts/styles
})

// Optional homepage (can be removed if you want only /proxy)
app.get("/", (req,res)=>{
  res.send(`
  <html>
    <head><title>Proxy</title></head>
    <body>
      <h1>Proxy</h1>
      <p>Use <code>/proxy/https://example.com</code> directly in the URL.</p>
    </body>
  </html>
  `)
})

// Normalize URL if needed (optional)
function normalizeUrl(url){
  if(!url.startsWith("http://") && !url.startsWith("https://")){
    url = "https://" + url
  }
  return url
}

// Middleware to allow visiting /proxy/<url> directly
app.use(PREFIX, (req,res,next)=>{
  // req.url includes the slash at the start
  // e.g., "/https://example.com/path"
  const target = req.url.slice(1) // remove leading slash
  if(target){
    // Optional normalization
    req.url = normalizeUrl(target)
  }
  next()
})

// Let Unblocker handle everything under /proxy
app.use(unblocker)

// Export Netlify serverless handler
module.exports.handler = serverless(app)
