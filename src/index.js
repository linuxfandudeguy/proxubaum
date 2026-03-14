const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")

const app = express()
const PREFIX = "/proxy/"

// Unblocker configuration
const unblocker = new Unblocker({
  prefix: PREFIX,
  cookies: true,
  redirects: true,
  decompress: true,
  urlPrefixer: true,
  charsets: true,
  csp: false // prevent script/style blocking
})

// Homepage with instructions
app.get("/", (req,res)=>{
  res.send(`
  <html>
    <head><title>Proxy</title></head>
    <body>
      <h1>Proxy</h1>
      <p>To visit a site, append it to /proxy/. For example:</p>
      <ul>
        <li><a href="/proxy/https://example.com">/proxy/https://example.com</a></li>
      </ul>
    </body>
  </html>
  `)
})

// Optional: normalize URLs before passing to Unblocker
app.use(PREFIX, (req,res,next)=>{
  if(!req.url.startsWith("http://") && !req.url.startsWith("https://")){
    req.url = "https://" + req.url
  }
  next()
})

// Let Unblocker handle everything
app.use(unblocker)

// Export serverless handler
module.exports.handler = serverless(app)
