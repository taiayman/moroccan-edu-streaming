import { endpoints, getAuthHeaders } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.roomId = null;
  }

  async createRoom(userId, courseId, title) {
    try {
      const response = await fetch(endpoints.streaming.create, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, courseId, title })
      });
      
      if (!response.ok) throw new Error('Failed to create room');
      
      const data = await response.json();
      this.roomId = data.roomId;

      // Initialize the connection
      this.peerConnection = new RTCPeerConnection(servers);
      
      // Get local stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create remote stream
      this.remoteStream = new MediaStream();

      // Add remote tracks to remote stream
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream.addTrack(track);
        });
      };

      // Create and set the offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Listen for remote answer
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch(`${endpoints.streaming.offer}/${this.roomId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(event.candidate.toJSON())
          });
        }
      };

      return data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async joinRoom(roomId) {
    try {
      const response = await fetch(`${endpoints.streaming.join}/${roomId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to join room');
      
      const data = await response.json();
      this.roomId = roomId;

      // Initialize the connection
      this.peerConnection = new RTCPeerConnection(servers);

      // Get local stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create remote stream
      this.remoteStream = new MediaStream();

      // Add remote tracks to remote stream
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream.addTrack(track);
        });
      };

      // Create answer
      const offer = await fetch(`${endpoints.streaming.offer}/${roomId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const offerData = await offer.json();
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await fetch(`${endpoints.streaming.answer}/${roomId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(answer)
      });

      // Listen for remote ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch(`${endpoints.streaming.candidate}/${roomId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(event.candidate.toJSON())
          });
        }
      };

      return data;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  async endCall() {
    try {
      if (this.roomId) {
        await fetch(`${endpoints.streaming.end}/${this.roomId}`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
      }
      
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      this.peerConnection = null;
      this.localStream = null;
      this.remoteStream = null;
      this.roomId = null;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }
}

export default new WebRTCService();
