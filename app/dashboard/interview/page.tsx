'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Pause, Play } from 'lucide-react';

export default function InterviewPage() {
  const [interviewer, setInterviewer] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPermissions, setShowPermissions] = useState(true);
  const [stream, setStream] = useState(null);
  const [availableDevices, setAvailableDevices] = useState({ video: false, audio: false });
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [tooltips, setTooltips] = useState({ mic: '', camera: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const videoRef = useRef(null);

  // Fetch random interviewer
  useEffect(() => {
    fetch('https://randomuser.me/api/')
      .then(res => res.json())
      .then(data => {
        setInterviewer(data.results[0]);
      })
      .catch(err => console.error('Failed to fetch interviewer:', err));
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setTranscript(prev => prev + finalTranscript + interimTranscript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Check available devices on load
  useEffect(() => {
    checkAvailableDevices();
  }, []);

  const checkAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices({
        video: devices.some(device => device.kind === 'videoinput'),
        audio: devices.some(device => device.kind === 'audioinput')
      });
    } catch (err) {
      console.error('Error checking devices:', err);
    }
  };

  // Request permissions for available devices
  const requestPermissions = async () => {
    try {
      const constraints = {};
      if (availableDevices.video) constraints.video = true;
      if (availableDevices.audio) constraints.audio = true;

      if (Object.keys(constraints).length === 0) {
        setShowPermissions(false);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(mediaStream);
      setIsMicEnabled(availableDevices.audio);
      setIsCameraEnabled(availableDevices.video);
      setShowPermissions(false);

      if (videoRef.current && availableDevices.video) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  };

  // Continue without permissions
  const continueWithoutMedia = () => {
    setShowPermissions(false);
  };

  // Toggle microphone
  const toggleMic = async () => {
    try {
      if (stream) {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = !isMicEnabled;
        });
        setIsMicEnabled(!isMicEnabled);
      } else if (!isMicEnabled) {
        // Try to get mic access
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const combinedStream = new MediaStream([
          ...mediaStream.getAudioTracks(),
          ...(stream?.getVideoTracks() || [])
        ]);
        setStream(combinedStream);
        setIsMicEnabled(true);
      }
      setTooltips({ ...tooltips, mic: '' });
    } catch (err) {
      setTooltips({ ...tooltips, mic: 'Failed to access microphone' });
      setTimeout(() => setTooltips({ ...tooltips, mic: '' }), 3000);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (stream) {
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = !isCameraEnabled;
        });
        setIsCameraEnabled(!isCameraEnabled);
      } else if (!isCameraEnabled) {
        // Try to get camera access
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const combinedStream = new MediaStream([
          ...mediaStream.getVideoTracks(),
          ...(stream?.getAudioTracks() || [])
        ]);
        setStream(combinedStream);
        setIsCameraEnabled(true);
        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
        }
      }
      setTooltips({ ...tooltips, camera: '' });
    } catch (err) {
      setTooltips({ ...tooltips, camera: 'Failed to access camera' });
      setTimeout(() => setTooltips({ ...tooltips, camera: '' }), 3000);
    }
  };

  // Show end confirmation
  const showEndConfirmation = () => {
    setShowEndConfirm(true);
  };

  // Confirm end interview
  const confirmEndInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    window.history.back();
  };

  // Cancel end interview
  const cancelEndInterview = () => {
    setShowEndConfirm(false);
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Toggle recording
  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognition.start();
      setIsRecording(true);
    }
  };

  if (showPermissions) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Setup Your Interview</h2>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Video size={20} />
                <span>Camera</span>
              </div>
              <span className={`text-sm ${availableDevices.video ? 'text-green-600' : 'text-red-600'}`}>
                {availableDevices.video ? 'Available' : 'Not Available'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Mic size={20} />
                <span>Microphone</span>
              </div>
              <span className={`text-sm ${availableDevices.audio ? 'text-green-600' : 'text-red-600'}`}>
                {availableDevices.audio ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {(availableDevices.video || availableDevices.audio) && (
              <button
                onClick={requestPermissions}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Enable Available Devices
              </button>
            )}

            <button
              onClick={continueWithoutMedia}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Continue Without Camera/Mic
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            You can enable devices later during the interview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Main video area */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Interviewer video (left side) */}
        <div className="w-80 h-60 relative bg-gray-800 rounded-lg overflow-hidden">
          {interviewer ? (
            <div className="w-full h-full flex items-center justify-center relative">
              <img
                src={interviewer.picture.large}
                alt="AI Interviewer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {interviewer.name.first} {interviewer.name.last}
              </div>
              {isPaused && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-lg font-semibold">Paused</div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          )}
        </div>

        {/* User video (right side) */}
        <div className="w-80 h-60 relative bg-gray-800 rounded-lg overflow-hidden">
          {isCameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <VideoOff size={32} className="mx-auto mb-2" />
                <p className="text-sm">Camera Off</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            You
          </div>
          {isRecording && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              REC
            </div>
          )}
        </div>

        {/* Transcript area */}
        <div className="flex-1 bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Live Transcript</h3>
            <button
              onClick={toggleRecording}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isRecording
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
          <div className="bg-gray-900 rounded p-3 h-44 overflow-y-auto">
            <p className="text-gray-300 text-sm whitespace-pre-wrap">
              {transcript || (isRecording ? 'Listening...' : 'Click "Start Recording" to begin transcription')}
            </p>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center items-center gap-4">
          {/* Microphone toggle */}
          <div className="relative">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full transition-colors ${isMicEnabled
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            {tooltips.mic && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {tooltips.mic}
              </div>
            )}
          </div>

          {/* Camera toggle */}
          <div className="relative">
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full transition-colors ${isCameraEnabled
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            {tooltips.camera && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {tooltips.camera}
              </div>
            )}
          </div>

          {/* Pause/Resume */}
          <button
            onClick={togglePause}
            className={`p-3 rounded-full transition-colors ${isPaused
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            title={isPaused ? 'Resume interview' : 'Pause interview'}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>

          {/* End interview */}
          <button
            onClick={showEndConfirmation}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium transition-colors"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* End interview confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">End Interview?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to end this interview? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={cancelEndInterview}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndInterview}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}