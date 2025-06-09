import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Button,
  Paper,
  Typography,
  Slider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Add as AddIcon,
  BlurOn as BlurIcon,
  Highlight as HighlightIcon,
  TextFields as TextIcon,
  Summarize as SummarizeIcon,
  Save as SaveIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';

interface Chapter {
  id: string;
  title: string;
  timestamp: number;
}

interface Effect {
  id: string;
  type: 'blur' | 'highlight' | 'text';
  startTime: number;
  endTime: number;
  params: any;
}

interface Summary {
  chapters: string[];
  keyPoints: string[];
  duration: number;
  totalChapters: number;
  totalEffects: number;
}

interface ExportSettings {
  quality: 'high' | 'medium' | 'low';
  format: 'mp4' | 'webm';
  resolution: '1080p' | '720p' | '480p';
  includeAudio: boolean;
  includeChapters: boolean;
  includeEffects: boolean;
}

interface EditorLocationState {
  videoBlob: Blob;
  recordingDuration: number;
  mimeType?: string;
}

const Editor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    quality: 'high',
    format: 'mp4',
    resolution: '1080p',
    includeAudio: true,
    includeChapters: true,
    includeEffects: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [autoChapters, setAutoChapters] = useState<Chapter[]>([]);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.videoBlob) {
      console.log('Received videoBlob (inside useEffect, consolidated):', location.state.videoBlob);
      console.log('Video Blob size (inside useEffect, consolidated):', location.state.videoBlob.size);
      console.log('Video Blob type (inside useEffect, consolidated):', location.state.videoBlob.type);

      const objectUrl = URL.createObjectURL(location.state.videoBlob);
      console.log('Created ObjectURL (inside useEffect, consolidated):', objectUrl);

      if (videoRef.current) {
        videoRef.current.src = objectUrl;
        videoRef.current.preload = 'metadata';
        videoRef.current.load(); // Force reload

        const handleVideoLoad = () => {
          console.log('Video element state on loadedmetadata:', {
            readyState: videoRef.current?.readyState,
            networkState: videoRef.current?.networkState,
            duration: videoRef.current?.duration,
            currentTime: videoRef.current?.currentTime,
            error: videoRef.current?.error,
            src: videoRef.current?.src
          });

          if (videoRef.current?.duration && isFinite(videoRef.current.duration)) {
            setDuration(videoRef.current.duration);
            console.log('Set duration from video element:', videoRef.current.duration);
          } else if (location.state?.recordingDuration) {
            const stateDuration = Number(location.state.recordingDuration);
            if (isFinite(stateDuration) && stateDuration > 0) {
              setDuration(stateDuration);
              console.log('Set duration from location state:', stateDuration);
            } else {
              console.warn('Invalid duration in location state:', location.state.recordingDuration);
            }
          } else {
            console.warn('No valid duration available from video element or location state');
          }
        };

        const handleVideoError = (e: Event) => {
          const video = e.target as HTMLVideoElement;
          console.error('Video element error:', {
            error: video.error,
            readyState: video.readyState,
            networkState: video.networkState,
            src: video.src
          });
          setVideoError('Error loading video. Please try recording again.');
        };

        videoRef.current.addEventListener('loadedmetadata', handleVideoLoad);
        videoRef.current.addEventListener('error', handleVideoError);

        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleVideoLoad);
            videoRef.current.removeEventListener('error', handleVideoError);
          }
          URL.revokeObjectURL(objectUrl);
        };
      }
    }
  }, [location.state]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Chapter ${chapters.length + 1}`,
      timestamp: currentTime,
    };
    setChapters([...chapters, newChapter]);
  };

  const addEffect = (type: 'blur' | 'highlight' | 'text') => {
    const newEffect: Effect = {
      id: Date.now().toString(),
      type,
      startTime: currentTime,
      endTime: currentTime + 5,
      params: {},
    };
    setEffects([...effects, newEffect]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      // Simulate API call to generate summary
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSummary: Summary = {
        chapters: chapters.map(chapter => `${chapter.title} (${formatTime(chapter.timestamp)})`),
        keyPoints: [
          `Total Duration: ${formatTime(duration)}`,
          `Number of Chapters: ${chapters.length}`,
          `Number of Effects: ${effects.length}`,
          `Most used effect: ${getMostUsedEffect()}`,
        ],
        duration,
        totalChapters: chapters.length,
        totalEffects: effects.length,
      };
      
      setSummary(newSummary);
      setShowSummaryDialog(true);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const getMostUsedEffect = () => {
    const effectCounts: Record<string, number> = {};
    effects.forEach(effect => {
      effectCounts[effect.type] = (effectCounts[effect.type] || 0) + 1;
    });

    if (Object.keys(effectCounts).length === 0) return 'None';

    const mostUsed = Object.keys(effectCounts).reduce((a, b) => 
      effectCounts[a] > effectCounts[b] ? a : b
    );
    return mostUsed;
  };

  // Auto-generate chapters based on video content
  const generateAutoChapters = async () => {
    setIsGeneratingChapters(true);
    try {
      // Simulate AI analysis of video content
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log the duration state before validation
      console.log('Duration state in generateAutoChapters:', duration);

      // Generate chapters based on video duration
      const rawDuration = videoRef.current?.duration;
      const calculatedDuration = typeof rawDuration === 'number' && isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;

      if (calculatedDuration === 0) {
        console.warn('Video duration is 0 or invalid, cannot generate chapters.');
        setVideoError('Cannot generate chapters: video duration is not available or zero. Please ensure the video plays correctly.');
        setIsGeneratingChapters(false); // Ensure loading state is reset
        return; // Exit if duration is 0
      }

      const chapterCount = Math.ceil(calculatedDuration / 300); // One chapter every 5 minutes
      
      const newChapters = Array.from({ length: chapterCount }, (_, i) => ({
        id: `auto-${i}`,
        title: `Chapter ${i + 1}`,
        timestamp: i * 300,
      }));
      
      setAutoChapters(newChapters);
      setChapters(prev => [...prev, ...newChapters]);
    } catch (error) {
      console.error('Error generating chapters:', error);
      setVideoError('Failed to generate chapters due to an internal error.');
    } finally {
      setIsGeneratingChapters(false);
    }
  };

  // Add click highlight effect
  const addClickHighlight = () => {
    const newEffect: Effect = {
      id: Date.now().toString(),
      type: 'highlight',
      startTime: currentTime,
      endTime: currentTime + 2,
      params: {
        color: '#ffeb3b',
        radius: 20,
        opacity: 0.7,
      },
    };
    setEffects(prev => [...prev, newEffect]);
  };

  // Add background blur effect
  const addBackgroundBlur = () => {
    const newEffect: Effect = {
      id: Date.now().toString(),
      type: 'blur',
      startTime: currentTime,
      endTime: currentTime + 5,
      params: {
        intensity: 10,
        focusPoint: { x: 0.5, y: 0.5 },
      },
    };
    setEffects(prev => [...prev, newEffect]);
  };

  // Export video with optimized settings
  const exportVideo = async () => {
    setIsExporting(true);
    try {
      // Simulate video export process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create a download link
      const link = document.createElement('a');
      link.href = videoRef.current?.src || '';
      link.download = `recording-${new Date().toISOString()}.${exportSettings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting video:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadVideo = () => {
    if (location.state?.videoBlob instanceof Blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(location.state.videoBlob);
      a.download = `recorded-video-${Date.now()}.${location.state.mimeType?.split('/')[1] || 'webm'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke the temporary URL immediately after download
      URL.revokeObjectURL(a.href);
    } else {
      console.warn('No video Blob available for download.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <Paper className="max-w-6xl mx-auto p-3 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Typography variant="h4" className="font-bold">
            Video Editor
          </Typography>
          <div className="flex space-x-2">
            <Tooltip title="Generate Auto Chapters">
              <span>
                <IconButton
                  onClick={generateAutoChapters}
                  disabled={isGeneratingChapters || duration === 0}
                  className="bg-primary-100 hover:bg-primary-200"
                >
                  {isGeneratingChapters ? (
                    <CircularProgress size={24} />
                  ) : (
                    <AutoAwesomeIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export Video">
              <span>
                <IconButton
                  onClick={() => setShowExportDialog(true)}
                  className="bg-primary-100 hover:bg-primary-200"
                >
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 sm:mb-6">
              {videoError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <Typography color="error" className="text-center">
                    {videoError}
                  </Typography>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                />
              )}
            </div>

            {/* Timeline */}
            <div className="bg-gray-100 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-4 mb-4">
                <IconButton onClick={handlePlayPause}>
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
                <Typography variant="body2" className="font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </div>

              <Slider
                value={currentTime}
                max={duration}
                onChange={(_, value) => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = value as number;
                    setCurrentTime(value as number);
                  }
                }}
                className="w-full"
              />

              {/* Effects Timeline */}
              <div className="mt-4 h-20 bg-gray-200 rounded-lg relative">
                {effects.map((effect) => (
                  <motion.div
                    key={effect.id}
                    className="absolute h-full bg-primary-500 opacity-50"
                    style={{
                      left: `${(effect.startTime / duration) * 100}%`,
                      width: `${((effect.endTime - effect.startTime) / duration) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Chapters */}
            <Paper className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">Chapters</Typography>
                <Tooltip title="Add Chapter">
                  <IconButton onClick={addChapter}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </div>
              <List>
                {chapters.map((chapter) => (
                  <ListItem key={chapter.id}>
                    <ListItemText
                      primary={chapter.title}
                      secondary={formatTime(chapter.timestamp)}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Effects */}
            <Paper className="p-3 sm:p-4">
              <Typography variant="h6" className="mb-4">
                Effects
              </Typography>
              <div className="grid grid-cols-3 gap-2">
                <Tooltip title="Add Blur">
                  <IconButton
                    onClick={() => addEffect('blur')}
                    className="bg-gray-100 hover:bg-gray-200"
                  >
                    <BlurIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add Highlight">
                  <IconButton
                    onClick={() => addEffect('highlight')}
                    className="bg-gray-100 hover:bg-gray-200"
                  >
                    <HighlightIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add Text">
                  <IconButton
                    onClick={() => addEffect('text')}
                    className="bg-gray-100 hover:bg-gray-200"
                  >
                    <TextIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </Paper>

            {/* Export Options */}
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">
                Export Options
              </Typography>
              <div className="flex flex-col space-y-4">
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={exportVideo}
                  disabled={isExporting || videoError !== null}
                >
                  {isExporting ? <CircularProgress size={24} color="inherit" /> : 'Export Video'}
                </Button>
                <Tooltip title="Generate AI Summary">
                  <span>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={() => generateSummary()}
                      disabled={isGeneratingSummary || videoError !== null}
                    >
                      {isGeneratingSummary ? <CircularProgress size={24} color="inherit" /> : 'Generate AI Summary'}
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Download Video">
                  <span>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      onClick={handleDownloadVideo}
                      disabled={videoError !== null || !location.state?.videoBlob}
                    >
                      Download Video
                    </Button>
                  </span>
                </Tooltip>
              </div>
            </Paper>
          </div>
        </div>

        {/* Effect controls */}
        <div className="flex justify-center space-x-4 mb-4">
          <Tooltip title="Add Click Highlight">
            <IconButton
              onClick={addClickHighlight}
              className="bg-blue-100 hover:bg-blue-200"
            >
              <HighlightIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Background Blur">
            <IconButton
              onClick={addBackgroundBlur}
              className="bg-blue-100 hover:bg-blue-200"
            >
              <BlurIcon />
            </IconButton>
          </Tooltip>
        </div>

        {/* Export Dialog */}
        <Dialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Export Settings</DialogTitle>
          <DialogContent>
            <div className="space-y-4 mt-4">
              <FormControl fullWidth>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={exportSettings.quality}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    quality: e.target.value as ExportSettings['quality']
                  }))}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportSettings.format}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    format: e.target.value as ExportSettings['format']
                  }))}
                >
                  <MenuItem value="mp4">MP4</MenuItem>
                  <MenuItem value="webm">WebM</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Resolution</InputLabel>
                <Select
                  value={exportSettings.resolution}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    resolution: e.target.value as ExportSettings['resolution']
                  }))}
                >
                  <MenuItem value="1080p">1080p</MenuItem>
                  <MenuItem value="720p">720p</MenuItem>
                  <MenuItem value="480p">480p</MenuItem>
                </Select>
              </FormControl>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportSettings.includeAudio}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    includeAudio: e.target.checked
                  }))}
                />
                <Typography>Include Audio</Typography>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportSettings.includeChapters}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    includeChapters: e.target.checked
                  }))}
                />
                <Typography>Include Chapters</Typography>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportSettings.includeEffects}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    includeEffects: e.target.checked
                  }))}
                />
                <Typography>Include Effects</Typography>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button
              onClick={exportVideo}
              disabled={isExporting}
              variant="contained"
              color="primary"
            >
              {isExporting ? <CircularProgress size={24} /> : 'Export'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Summary Dialog */}
        <Dialog
          open={showSummaryDialog}
          onClose={() => setShowSummaryDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Video Summary</DialogTitle>
          <DialogContent>
            {summary && (
              <div className="space-y-4">
                <div>
                  <Typography variant="h6" className="mb-2">Chapters</Typography>
                  <List>
                    {summary.chapters.map((chapter, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={chapter} />
                      </ListItem>
                    ))}
                  </List>
                </div>
                <div>
                  <Typography variant="h6" className="mb-2">Key Points</Typography>
                  <List>
                    {summary.keyPoints.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={point} />
                      </ListItem>
                    ))}
                  </List>
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSummaryDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default Editor; 