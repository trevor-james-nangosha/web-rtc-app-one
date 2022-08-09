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

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
    document.getElementById('user-1').srcObject = localStream
    createOffer()
}

let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers)
    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack()
        })
    }

    peerConnection.onicecandidate = (event) => {
        if(event.candidate ){
            console.log(`new ice candidate: ${event.candidate}`)
        }
    }

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    console.log(offer)
}

init()