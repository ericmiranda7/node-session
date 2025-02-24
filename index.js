import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mysql from 'mysql2/promise'
import bkfd2Password from 'pbkdf2-password'
import cookieParser from 'cookie-parser'

const hasher = bkfd2Password()
const app = express()
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true,
}))
app.use(bodyParser.json())
app.use(cookieParser())
const port = 3000

const conn = await mysql.createConnection('mysql://root:pass@localhost:5436/sessions')

// create sessions table
// middleware to check if session cookie then set session
// middleware to authenticate session on all routes except login & register
// on login, generate session ID
// store session ID in cookie

const sessionMid = (req, res, next) => {
    if (req.cookies.session) {
        console.log('contains cookie')
        // todo(): get session data
        // todo(): set session data
        next()
    } else {
        console.log('no cookie')
        res.status(401).send("Unauthenticated")
    }
}

app.get('/protected', sessionMid, (req, res) => {
    res.send("You have access")
})


app.post('/login', async (req, res) => {
    const [users, fields] = await conn.execute('SELECT * FROM users WHERE username = ?', [req.body.username])
    hasher({password: req.body.password, salt: users[0].salt}, (err, pass, salt, hash) => {
        if (hash === users[0].password) {
            console.log('yay')
            res.cookie('session', '123', {sameSite: 'lax', secure: false, httpOnly: true}).send('cookie set')
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