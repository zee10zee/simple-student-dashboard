
import express from "express"
import ejs from "ejs"
import bodyParser from "body-parser"
import methodOverride from "method-override"
import session, { Session } from "express-session"
import {dbConnect} from "./db.js"
import createTables from "./createdTables.js"
// const pgSession  = require('connect-pg-simple')(session) alternative as below
const {store, pool} = dbConnect()


const app = express()

app.use(session({
    store : new store({
        pool : pool,
        tableName: "session",
        createTableIfMissing: true, // <--- ADD THIS
    }),
    secret : 'postgres',
    resave :false,
    saveUninitialized : false,
    cookie : {secure : false}
}))

await createTables()

app.use(bodyParser.urlencoded({extended : true}))
app.use(methodOverride('_method'))
app.use(express.static('public')) //required for form data
app.use(express.json()) // required for json() body
app.get('/', (req,res)=>{
    res.render('signup.ejs')
})
app.post('/api/signup', async(req,res)=>{
    const studentName = req.body.studentName.trim();
    const grade = Number(req.body.grade.trim());
    try{
        const existingStudent = await pool.query('SELECT * from students WHERE LOWER(studentname) = LOWER($1) and grade = $2;', [studentName, grade]);
        if(existingStudent.rowCount > 0){
            return res.send('studen with these credential already exists !')
        }

        const result = await pool.query(
            `INSERT INTO students (studentname, grade) VALUES(LOWER($1) , $2) RETURNING *`, [studentName, grade]
        );
        console.log('new student successfully inserted ' + JSON.stringify(result.rows[0]))
        const s = result.rows[0]
        req.session.studentId = s.id;
        console.log('welcome ' + s.studentname)
        res.redirect('/students')
    }catch(err){
       res.send(err.message)
    }
})

app.get('/api/login', (req,res)=>{
    res.render('login.ejs')
})

app.post('/api/login', async(req,res)=>{
    try{
        const sName = req.body.sName.trim();
        const sgrade = Number(req.body.sgrade.trim());
        const student = await pool.query('SELECT * from students WHERE LOWER(studentname) = LOWER($1) and grade = $2 ', [sName, sgrade]);
        const s = student.rows[0]
        if(!s){
            return res.send('user not found !')
        }

        if(sName === s.studentname && sgrade === s.grade){
           console.log('welcome back ' + sName)
            req.session.studentId = s.id
            res.redirect('/students')
        }else{
            res.render('either name or grade is invalid')
        }
    }catch(err){
       res.send(err.message)
    }
})


// logout 

app.get('/api/logout', (req,res)=>{
    req.session.destroy((err)=>{
       if(err){
          return res.send(err)
       }
       console.log('see you next , time!')
       res.redirect('/')
    })
   
})

app.get('/students', async(req,res)=>{

  try{
       const loggedInUser = req.session.studentId;
       if(!loggedInUser){
        return res.redirect('/')
       }

    const result = await pool.query('SELECT * FROM students order by id')
    const students = result.rows
    res.render('home.ejs', {
        students : students,
    })
  }catch(err){
    console.log(err)
  }
})

app.get('/api/student/:id/update', async(req,res)=>{
    const {id} = req.params;
    const student = await pool.query(`SELECT * from students where id = $1`, [id])
    res.render('updateStudent.ejs', {s : student.rows[0]})
});

app.put('/api/student/:id/update', async(req,res)=>{
   try{
    const {id}  = req.params;
    const {editName, editGrade} = req.body;
    const q = `UPDATE students 
               SET studentname = $1, 
               grade = $2 where id = $3
               RETURNING *`
    const values = [editName, editGrade, id]
    const updatedStudent = await pool.query(q, values);
    console.log('student updatd scucesfully !' +  updatedStudent.rows[0])
    res.redirect('/students')
   }catch(err){
      return res.send(err)
   }
    //  query takes 2 params (query, values)

})


app.delete('/api/student/:id/delete', async (req,res)=>{
    const {id} = req.params
let isDeleted = false;
    try{        
      const deletedStudent = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *;', [id])
      isDeleted = true;

      if(isDeleted === true){
        res.redirect('/students')
        return console.log('student deleted successfully !' + JSON.stringify(deletedStudent.rows[0]))
        
      }
    }catch(err){
        return res.send(err.message)
    }
})

// search student

app.post('/api/student/search', async(req,res)=>{
  
    try{
        const searchInput = req.body["searchInput"];
        const searchedData = await pool.query('select * from students where studentName like $1', [`%${searchInput}%`])
        console.log(JSON.stringify(searchedData.rows))
        res.json(searchedData.rows)
    }catch(err){
        return res.status(500).json(err.message)
    }
})


app.get('/studentProfile/:id', async(req,res)=>{
    const {id} = req.params
    let loggedIn = req.session.studentId;
    if(!loggedIn){
        return res.send('please log in');
    }

    // joining tables student and his address

    const studentAddressJoin = await pool.query(`SELECT students.id, students.studentname, 
students.grade, addresses.city , 
addresses.street FROM students 
LEFT JOIN addresses ON students.id = addresses.studentid WHERE students.id = $1;`, [id])
   const studentAddress = studentAddressJoin.rows[0]
    console.log(JSON.stringify(studentAddress.city, null ,2))
     for(let key in studentAddress){
        if(studentAddress[key] === null || studentAddress === ""){
            studentAddress[key] = "N/A"
        }
     }
    res.render('studentProfile.ejs', {student :studentAddress})
})

app.post('/api/student/:id/address', async(req,res)=>{
   try{
    const id = Number(req.params.id)
    const {city,street} = req.body;
        const studentInfo = await pool.query(`INSERT INTO  addresses (city, street, studentid)  
        VALUES($1,$2,$3) RETURNING *;`, [city, street, id])
        
    console.log("student Info " + JSON.stringify(studentInfo.rows))
    res.redirect(`/studentProfile/${id}`)
   }catch(err){
      return res.send(err)
   }
})


app.listen(3000, ()=> {
    console.log('running')
})


function createTable(tableName){
    pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (id SERIAL PRIMARY KEY NOT NULL, city TEXT, street TEXT, studentId INT REFERENCES students(id))`).then((res)=>{
        console.log("table addresses created !")
    }).catch((err)=> console.log(err))
}