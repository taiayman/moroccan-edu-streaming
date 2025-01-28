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
    this.candidatesQueue = [];
    this.isAnswerSet = false;
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

      // Send the offer to the server
      await fetch(`${endpoints.streaming.offer}/${this.roomId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(offer)
      });

      // Listen for remote answer
      this._listenForAnswer();

      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await this._sendIceCandidate(event.candidate);
        }
      };

      // Start listening for remote ICE candidates
      this._listenForCandidates();

      return {
        roomId: this.roomId,
        localStream: this.localStream,
        remoteStream: this.remoteStream
      };
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

      // Get and set remote offer
      const offerResponse = await fetch(`${endpoints.streaming.offer}/${roomId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const offerData = await offerResponse.json();
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData));

      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await fetch(`${endpoints.streaming.answer}/${roomId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(answer)
      });

      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await this._sendIceCandidate(event.candidate);
        }
      };

      // Start listening for remote ICE candidates
      this._listenForCandidates();

      return {
        localStream: this.localStream,
        remoteStream: this.remoteStream
      };
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  async _listenForAnswer() {
    try {
      const answerResponse = await fetch(`${endpoints.streaming.answer}/${this.roomId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (answerResponse.ok) {
        const answerData = await answerResponse.json();
        if (answerData && !this.isAnswerSet) {
          const answerDescription = new RTCSessionDescription(answerData);
          await this.peerConnection.setRemoteDescription(answerDescription);
          this.isAnswerSet = true;
          
          // Process any queued candidates after setting the answer
          while (this.candidatesQueue.length) {
            const candidate = this.candidatesQueue.shift();
            await this.peerConnection.addIceCandidate(candidate);
          }
        }
      }
    } catch (error) {
      console.error('Error listening for answer:', error);
    }
  }

  async _listenForCandidates() {
    try {
      const response = await fetch(`${endpoints.streaming.candidate}/${this.roomId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const candidates = await response.json();
        for (const candidateData of candidates) {
          const candidate = new RTCIceCandidate(candidateData);
          if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
            await this.peerConnection.addIceCandidate(candidate);
          } else {
            this.candidatesQueue.push(candidate);
          }
        }
      }
    } catch (error) {
      console.error('Error listening for candidates:', error);
    }
  }

  async _sendIceCandidate(candidate) {
    try {
      await fetch(`${endpoints.streaming.candidate}/${this.roomId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(candidate.toJSON())
      });
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
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
      
      if (this.peerConnection) {
        this.peerConnection.close();
      }

      this.peerConnection = null;
      this.localStream = null;
      this.remoteStream = null;
      this.roomId = null;
      this.candidatesQueue = [];
      this.isAnswerSet = false;
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
