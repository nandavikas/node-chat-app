const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages.js')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, "../public")
const port = process.env.PORT || 3000

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New websocket connection')


    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Chat Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Chat Admin',`${user.username} has joined the chat`))

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        const { username, room } = getUser(socket.id)
        io.to(room).emit('message', generateMessage(username, message))
        callback()
    })

    socket.on('sendLocation', (coordinates, callback) => {
        const { username, room } = getUser(socket.id)
        io.to(room).emit('locationMessage', generateLocationMessage(username,`https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Chat Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log(`Listening on port ${port}`)
})


