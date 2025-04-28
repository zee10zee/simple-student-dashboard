import pkg from "pg"
import dotenv from "dotenv"
import pgSession from "connect-pg-simple"
import session, { Session } from "express-session"

dotenv.config();

// const db = {
//     user: process.env.PGUSER || 'postgres',
//     host: process.env.PGHOST || 'localhost',
//     database: process.env.PGDATABASE || 'world',
//     password: process.env.PGPASSWORD,
//     port: process.env.PGPORT,
//     // pool_mode : process.env.POOL_MODE
// }
const {Pool} = pkg
const store = pgSession(session)

// const pool = new Pool({
//     connectionString : process.env.DB,
//     ssl:{
//         rejectUnauthorized: false,
//     }
// })

const pool = new Pool({
    // user : 'postgres',
    // host : 'localhost',
    // database : 'world', 
    // password : 'Zohrajan10@',
    // port : 5432

    connectionString : process.env.DB_URL,
    ssl : {
        rejectUnauthorized : false
    }
})


const dbConnect = () =>{
    return {store, pool}
}



export {dbConnect};

