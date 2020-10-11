const socket = io()

//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationTemplate = document.querySelector('#location-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

//autoscroll
const autoScroll = ()=>{
    // New Message element
    const $newMessage = $messages.lastElementChild

    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of the container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

    console.log(newMessageMargin)

}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a'),
        message: message.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render($locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render($sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const userMessage = e.target.elements.message.value
    socket.emit('sendMessage', userMessage, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message Delivered!')
    })
})


$locationButton.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geo location is not supported by your browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location Shared!')
            $locationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})
