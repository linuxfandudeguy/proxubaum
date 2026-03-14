import { buffer } from "micro";
import app from "../../src/index.js"; // import your Express app
import { createServer } from "http";

let server = null;

export async function handler(event, context) {
  // Initialize server once
  if (!server) {
    server = createServer(app);
  }

  return new Promise((resolve) => {
    // Convert event to request/response
    const req = new Request(event.rawUrl, {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body ? Buffer.from(event.body, "base64") : null,
    });

    const resChunks = [];
    const res = new (class {
      constructor() {
        this.statusCode = 200;
        this.headers = {};
      }
      write(chunk) {
        resChunks.push(chunk);
      }
      end(chunk) {
        if (chunk) this.write(chunk);
        const body = Buffer.concat(resChunks).toString("base64");
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body,
          isBase64Encoded: true,
        });
      }
      setHeader(name, value) {
        this.headers[name] = value;
      }
    })();

    server.emit("request", req, res);
  });
}