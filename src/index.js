const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")
const path = require("path")
const crypto = require("crypto")

const app = express()
const PREFIX = "/proxy/"

/* clientside directory */
const clientDir = path.join(process.cwd(), "clientside")

/* serve static files */
app.use(express.static(clientDir))

/* serve homepage */
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"))
})

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

/* redirect form -> proxy */
app.get("/go",(req,res)=>{
  let url = req.query.url
  if(!url) return res.send("Missing url")

  url = normalizeUrl(url)
  if(!url) return res.send("Invalid url")

  res.redirect(PREFIX + encodeURIComponent(url))
})

/* decode /proxy/<encoded-url> */
app.use(PREFIX,(req,res,next)=>{
  try{
    req.url = "/" + decodeURIComponent(req.url.slice(1))
  }catch{}
  next()
})

/* binary fix */
app.use((req,res,next)=>{
  res.setHeader("Accept-Ranges","bytes")
  next()
})

/* proxy */
const unblocker = new Unblocker({
  prefix: PREFIX,
  cookies: true,
  hsts: true,
  hpkp: true,
  csp: true,
  redirects: true,
  decompress: false,
  charsets: true,
  urlPrefixer: true,
  metaRobots: true,
  contentLength: true
})

/* HTML tagging middleware */
app.use((req,res,next)=>{
  const send = res.send

  res.send = function(body){
    const type = res.getHeader("content-type") || ""

    if(type.includes("text/html") && typeof body === "string"){
      const lines = body.split("\n")

      const processed = lines.map(line=>{
        if(line.includes(PREFIX)){
          const hash = crypto
            .createHash("sha1")
            .update(line)
            .digest("hex")
            .slice(0,7)

          return `${line}\n<!-- proxubaum:${hash} -->`
        }
        return line
      })

      body = processed.join("\n")
    }

    return send.call(this, body)
  }

  next()
})

app.use(unblocker)

/* serverless export */
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
