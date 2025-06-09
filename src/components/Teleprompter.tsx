import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Speed as SpeedIcon,
  TextFields as TextIcon,
} from '@mui/icons-material';

interface TeleprompterProps {
  isVisible: boolean;
  onClose: () => void;
}

const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'actually',
  'literally', 'sort of', 'kind of', 'right', 'so yeah'
];

const Teleprompter: React.FC<TeleprompterProps> = ({ isVisible, onClose }) => {
  const [script, setScript] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [currentWord, setCurrentWord] = useState('');
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    if (!isVisible) {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isVisible]);

  const handleScriptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScript = event.target.value;
    setScript(newScript);
    
    // Detect filler words
    const words = newScript.toLowerCase().split(/\s+/);
    const fillers = words.filter(word => FILLER_WORDS.includes(word));
    setDetectedFillers(fillers);
    setFillerWordCount(fillers.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      lastScrollTime.current = performance.now();
      animateScroll();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const animateScroll = () => {
    if (!containerRef.current || !isPlaying) return;

    const now = performance.now();
    const deltaTime = now - lastScrollTime.current;
    lastScrollTime.current = now;

    const scrollAmount = deltaTime * scrollSpeed * 0.1;
    containerRef.current.scrollTop += scrollAmount;

    // Update current word
    const words = script.split(/\s+/);
    const scrollPosition = containerRef.current.scrollTop;
    const wordIndex = Math.floor(scrollPosition / 30); // Approximate word height
    setCurrentWord(words[wordIndex] || '');

    animationRef.current = requestAnimationFrame(animateScroll);
  };

  const adjustSpeed = (delta: number) => {
    setScrollSpeed(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  if (!isVisible) return null;

  return (
    <Paper
      className="fixed bottom-0 left-0 right-0 p-4 bg-black bg-opacity-90 text-white"
      style={{ zIndex: 1000 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">Script Teleprompter</Typography>
          <div className="flex items-center space-x-2">
            <Typography variant="body2">
              Filler Words: {fillerWordCount}
            </Typography>
            <Tooltip title="Decrease Speed">
              <IconButton
                onClick={() => adjustSpeed(-0.1)}
                className="text-white"
              >
                <SpeedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPlaying ? "Pause" : "Play"}>
              <IconButton
                onClick={togglePlayPause}
                className="text-white"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Increase Speed">
              <IconButton
                onClick={() => adjustSpeed(0.1)}
                className="text-white"
              >
                <SpeedIcon style={{ transform: 'scaleX(-1)' }} />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={script}
              onChange={handleScriptChange}
              placeholder="Enter your script here..."
              variant="outlined"
              className="bg-white bg-opacity-10"
              InputProps={{
                className: 'text-white',
              }}
            />
          </div>

          <div
            ref={containerRef}
            className="h-32 overflow-hidden relative"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
            }}
          >
            <Typography
              variant="h4"
              className="text-center font-bold"
              style={{
                transform: 'scale(1.5)',
                transition: 'transform 0.3s ease',
              }}
            >
              {currentWord}
            </Typography>
          </div>
        </div>

        {detectedFillers.length > 0 && (
          <Box className="mt-4">
            <Typography variant="subtitle2" color="warning.main">
              Detected Filler Words:
            </Typography>
            <div className="flex flex-wrap gap-2 mt-2">
              {detectedFillers.map((filler, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  className="bg-yellow-500 bg-opacity-20 px-2 py-1 rounded"
                >
                  {filler}
                </Typography>
              ))}
            </div>
          </Box>
        )}
      </div>
    </Paper>
  );
};

export default Teleprompter; 