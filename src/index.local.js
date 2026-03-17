const express = require("express")
const Unblocker = require("unblocker")
const path = require("path")

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

/* binary fix (still useful for streaming) */
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

app.use(unblocker)

/* start server */
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Proxubaum running on http://localhost:${PORT}`)
})