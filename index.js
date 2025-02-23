import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
app.use(cors())
app.use(bodyParser.json())
const port = 3000

app.post('/', (req, res) => {
    console.log(req.body)
    res.send('Hello there')
})

app.listen(port, () => {
    console.log(`Started server on port ${port}`)
})