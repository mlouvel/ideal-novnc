import * as express from "express"
import {  sign, verify }  from "jsonwebtoken"
import * as sqlite from "sqlite3"
import  { compareSync, hashSync} from "bcryptjs"
require("dotenv").config("../.env")


export type userType = {
    id : number,
    name : string,
    pass : string
} | undefined

export type tokenType = {
    time : Date,
    user : userType
}

export const route = express.Router()

// Login : Get Token
route.post("/", async ( req , res )=>{
    const { name , password } = req.body
    const user = await GetUser(name)
    const status = (typeof user === 'undefined' || !compareSync(password,user?.pass)) ? 401 : 200
    
    res.status(status)
    
    if(status == 200){
        const tk : tokenType = {
            time : new Date(),
            user : user
        }
        const secret = process.env.JWT_SECRET_TOKEN as string
        res.send({token : sign(tk,secret)})
    } else {
        res.send("Bad credential")
    }
})

// Ajouter un user
route.post("/add", async ( req , res )=>{
    const { name , password } = req.body
    if( typeof name === undefined || typeof password === undefined){
        res.status(401).send("Need name and password")
        return
    }
    const user = await AddUser(name,password)
    if(user){
        res.status(201).send("User created")
    } else {
        res.status(401).send("User not created")
    }

})

/**
 * @description Récupère un user dpuis la base de donnée
 * @author m.louvel
 * @date 06/09/2022
 * @param {string} user
 * @return {*}  {Promise<userType>}
 */
const GetUser = async (user : string) : Promise<userType> => {
    return new Promise((resolve) => {
        const dbname = process.env.AUTH_DATABASE
        const db = new sqlite.Database(dbname as string)                              //connection 
        db.all(`select * from users where name = '${user}'`,(err,rows) => {     // request
                db.close()                                                      // closing
                resolve(GetUserAnswer(err,rows))                                   // result
        })
    })
}

/**
 * @description Vérifie que le résulatt de la DB est cohérent et renvoi le résultat
 * @author m.louvel
 * @date 06/09/2022
 * @param {Error} err
 * @param {any[]} rows
 * @return {*}  {userType}
 */
const GetUserAnswer = (err : Error | null, rows : any[]) : userType =>{
    if(err != null){
        return undefined
    } else {
        if(rows.length == 0){
            return undefined
        }
    }
    return rows[0] as userType
}

const AddUser = async (user : string, pass : string) : Promise<boolean> => {
    return new Promise((resolve) => {
        const dbname = process.env.AUTH_DATABASE
        const db = new sqlite.Database(dbname as string)                              //connection 
        const hash = hashSync(pass,10)
        db.all(`insert into users (name,pass) values('${user}','${hash}')`,(err,rows) => {     // request
                db.close()  
                console.log(`New user : ${user} with hash : ${hash}`)                                                    // closing
                resolve(err == null)                                   // result
        })
    })
}

export const CheckToken = ( token : string) =>{
    return verify(token, process.env.JWT_SECRET_TOKEN as string)

}