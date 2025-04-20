import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import { Badge, IconButton, TextField } from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import styles from "../styles/videoComponent.module.css"; // Ensure this file exists and is correctly referenced.
import io from "socket.io-client";
import CallEnd from "@mui/icons-material/CallEnd";
import server from "../environment";
const server_url = server; // Backend server URL.

let connections = {}; // To store peer connections.

const peerConfigConnection = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // STUN server configuration.
  ],
};


export default function VideoMeetComponent() {
  // References for sockets, video, and user information.
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoRef = useRef(null);
  const videoRef = useRef([]);

  // State variables for UI and functionality.
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);
  const [screen, setScreen] = useState(null);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [checkmsg, setcheckmsg] = useState(false);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  let [showModal, setModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [clicked, setClicked] = useState(false);

  
  const getpermissions = async () => {

    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }
      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }
      if (audioAvailable || videoAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      // console.log(err);
    }
  };

  useEffect(() => {
    getpermissions();
  }, []);


  let getUserMediaSuccess = (stream) => {
    try {
      // Ensure we stop the tracks of previous stream only if localStream exists
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log("Error stopping existing tracks:", e);
    }

    // Set the new stream to localStream
    window.localStream = stream;
    // Set the local video element source to the stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Iterate over connections and add local stream to each connection
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      // Create offer and set local description
      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    // When a track ends, handle cleanup
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);

        try {
          // Stop all tracks in the current video stream
          if (localVideoRef.current.srcObject) {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          }
        } catch (e) {
          console.log("Error stopping video tracks:", e);
        }

        // Create a new stream with black screen and muted audio
        let blackSilence = (...args) =>
          new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = window.localStream;
        }

        // Update connections with the new stream
        for (let id in connections) {
          connections[id].addStream(window.localStream);
          connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description).then(() => {
                socketRef.current.emit(
                  "signal",
                  id,
                  JSON.stringify({ "sdp": connections[id].localDescription })
                );
              })
              .catch((error) => console.log(error));
          });
        }
      };
    });
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    // Update the badge only for messages from other users
    if (socketIdSender !== socketIdRef.current) {
      setcheckmsg(true); // Indicates there are new messages
      setNewMessages((prevNewMessages) => prevNewMessages + 1); // Increment the count
    }
  };

  let getMessageFromServer = (fromId, message) => {
    let signal = JSON.parse(message);
    if (fromId != socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };



  let connectToSocketServer = () => {
      socketRef.current = io.connect(server_url, { secure: false });
      socketRef.current.on("signal", getMessageFromServer);
      socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-message", addMessage);
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId != id));
      });
      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnection
          );
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };
          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );
            if (videoExists) {
              setVideos((videos) => {
                let updatedVideos = videos.map((video) => {
                  return video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video;
                });
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoPlay: true,
                playsinline: true,
              };
              setVideos((videos) => {
                let updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });


        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {
              console.error("Error adding stream to connection:", e);
            }

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => {
                  console.log(e);
                });
            });
          }
        }
      });
    });
  };

    let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };



  let black = ({ width = 640, height = 980 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    canvas.getContext("2d").fillStyle = "black";
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: true });
  };


  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((err) => {
          console.log(err);
        });
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (err) {}
    }
  };


  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };


  let routeTo=useNavigate();

const handleConnect = () => {
    if (username.trim() === '') {
      setErrorMessage('Username cannot be empty!');
    } else {
      setErrorMessage('');
      connect();
      // Proceed with your connection logic here
    }
    setClicked(true); // Set clicked to true when the button is clicked
  };
  let connect = () => {
    setAskForUsername(false);
    getMedia();
    
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

/*
      for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then(
        description
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e))
      );
    }*/

    for (let id in connections) {

      if (id === socketIdRef.current) continue;
    
      connections[id].addStream(window.localStream);
    
      connections[id].createOffer().then((offer) => {
        return connections[id].setLocalDescription(offer).then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          );
        });
      }).catch((e) => console.log(e));
    }


    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);

        try {
          // Stop all tracks in the current video stream
          if (localVideoRef.current.srcObject) {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          }
        } catch (e) {
          console.log("Error stopping video tracks:", e);
        }

        // Create a new stream with black screen and muted audio
        let blackSilence = (...args) =>
          new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = window.localStream;
        }

        // Update connections with the new stream
        getUserMedia();
      };
    });
  };


  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen != undefined) {
      getDisplayMedia();
    }
  }, [screen]);
  

  let handleScreen = () => {
    setScreen(!screen);
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };


  let handleendCall=()=>{
    try{
      let tracks=localVideoRef.current.srcObject.getTracks();
    tracks.forEach(track=>track.stop())

    }
    catch(e){}
    routeTo("/home");
    
  }



  return (

    <div>



      {askForUsername === true ? (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '20px',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
      maxWidth: '400px',
      width: '90%',
      margin: '80px auto',
    }}
  >

    <h2
      style={{
        fontSize: '26px',
        color: '#333',
        marginBottom: '25px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        textAlign: 'center',
      }}
    >
      Enter the Lobby
    </h2>

    <TextField
      id="outlined-basic"
      label="Username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      variant="outlined"
      style={{
        marginBottom: '20px',
        width: '100%',
        borderRadius: '4px',
      }}
    />

    <Button
      variant="contained"
      onClick={handleConnect}
      disabled={username.trim() === ""}
      style={{
        width: '100%',
        padding: '12px',
        fontSize: '18px',
        backgroundColor: username.trim() === "" ? '#bdbdbd' : '#3f51b5',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: username.trim() === "" ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
      }}

      onMouseOver={(e) =>
        username.trim() !== "" &&
        (e.target.style.backgroundColor = '#2c387e')
      }
      onMouseOut={(e) =>
        username.trim() !== "" &&
        (e.target.style.backgroundColor = '#3f51b5')
      }
    >
      Connect
    </Button>
    <div>
      <video ref={localVideoRef} autoPlay muted style={{
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        marginTop: '20px',
        maxHeight: '250px',
        backgroundColor: 'black'
      }}></video>
    </div>
  </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "20px" }} key={index}>
                          <p style={{ fontWeight: "bold", color: "black" }}>
                            {item.sender}
                          </p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <>No messages yet</>
                  )}
                </div>

                <div className={styles.chattingArea}>

                  <TextField
                    id="outlined-basic"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    label="Enter your chat"
                    variant="outlined"
                  />

                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    color="error"
                    endIcon={<SendIcon />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainer}>

            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleendCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            { screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}
             
              <Badge
                badgeContent={newMessages}
                value={newMessages}
                onChange={(e) => setNewMessages(e.target.value)}
                max={999}
                color="secondary"
              >
                <IconButton
                  onClick={() => {
                    setModal(!showModal);
                    if (!showModal) {
                      // Reset badge count when chat is opened
                      setNewMessages(0);
                      
                    }
                  }}
                  style={{ color: "white" }}
                >
                  <ChatIcon />
                </IconButton>
              </Badge>
           
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
          ></video>
          <div className={styles.conferenceView}>
            {videos.map((video) => {
              return (
                <div key={video.socketId}>
                  <video
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                  ></video>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}