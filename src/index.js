// api/index.js
const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")

const app = express()

const PREFIX = "/proxy/"

function normalizeUrl(url){
  if(!url.startsWith("http")) url = "https://" + url

  try{
    const u = new URL(url)
    if(u.pathname === "") u.pathname = "/"
    return u.toString()
  }catch{
    return null
  }
}

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
  contentLength: true
})

app.get("/", (req,res)=>{
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

app.get("/go",(req,res)=>{
  let url = req.query.url
  if(!url) return res.send("Missing url")

  url = normalizeUrl(url)
  if(!url) return res.send("Invalid url")

  const encoded = encodeURIComponent(url)

  res.redirect(PREFIX + encoded)
})

app.use(PREFIX,(req,res,next)=>{
  const parts = req.url.split("/")

  if(parts.length > 1){
    try{
      parts[1] = decodeURIComponent(parts[1])
      req.url = parts.join("/")
    }catch{}
  }

  next()
})

app.use(unblocker)

module.exports.handler = serverless(app)
