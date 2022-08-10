const APP_ID = "4e3122251a6d4ae5be7db49e9436eecd"

let token = null;
let userID = String(Math.floor(Math.random() * 10000))

let client;
let channel;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomID = urlParams.get('room')

if(!roomID){
    window.location = 'lobby.html'
}

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun1.1.google.com:19302']
        }
    ]
}

// TODO;
// fix camera not found issue 
// read about this stuff of webrtc

let constraints = {
    video: {
        width: {min: 640, ideal: 1920, max: 1920},
        height: {min: 480, ideal: 1080, max: 1080}
    },
    audio: true,

}

let init = async () => {

    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({userID, token})

    channel = client.createChannel(roomID)
    await channel.join()

    channel.on('MemberJoin', handleUserJoined)
    channel.on('MemberLeft', handleUserLeft)
    client.on('MessageFromPeer', handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream
    // createOffer()
}

let handleMessageFromPeer = (message, MemberID) => {
    message = JSON.parse(message.text)
    // console.log({'message': message})
    if(message.type === 'offer'){
        createAnswer(MemberID, message.offer)
    }

    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(peerConnection)
        peerConnection.addIceCandidate(message.candidate)
    }
}

let handleUserJoined = async (MemberID) => {
    console.log(`a new user has joined the channel: ${MemberID}`)
    createOffer(MemberID)
}

let handleUserLeft = async (MemberID) => {
    document.getElementById('user-2').style.display = 'none'
    document.getElementById('user-1').classList.remove('smallFrame')
}

let createPeerConnection = async(MemberID) => {
    peerConnection = new RTCPeerConnection(servers)
    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'

    document.getElementById('user-1').classList.add('smallFrame')

    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        document.getElementById('user-1').srcObject = localStream  
    }

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = (event) => {
        if(event.candidate ){
            // console.log(`new ice candidate: ${event.candidate}`)
            client.sendMessageToPeer({text: JSON.stringify({'type': 'candidate', 'candidate': offer})}, MemberID)
        }
    }

}

let createOffer = async (MemberID) => {
    await createPeerConnection(MemberID)
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    // console.log(offer)

    client.sendMessageToPeer({text: JSON.stringify({'type': 'offer', 'offer': offer})}, MemberID)
    
}

let createAnswer = async (MemberID, offer) => {
    await createPeerConnection(MemberID)
    await peerConnection.setRemoteDescription(offer)
    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text: JSON.stringify({'type': 'answer', 'answer': answer})}, MemberID)
}

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

let userLeaveChannel = async () => {
    await channel.leave()
    await client.logout()
}

let toggleCamera = async () => {
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')
    if(videoTrack.enabled){
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255,80,80, 1)'
    }

    videoTrack.enabled = true
    document.getElementById('camera-btn').style.backgroundColor = 'rgb(179,102,249, .9)'
}

let toggleMic = async () => {
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')
    if(audioTrack.enabled){
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255,80,80, 1)'
    }

    audioTrack.enabled = true
    document.getElementById('mic-btn').style.backgroundColor = 'rgb(179,102,249, .9)'
}

window.addEventListener('beforeunload', userLeaveChannel)

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)


init()