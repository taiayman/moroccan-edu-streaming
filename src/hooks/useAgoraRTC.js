import { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const appId = process.env.REACT_APP_AGORA_APP_ID;

const useAgoraRTC = (channelName) => {
  const [client, setClient] = useState(null);
  const [ready, setReady] = useState(false);
  const [tracks, setTracks] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAgora = async () => {
      try {
        if (!appId) {
          throw new Error('Agora App ID is not defined');
        }

        console.log('Initializing Agora client');
        const agoraClient = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8'
        });

        // Set up event listeners
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          console.log('Subscribe success, mediaType:', mediaType);
          
          if (mediaType === 'video') {
            setUsers((prevUsers) => {
              if (prevUsers.find(u => u.uid === user.uid)) {
                return prevUsers.map(u => u.uid === user.uid ? user : u);
              }
              return [...prevUsers, user];
            });
          }
          
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        agoraClient.on('user-unpublished', (user, mediaType) => {
          console.log('User unpublished, mediaType:', mediaType);
          if (mediaType === 'video') {
            setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
          }
        });

        agoraClient.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
        });

        setClient(agoraClient);
      } catch (err) {
        console.error('Error initializing Agora:', err);
        setError(err.message);
      }
    };

    initializeAgora();

    return () => {
      if (client) {
        client.removeAllListeners();
      }
    };
  }, []);

  const joinChannel = async (uid, role = 'audience') => {
    if (!client || !channelName) {
      throw new Error('Client or channel name not initialized');
    }

    try {
      console.log(`Joining channel ${channelName} as ${role} with uid ${uid}`);
      await client.join(appId, channelName, null, uid);

      if (role === 'publisher') {
        console.log('Creating local tracks');
        const [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack()
        ]);

        setTracks([audioTrack, videoTrack]);
        await client.publish([audioTrack, videoTrack]);
        console.log('Local tracks published');
      }

      setReady(true);
    } catch (err) {
      console.error('Error joining channel:', err);
      setError(err.message);
      throw err;
    }
  };

  const leaveChannel = async () => {
    if (!client) return;

    try {
      console.log('Leaving channel');
      if (tracks) {
        tracks[0]?.close();
        tracks[1]?.close();
      }
      await client.leave();
      setUsers([]);
      setReady(false);
      setTracks(null);
    } catch (err) {
      console.error('Error leaving channel:', err);
      setError(err.message);
      throw err;
    }
  };

  const switchCamera = async (deviceId) => {
    if (!tracks || !tracks[1]) return;
    
    try {
      console.log('Switching camera to device:', deviceId);
      const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
        cameraId: deviceId
      });
      
      await client.unpublish(tracks[1]);
      tracks[1].close();
      
      setTracks(prev => [prev[0], newVideoTrack]);
      await client.publish(newVideoTrack);
    } catch (err) {
      console.error('Error switching camera:', err);
      setError(err.message);
      throw err;
    }
  };

  const switchMicrophone = async (deviceId) => {
    if (!tracks || !tracks[0]) return;
    
    try {
      console.log('Switching microphone to device:', deviceId);
      const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: deviceId
      });
      
      await client.unpublish(tracks[0]);
      tracks[0].close();
      
      setTracks(prev => [newAudioTrack, prev[1]]);
      await client.publish(newAudioTrack);
    } catch (err) {
      console.error('Error switching microphone:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    client,
    ready,
    tracks,
    users,
    error,
    joinChannel,
    leaveChannel,
    switchCamera,
    switchMicrophone
  };
};

export default useAgoraRTC;