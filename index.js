import express from 'express'
const app = express()
const port = 3000

app.get('/', () => {
    console.log('henlo')
}, (req, res) => {
    res.send('Hello there')
})

app.listen(port, () => {
    console.log(`Started server on port ${port}`)
})