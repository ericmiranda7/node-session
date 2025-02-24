import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mysql from 'mysql2/promise'
import bkfd2Password from 'pbkdf2-password'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import MySQLStore from 'express-mysql-session'


const hasher = bkfd2Password()
const app = express()
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true,
}))
app.use(bodyParser.json())
// app.use(cookieParser())
const port = 3000

const conn = await mysql.createConnection('mysql://root:pass@localhost:5436/sessions')
var mySQLStore = MySQLStore(session)
const sessionStore = new mySQLStore({}, conn)
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, very secret',
  store: sessionStore,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
}));

// Optionally use onReady() to get a promise that resolves when store is ready.
sessionStore.onReady().then(() => {
    // MySQL session store ready for use.
    console.log('MySQLStore ready');
}).catch(error => {
    // Something went wrong.
    console.error(error);
});

// (done for us) create sessions table
// (done for us) middleware to check if session cookie then set session
// middleware to authenticate session on all routes except login & register
// (done for us) on login, generate session ID
// (done for us) store session ID in cookie

const sessionMid = (req, res, next) => {
    if (req.session.user) {
        console.log('contains user session')
        // todo(): get session data
        // todo(): set session data
        next()
    } else {
        console.log('no session')
        res.status(401).send("Unauthenticated")
    }
}

app.get('/protected', sessionMid, (req, res) => {
    res.send("You have access")
})


app.post('/login', async (req, res) => {
    const [users, fields] = await conn.execute('SELECT * FROM users WHERE username = ?', [req.body.username])
    hasher({ password: req.body.password, salt: users[0].salt }, (err, pass, salt, hash) => {
        if (hash === users[0].password) {
            console.log('yay')
            req.session.regenerate(function () {
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = {username: users[0].username};
                console.log(req.session)
                res.send('login success')
            });
        }
        else console.log('nay')
    })
})

app.post('/register', async (req, res) => {
    console.log('reg details', req.body)

    const password = req.body.password
    hasher({ password: password }, async (err, pass, salt, hash) => {
        console.log('hashing')
        await conn.execute(
            'INSERT INTO users VALUES (?, ?, ?)',
            [req.body.username, hash, salt]
        )
        res.send('User registered')
    })
})

app.listen(port, () => {
    console.log(`Started server on port ${port}`)
})