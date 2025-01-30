// public/streaming/js/config.js
const CONFIG = {
  DAILY: {
    // Your Daily.co domain - this should be configured in your Daily.co dashboard
    DOMAIN: 'educationmaroc.daily.co',
    // Add your Daily.co API key here
    API_KEY: '8dc623aefd1c1dcfa9d69a3d5bc8ffea7db18018fa470bace7fce36ee2b74a3f',
    VIDEO_SETTINGS: {
      width: 1280,
      height: 720,
      frameRate: 24
    },
    AUDIO_SETTINGS: {
      echoCancellation: true,
      noiseSuppression: true
    }
  },
  UI: {
    STATES: {
      INITIALIZING: 'initializing',
      CONNECTED: 'connected',
      DISCONNECTED: 'disconnected',
      ERROR: 'error'
    }
  }
};

export default CONFIG;