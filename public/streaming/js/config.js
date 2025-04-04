// public/streaming/js/config.js
const CONFIG = { 
  DAILY: {
    // Your Daily.co domain - this should be configured in your Daily.co dashboard
    DOMAIN: 'bacpack.daily.co',
    // Add your Daily.co API key here
    API_KEY: '64f3f69918bcf5de9a3d6d8eba97b55f78e37ac722169061ca509bb433e17ca8',
    VIDEO_SETTINGS: {
      width: 1280,
      height: 720,
      frameRate: 24
    },
    AUDIO_SETTINGS: {
      echoCancellation: true,
      noiseSuppression: true
    },
    MOBILE_SETTINGS: {
      screenShareResolution: {
        width: 1280,
        height: 720,
        frameRate: 15
      },
      optimizeScreenShare: true
    }
  },
  UI: {
    STATES: {
      INITIALIZING: 'initializing',
      CONNECTED: 'connected',
      DISCONNECTED: 'disconnected',
      ERROR: 'error'
    },
    NOTIFICATIONS: {
      DURATION: 3000, // Duration in milliseconds for notifications
      POSITIONS: {
        TOP_RIGHT: 'top-right',
        TOP_LEFT: 'top-left',
        BOTTOM_RIGHT: 'bottom-right',
        BOTTOM_LEFT: 'bottom-left'
      }
    },
    CONTROLS: {
      AUDIO_ON_ICON: 'fa-microphone',
      AUDIO_OFF_ICON: 'fa-microphone-slash',
      VIDEO_ON_ICON: 'fa-video',
      VIDEO_OFF_ICON: 'fa-video-slash',
      SCREEN_SHARE_ICON: 'fa-desktop',
      HAND_RAISE_ICON: 'fa-hand',
      LEAVE_ICON: 'fa-phone-slash'
    },
    THEMES: {
      COLORS: {
        PRIMARY: '#2563eb',
        SECONDARY: '#334155',
        DANGER: '#dc2626',
        SUCCESS: '#065f46',
        WARNING: '#d97706',
        BACKGROUND: '#0f172a',
        SURFACE: '#1e293b',
        TEXT: '#ffffff'
      }
    },
    BREAKPOINTS: {
      MOBILE: 768,
      TABLET: 1024,
      DESKTOP: 1280
    }
  }
};

export default CONFIG;