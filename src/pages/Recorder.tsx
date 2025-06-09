import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Paper,
  Typography,
  Tooltip,
  Box,
} from '@mui/material';
import {
  FiberManualRecord as RecordIcon,
  Stop as StopIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  AutoAwesome as AutoAwesomeIcon,
  TextFields as TextIcon,
  ScreenShare as ScreenShareIcon,
  Videocam as VideocamIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Teleprompter from '../components/Teleprompter';
import MultiScreenSelector from '../components/MultiScreenSelector';
import WebcamOverlay from '../components/WebcamOverlay';
import ErrorDetector from '../components/ErrorDetector';
import TeamCollaboration from '../components/TeamCollaboration';

declare global {
  interface MediaRecorder {
    canRecordMimeType?(mimeType: string): boolean;
  }
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isMuted: boolean;
  zoomLevel: number;
  duration: number;
}

interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface ClickEvent {
  x: number;
  y: number;
  timestamp: number;
}

interface RecordingError {
  id: string;
  timestamp: number;
  type: 'audio' | 'video' | 'performance';
  description: string;
  severity: 'low' | 'medium' | 'high';
  isResolved: boolean;
}

interface Screen {
  id: string;
  name: string;
  thumbnail: string;
  isSelected: boolean;
}

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const [clickEvents, setClickEvents] = useState<ClickEvent[]>([]);
  const [isVoiceCoachingEnabled, setIsVoiceCoachingEnabled] = useState(false);
  const [isAutoZoomEnabled, setIsAutoZoomEnabled] = useState(true);
  const [isCursorSmoothingEnabled, setIsCursorSmoothingEnabled] = useState(true);
  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastCursorPosition = useRef<CursorPosition | null>(null);
  const animationFrameRef = useRef<number>();
  const [isTeleprompterVisible, setIsTeleprompterVisible] = useState(false);
  const [isMultiScreenSelectorOpen, setIsMultiScreenSelectorOpen] = useState(false);
  const [selectedScreens, setSelectedScreens] = useState<Screen[]>([]);
  const [isWebcamVisible, setIsWebcamVisible] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isErrorDetectionEnabled, setIsErrorDetectionEnabled] = useState(false);
  const [currentError, setCurrentError] = useState<RecordingError | null>(null);
  const [isTeamCollaborationVisible, setIsTeamCollaborationVisible] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleScreensSelected = (screens: Screen[]) => {
    setSelectedScreens(screens);
    startRecording(screens);
  };

  const handleWebcamStreamReady = (stream: MediaStream) => {
    setWebcamStream(stream);
  };

  const startRecording = async (screens?: Screen[]) => {
    try {
      recordedChunksRef.current = [];
      let displayStream: MediaStream;

      // Request screen capture with explicit permissions
      if (screens && screens.length > 0) {
        // Multi-screen recording
        console.log('Starting multi-screen recording...');
        const streams = await Promise.all(
          screens.map(screen =>
            navigator.mediaDevices.getDisplayMedia({
              video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
              },
              audio: false
            })
          )
        );

        // Combine streams
        const videoTracks = streams.flatMap(stream => stream.getVideoTracks());
        displayStream = new MediaStream(videoTracks);
      } else {
        // Single screen recording
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
      }

      // Request audio capture with explicit permissions
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 2
        }
      });

      // Combine streams
      const streamsToCombine = [
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ];

      // Add webcam stream if available
      if (webcamStream) {
        streamsToCombine.push(...webcamStream.getVideoTracks());
      }

      const combinedStream = new MediaStream(streamsToCombine);

      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
        try {
          await videoRef.current.play();
        } catch (error) {
          console.error('Error playing video preview:', error);
        }
      }

      // Create MediaRecorder with supported MIME type
      let mimeType = 'video/webm'; // Default fallback

      console.log('Checking codec support:');

      const preferredCodecs = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm', // Generic WebM
        'video/mp4;codecs=avc3.42001E,mp4a.40.2'
      ];

      let selectedMimeType = '';

      for (const codec of preferredCodecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          selectedMimeType = codec;
          console.log(`  ${codec}: Supported and selected`);
          break; // Found the best supported, break loop
        } else {
          console.log(`  ${codec}: Not Supported`);
        }
      }

      if (selectedMimeType) {
        mimeType = selectedMimeType;
      } else {
        console.warn('No preferred codecs fully supported. Falling back to initial default: ' + mimeType);
      }

      console.log('Final selected mimeType:', mimeType);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps
        audioBitsPerSecond: 128000 // 128 kbps
      });

      // Handle data available
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log(`Data available: chunk size = ${event.data.size}, type = ${event.data.type}`);
        }
      };

      // Handle recording stop
      recorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsRecording(false);
        setIsPaused(false);

        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        console.log('Created video blob:', {
          size: videoBlob.size,
          type: videoBlob.type,
          chunks: recordedChunksRef.current.length,
          isFiniteSize: isFinite(videoBlob.size)
        });

        const videoElement = document.createElement('video');
        const objectUrl = URL.createObjectURL(videoBlob);

        videoElement.preload = 'metadata';
        videoElement.src = objectUrl;

        // Create a promise that resolves when we have a valid duration
        const getDuration = new Promise<number>((resolve, reject) => {
          let hasLoadedMetadata = false;
          let hasLoadedData = false;

          const checkDuration = () => {
            if (hasLoadedMetadata && hasLoadedData) {
              const duration = videoElement.duration;
              console.log('Video element state (Recorder onstop):', {
                readyState: videoElement.readyState,
                networkState: videoElement.networkState,
                duration: duration,
                currentTime: videoElement.currentTime,
                error: videoElement.error ? videoElement.error.message : 'None',
                errorName: videoElement.error ? videoElement.error.message : 'None',
                src: videoElement.src
              });

              if (isFinite(duration) && duration > 0) {
                resolve(duration);
              } else {
                reject(new Error('Invalid duration'));
              }
            }
          };

          videoElement.onloadedmetadata = () => {
            console.log('Video metadata loaded (Recorder onstop):', videoElement.readyState);
            hasLoadedMetadata = true;
            checkDuration();
          };

          videoElement.onloadeddata = () => {
            console.log('Video data loaded (Recorder onstop):', videoElement.readyState);
            hasLoadedData = true;
            checkDuration();
          };

          videoElement.onerror = (e) => {
            // Ensure e is an Event object before accessing target
            if (e instanceof Event) {
              const targetVideo = e.target as HTMLVideoElement;
              console.error('Error loading video (Recorder onstop):', {
                error: targetVideo.error,
                readyState: targetVideo.readyState,
                networkState: targetVideo.networkState,
                src: targetVideo.src
              });
            } else {
              console.error('Error loading video (Recorder onstop): Received non-Event object', e);
            }
            reject(new Error('Failed to load video'));
          };

          // Set a timeout in case the events don't fire
          setTimeout(() => {
            if (!hasLoadedMetadata || !hasLoadedData) {
              console.warn('Timeout waiting for video to load metadata/data (Recorder onstop).');
              reject(new Error('Timeout waiting for video to load'));
            }
          }, 5000);
        });

        try {
          const duration = await getDuration;
          console.log('Successfully calculated duration (Recorder onstop):', duration);
          URL.revokeObjectURL(objectUrl);

          navigate('/editor', {
            state: {
              videoBlob: videoBlob,
              recordingDuration: duration,
            },
          });
        } catch (error) {
          console.error('Error calculating duration:', error);
          URL.revokeObjectURL(objectUrl);
          
          // Try to get duration from the timer as fallback
          const fallbackDuration = recordingTime;
          console.log('Using fallback duration from timer:', fallbackDuration);
          
          navigate('/editor', {
            state: {
              videoBlob: videoBlob,
              recordingDuration: fallbackDuration,
            },
          });
        }

        setRecordedChunks([]);
        recordedChunksRef.current = [];
        setRecordingTime(0);
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setStream(combinedStream);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Handle stream end
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Please grant permission to access your screen and microphone to start recording.');
        } else {
          alert(`Failed to start recording: ${error.message}`);
        }
      } else {
        alert('Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder) {
      mediaRecorder.stop(); // This will trigger the onstop event handler above

      // Clean up streams immediately to avoid lingering issues
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const togglePause = () => {
    if (!mediaRecorder) return;

    if (isPaused) {
      mediaRecorder.resume();
      setIsPaused(false);
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorder.pause();
      setIsPaused(true);
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Add cursor tracking
  useEffect(() => {
    if (!isRecording || !isCursorSmoothingEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const position: CursorPosition = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      };
      setCursorPositions(prev => [...prev, position]);
      lastCursorPosition.current = position;
    };

    const handleClick = (e: MouseEvent) => {
      const click: ClickEvent = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      };
      setClickEvents(prev => [...prev, click]);
      
      if (isAutoZoomEnabled) {
        // Zoom to click area
        const zoomTarget = {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        };
        handleZoomToPoint(zoomTarget);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [isRecording, isCursorSmoothingEnabled, isAutoZoomEnabled]);

  // Smooth cursor animation
  useEffect(() => {
    if (!isRecording || !isCursorSmoothingEnabled || !cursorRef.current) return;

    const animateCursor = () => {
      if (!cursorRef.current || !lastCursorPosition.current) return;

      const cursor = cursorRef.current;
      const targetX = lastCursorPosition.current.x;
      const targetY = lastCursorPosition.current.y;

      // Smooth interpolation
      const currentX = parseFloat(cursor.style.left) || targetX;
      const currentY = parseFloat(cursor.style.top) || targetY;

      const newX = currentX + (targetX - currentX) * 0.3;
      const newY = currentY + (targetY - currentY) * 0.3;

      cursor.style.left = `${newX}px`;
      cursor.style.top = `${newY}px`;

      animationFrameRef.current = requestAnimationFrame(animateCursor);
    };

    animationFrameRef.current = requestAnimationFrame(animateCursor);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isCursorSmoothingEnabled]);

  // Voice coaching
  useEffect(() => {
    if (!isRecording || !isVoiceCoachingEnabled) return;

    const speechSynthesis = window.speechSynthesis;
    let lastCoachingTime = 0;
    const COACHING_INTERVAL = 30000; // 30 seconds

    const provideVoiceCoaching = () => {
      const now = Date.now();
      if (now - lastCoachingTime < COACHING_INTERVAL) return;

      const coachingTips = [
        "Remember to speak clearly and at a good pace",
        "Try to maintain a consistent volume",
        "Take a moment to breathe if needed",
        "Consider pausing between important points",
      ];

      const randomTip = coachingTips[Math.floor(Math.random() * coachingTips.length)];
      const utterance = new SpeechSynthesisUtterance(randomTip);
      speechSynthesis.speak(utterance);
      lastCoachingTime = now;
    };

    const coachingInterval = setInterval(provideVoiceCoaching, COACHING_INTERVAL);

    return () => {
      clearInterval(coachingInterval);
      speechSynthesis.cancel();
    };
  }, [isRecording, isVoiceCoachingEnabled]);

  const handleZoomToPoint = (point: { x: number; y: number }) => {
    setZoomLevel(1.5); // Zoom in
    // Reset zoom after 2 seconds
    setTimeout(() => {
      setZoomLevel(1);
    }, 2000);
  };

  const handleErrorDetected = (error: RecordingError) => {
    setCurrentError(error);
    // Pause recording if error is high severity
    if (error.severity === 'high' && isRecording) {
      togglePause();
    }
  };

  const handleRetake = (errorId: string) => {
    // Implement retake logic here
    // For example, you could:
    // 1. Stop recording
    // 2. Delete the last segment
    // 3. Start recording again
    console.log('Retaking section for error:', errorId);
  };

  const handleShare = async (emails: string[]) => {
    try {
      // Here you would typically make an API call to share the recording
      console.log('Sharing with:', emails);
      // For now, we'll just show a success message
      setNotification({
        message: 'Invitation sent successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      setNotification({
        message: 'Failed to send invitation',
        type: 'error',
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <Paper className="max-w-6xl mx-auto p-3 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Typography variant="h4" className="font-bold">
            Screen Recorder
          </Typography>
          <div className="flex items-center space-x-4">
            <Typography variant="body1" className="font-mono">
              {formatTime(recordingTime)}
            </Typography>
            <Tooltip title="Settings">
              <IconButton
                onClick={() => navigate('/settings')}
                className="bg-gray-200 hover:bg-gray-300"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Add Recording Button */}
        <div className="flex justify-center mb-4">
          <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'}>
            <IconButton
              onClick={() => isRecording ? stopRecording() : startRecording()}
              className={`${isRecording ? 'bg-red-500' : 'bg-green-500'} hover:bg-gray-300 text-white p-4`}
              size="large"
            >
              {isRecording ? <StopIcon /> : <RecordIcon />}
            </IconButton>
          </Tooltip>
        </div>

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 sm:mb-6">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            autoPlay
            muted={isRecording}
            playsInline
            controls={!isRecording}
            style={{ transform: `scale(${zoomLevel})` }}
          />
          
          {/* Custom cursor */}
          {isRecording && isCursorSmoothingEnabled && (
            <div
              ref={cursorRef}
              className="absolute w-6 h-6 pointer-events-none"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                border: '2px solid white',
                transform: 'translate(-50%, -50%)',
                transition: 'transform 0.1s ease-out',
              }}
            />
          )}

          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-4 flex items-center space-x-2"
              >
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <Typography variant="body2" className="text-white">
                  Recording
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
            <Tooltip title="Webcam Overlay">
              <IconButton
                onClick={() => setIsWebcamVisible(!isWebcamVisible)}
                className={`${isWebcamVisible ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-gray-300`}
              >
                <VideocamIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Multi-Screen Recording">
              <IconButton
                onClick={() => setIsMultiScreenSelectorOpen(true)}
                className="bg-gray-200 hover:bg-gray-300"
              >
                <ScreenShareIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isTeleprompterVisible ? "Hide Teleprompter" : "Show Teleprompter"}>
              <IconButton
                onClick={() => setIsTeleprompterVisible(!isTeleprompterVisible)}
                className={`${isTeleprompterVisible ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-gray-300`}
              >
                <TextIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'}>
              <IconButton
                onClick={() => isRecording ? stopRecording() : startRecording()}
                className={`${isRecording ? 'bg-red-500' : 'bg-green-500'} hover:bg-gray-300`}
              >
                {isRecording ? <StopIcon /> : <RecordIcon />}
              </IconButton>
            </Tooltip>

            {isRecording && (
              <>
                <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
                  <IconButton
                    onClick={togglePause}
                    className="bg-gray-200 hover:bg-gray-300"
                  >
                    {isPaused ? <PlayIcon /> : <PauseIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Zoom In">
                  <IconButton
                    onClick={handleZoomIn}
                    className="bg-gray-200 hover:bg-gray-300"
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Zoom Out">
                  <IconButton
                    onClick={handleZoomOut}
                    className="bg-gray-200 hover:bg-gray-300"
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Feature toggles */}
        <div className="flex justify-center space-x-4 mb-4">
          <Tooltip title={isAutoZoomEnabled ? "Disable Auto Zoom" : "Enable Auto Zoom"}>
            <IconButton
              onClick={() => setIsAutoZoomEnabled(!isAutoZoomEnabled)}
              className={`${isAutoZoomEnabled ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-gray-300`}
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isCursorSmoothingEnabled ? "Disable Cursor Smoothing" : "Enable Cursor Smoothing"}>
            <IconButton
              onClick={() => setIsCursorSmoothingEnabled(!isCursorSmoothingEnabled)}
              className={`${isCursorSmoothingEnabled ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-gray-300`}
            >
              <AutoAwesomeIcon />
            </IconButton>
          </Tooltip>
        </div>

        <div className="flex justify-center space-x-4 mb-4">
          <Tooltip title={isVoiceCoachingEnabled ? "Disable Voice Coaching" : "Enable Voice Coaching"}>
            <IconButton
              onClick={() => setIsVoiceCoachingEnabled(!isVoiceCoachingEnabled)}
              className={`${isVoiceCoachingEnabled ? 'bg-green-500' : 'bg-gray-200'} hover:bg-gray-300`}
            >
              <AutoAwesomeIcon />
            </IconButton>
          </Tooltip>
        </div>

        {/* MultiScreen Selector */}
        <MultiScreenSelector
          open={isMultiScreenSelectorOpen}
          onClose={() => setIsMultiScreenSelectorOpen(false)}
          onScreensSelected={handleScreensSelected}
        />

        {/* Teleprompter */}
        <Teleprompter
          isVisible={isTeleprompterVisible}
          onClose={() => setIsTeleprompterVisible(false)}
        />

        {/* Webcam Overlay */}
        <WebcamOverlay
          isVisible={isWebcamVisible}
          onClose={() => setIsWebcamVisible(false)}
          onStreamReady={handleWebcamStreamReady}
        />
      </Paper>

      {/* Team Collaboration Panel */}
      <TeamCollaboration
        isVisible={isTeamCollaborationVisible}
        onClose={() => setIsTeamCollaborationVisible(false)}
        onShare={handleShare}
      />

      {/* Add Team Collaboration Button to Controls */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-800 bg-opacity-90 p-2 rounded-full">
        <Tooltip title="Team Collaboration">
          <IconButton
            onClick={() => setIsTeamCollaborationVisible(!isTeamCollaborationVisible)}
            className={`text-white ${
              isTeamCollaborationVisible ? 'bg-blue-500' : 'hover:bg-gray-700'
            }`}
          >
            <PersonIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

export default Recorder;