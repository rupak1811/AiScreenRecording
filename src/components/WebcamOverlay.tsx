import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Slider,
  Box,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  BlurOn as BlurIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface WebcamOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onStreamReady: (stream: MediaStream) => void;
}

const WebcamOverlay: React.FC<WebcamOverlayProps> = ({
  isVisible,
  onClose,
  onStreamReady,
}) => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [blurAmount, setBlurAmount] = useState(10);
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isVisible) {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isVisible]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsWebcamActive(true);
        onStreamReady(stream);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const toggleBackgroundRemoval = () => {
    setIsBackgroundRemoved(!isBackgroundRemoved);
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isWebcamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (isBackgroundRemoved) {
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple background removal based on color
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is close to green (typical for green screen)
        const isGreen = g > r * 1.2 && g > b * 1.2;
        if (isGreen) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }

      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
    } else if (blurAmount > 0) {
      // Apply blur effect
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    }

    // Request next frame
    requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (isWebcamActive) {
      processFrame();
    }
  }, [isWebcamActive, blurAmount, isBackgroundRemoved]);

  if (!isVisible) return null;

  return (
    <Paper
      className="fixed bottom-4 right-4 p-4 bg-black bg-opacity-90 text-white"
      style={{ zIndex: 1000 }}
    >
      <div className="flex justify-between items-center mb-2">
        <Typography variant="subtitle1">Webcam Overlay</Typography>
        <IconButton
          onClick={onClose}
          className="text-white"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-64 h-48 object-cover rounded"
          style={{ display: isWebcamActive ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-64 h-48 rounded"
          style={{ display: isWebcamActive ? 'block' : 'none' }}
        />
        {!isWebcamActive && (
          <div className="w-64 h-48 bg-gray-800 rounded flex items-center justify-center">
            <Typography>Webcam Off</Typography>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-2 mt-2">
        <Tooltip title={isWebcamActive ? "Stop Webcam" : "Start Webcam"}>
          <IconButton
            onClick={isWebcamActive ? stopWebcam : startWebcam}
            className={`${isWebcamActive ? 'bg-red-500' : 'bg-gray-200'} hover:bg-gray-300`}
          >
            {isWebcamActive ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={isBackgroundRemoved ? "Disable Background Removal" : "Enable Background Removal"}>
          <IconButton
            onClick={toggleBackgroundRemoval}
            className={`${isBackgroundRemoved ? 'bg-green-500' : 'bg-gray-200'} hover:bg-gray-300`}
          >
            <BlurIcon />
          </IconButton>
        </Tooltip>
      </div>

      {!isBackgroundRemoved && (
        <Box className="mt-2">
          <Typography variant="caption">Blur Amount</Typography>
          <Slider
            value={blurAmount}
            onChange={(_, value) => setBlurAmount(value as number)}
            min={0}
            max={20}
            className="text-white"
          />
        </Box>
      )}
    </Paper>
  );
};

export default WebcamOverlay; 