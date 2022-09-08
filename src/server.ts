import * as express from 'express';
import * as http from 'http';
import { AddressInfo } from 'net';
import * as WebSocket from 'ws';
import * as Net from 'net'
import * as bodyparser from "body-parser"
import { CheckToken, route } from "./auth"
import * as cors from "cors"



const app = express();


// ******** Inclusion Middlware  Express *********
app.use(express.json())             // Accepter les app JSON
app.use(express.static("./app"))    // Fournir les fichiers dans app
app.use(bodyparser.json())          // Traitement du body (POST)
app.use(bodyparser.urlencoded({ extended: true}))  // Traitement de l'encodage
app.use(cors())
app.use("/login",route)
app.use((req, res, next)  => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
   next()
  })
// ******** Server Creation *********
//initialize a simple http server
const server = http.createServer(app)


const wss = new WebSocket.Server({ server })

// ******** Connection Management *********
wss.on("connection", (ws: WebSocket) => {
    // Create connection to target
    
    const target = Net.createConnection({ 
        host: "0.0.0.0",
        port : 5900
    })

    target.on("connect", (err : boolean) => {
        console.log("Connection to target")
    })

    target.on("data" ,(data : Buffer) => {
        ws.send(data , err => err ? target.end(): true )
    })

    target.on("error", (err : Error) => {
        console.log(`Error on target connection : ${err.message}`)
        ws.close()
        target.end()
    })

    ws.on("message", (message: string) => {
        target.write(message, err => err ? target.end(): true  )
    })

    ws.on("close", () => {
        console.log("Client connection stop")
        target.end()})
    })

    wss.on("headers",(head,req)=> {
        let diag  

        const token =req.url?.substring(1) 
        if(token){
            if(CheckToken(token))
                return
            diag = "WS connection  with WRONG token"
        }else{
            diag = "WS connection  with NO token"
        }
        console.log(diag)
        req.destroy(new Error(diag))
        
    })


//start our server
server.listen(process.env.PORT || 5600, () => {
    const address : AddressInfo = server?.address() as AddressInfo
    console.log(`Server started on port ${address.port}`);
});