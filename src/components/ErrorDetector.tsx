import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Replay as ReplayIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface Error {
  id: string;
  timestamp: number;
  type: 'audio' | 'video' | 'performance';
  description: string;
  severity: 'low' | 'medium' | 'high';
  isResolved: boolean;
}

interface ErrorDetectorProps {
  isActive: boolean;
  onErrorDetected: (error: Error) => void;
  onRetake: (errorId: string) => void;
  onClose: () => void;
}

const ErrorDetector: React.FC<ErrorDetectorProps> = ({
  isActive,
  onErrorDetected,
  onRetake,
  onClose,
}) => {
  const [errors, setErrors] = useState<Error[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedError, setSelectedError] = useState<Error | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const performanceMonitorRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    return () => {
      stopMonitoring();
    };
  }, [isActive]);

  const startMonitoring = () => {
    // Initialize audio context for noise detection
    audioContextRef.current = new AudioContext();

    // Start performance monitoring
    performanceMonitorRef.current = setInterval(monitorPerformance, 1000);

    // Start video quality monitoring
    if (videoRef.current) {
      videoRef.current.addEventListener('error', handleVideoError);
    }
  };

  const stopMonitoring = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (performanceMonitorRef.current) {
      clearInterval(performanceMonitorRef.current);
      performanceMonitorRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.removeEventListener('error', handleVideoError);
    }
  };

  const monitorPerformance = () => {
    // Check frame rate
    const frameRate = getFrameRate();
    if (frameRate < 24) {
      addError({
        type: 'performance',
        description: `Low frame rate detected: ${frameRate} FPS`,
        severity: 'medium',
      });
    }

    // Check audio levels
    checkAudioLevels();

    // Check video quality
    checkVideoQuality();
  };

  const getFrameRate = () => {
    // Simulate frame rate detection
    return Math.random() * 30;
  };

  const checkAudioLevels = async () => {
    if (!audioContextRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      if (average < 10) {
        addError({
          type: 'audio',
          description: 'Low audio levels detected',
          severity: 'low',
        });
      } else if (average > 240) {
        addError({
          type: 'audio',
          description: 'Audio clipping detected',
          severity: 'high',
        });
      }

      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error checking audio levels:', error);
    }
  };

  const checkVideoQuality = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth < 1280 || video.videoHeight < 720) {
      addError({
        type: 'video',
        description: 'Low video resolution detected',
        severity: 'medium',
      });
    }
  };

  const handleVideoError = (event: Event) => {
    const video = event.target as HTMLVideoElement;
    addError({
      type: 'video',
      description: `Video error: ${video.error?.message || 'Unknown error'}`,
      severity: 'high',
    });
  };

  const addError = (error: Omit<Error, 'id' | 'timestamp' | 'isResolved'>) => {
    const newError: Error = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...error,
      isResolved: false,
    };

    setErrors(prev => [...prev, newError]);
    onErrorDetected(newError);
    setSelectedError(newError);
    setShowErrorDialog(true);
  };

  const handleRetake = (errorId: string) => {
    onRetake(errorId);
    setErrors(prev =>
      prev.map(error =>
        error.id === errorId ? { ...error, isResolved: true } : error
      )
    );
    setShowErrorDialog(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Paper
      className="fixed top-4 right-4 p-4 bg-black bg-opacity-90 text-white"
      style={{ zIndex: 1000, maxWidth: 400 }}
    >
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6">Error Detection</Typography>
        <IconButton
          onClick={onClose}
          className="text-white"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </div>

      <List>
        {errors.map(error => (
          <ListItem
            key={error.id}
            className={`border-l-4 ${
              error.isResolved
                ? 'border-green-500'
                : error.severity === 'high'
                ? 'border-red-500'
                : error.severity === 'medium'
                ? 'border-yellow-500'
                : 'border-blue-500'
            }`}
          >
            <ListItemText
              primary={error.description}
              secondary={`${error.type} - ${formatTime(error.timestamp)}`}
            />
            <ListItemSecondaryAction>
              {!error.isResolved && (
                <Tooltip title="Retake">
                  <IconButton
                    edge="end"
                    onClick={() => handleRetake(error.id)}
                    className="text-white"
                  >
                    <ReplayIcon />
                  </IconButton>
                </Tooltip>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedError?.severity === 'high' ? (
            <ErrorIcon className="text-red-500 mr-2" />
          ) : (
            <CheckCircleIcon className="text-yellow-500 mr-2" />
          )}
          Error Detected
        </DialogTitle>
        <DialogContent>
          <Typography>
            {selectedError?.description}
          </Typography>
          <Typography variant="body2" color="textSecondary" className="mt-2">
            Would you like to retake this section?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowErrorDialog(false)}>Ignore</Button>
          <Button
            onClick={() => selectedError && handleRetake(selectedError.id)}
            variant="contained"
            color="primary"
          >
            Retake
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ErrorDetector; 