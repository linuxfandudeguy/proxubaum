const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")

const app = express()

const PREFIX = "/proxy/"

function normalizeUrl(url){
  if(!url.startsWith("http")) url = "https://" + url

  try{
    const u = new URL(url)
    if(!u.pathname) u.pathname = "/"
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

  decompress: false, // important for binary

  charsets: true,
  urlPrefixer: true,
  metaRobots: true,
  contentLength: true
})

/* homepage */
app.get("/", (req,res)=>{
  res.send(`
  <html>
  <head>
  <title>Proxubaum</title>
  </head>

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

/* redirect helper */
app.get("/go",(req,res)=>{
  let url = req.query.url
  if(!url) return res.send("Missing url")

  url = normalizeUrl(url)
  if(!url) return res.send("Invalid url")

  const encoded = encodeURIComponent(url)

  res.redirect(PREFIX + encoded)
})

/* decode /proxy/<url> */
app.use(PREFIX,(req,res,next)=>{

  const raw = req.url.slice(1) // remove leading /

  try{
    const decoded = decodeURIComponent(raw)
    req.url = "/" + decoded
  }catch{}

  next()
})

/* small header fix for binary */
app.use((req,res,next)=>{
  res.setHeader("Accept-Ranges","bytes")
  next()
})

/* proxy */
app.use(unblocker)

/* serverless export with binary support */
module.exports.handler = serverless(app,{
  binary:[
    "image/*",
    "font/*",
    "video/*",
    "audio/*",
    "application/octet-stream",
    "application/pdf",
    "application/zip",
    "application/x-font-ttf",
    "application/x-font-woff",
    "application/x-font-woff2",
    "application/vnd.ms-fontobject"
  ]
})
