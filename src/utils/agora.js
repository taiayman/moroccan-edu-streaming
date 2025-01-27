import AgoraRTC from 'agora-rtc-sdk-ng';

const appId = process.env.REACT_APP_AGORA_APP_ID;

export const createAgoraClient = () => {
  if (!appId) {
    throw new Error('Agora App ID is required');
  }

  const client = AgoraRTC.createClient({
    mode: 'rtc',
    codec: 'vp8'
  });

  const join = async (channelName, token) => {
    try {
      // Generate a random UID between 1 and 999999
      const uid = Math.floor(Math.random() * 999999) + 1;
      
      // Join the channel
      await client.join(appId, channelName, token, uid);
      
      // Create local audio and video tracks
      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
      ]);
      
      // Publish local tracks
      await client.publish([audioTrack, videoTrack]);
      
      return {
        client,
        localTracks: {
          audioTrack,
          videoTrack
        }
      };
    } catch (error) {
      // Cleanup if join fails
      client.leave();
      throw error;
    }
  };

  const leave = async (localTracks) => {
    try {
      // Destroy local tracks
      Object.values(localTracks).forEach((track) => {
        if (track) {
          track.stop();
          track.close();
        }
      });

      // Leave the channel
      await client.leave();
    } catch (error) {
      console.error('Error during leave:', error);
    }
  };

  const subscribe = async (user, mediaType) => {
    try {
      const track = await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        track.play(`video-${user.uid}`);
      } else if (mediaType === 'audio') {
        track.play();
      }
      return track;
    } catch (error) {
      console.error('Error subscribing to track:', error);
      throw error;
    }
  };

  client.on('user-published', async (user, mediaType) => {
    await subscribe(user, mediaType);
  });

  return {
    client,
    join,
    leave,
    subscribe
  };
};

// For development only - in production, generate tokens on the server
export const generateToken = async (channelName, role) => {
  try {
    if (!appId) {
      throw new Error('Agora App ID is required');
    }
    // For development, we'll use null as token which will work with App ID
    return null;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}; 