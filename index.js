import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mysql from 'mysql2/promise'
import bkfd2Password from 'pbkdf2-password'

const hasher = bkfd2Password()
const app = express()
app.use(cors())
app.use(bodyParser.json())
const port = 3000

const conn = await mysql.createConnection('mysql://root:pass@localhost:5436/sessions')


app.post('/login', async (req, res) => {
    console.log(req.body)
    const [result, fields] = await conn.execute(
        'SELECT * FROM users WHERE username = ?',
        ['eric']
    )
    console.log(result)
    res.send('Hello there' + result[0])
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