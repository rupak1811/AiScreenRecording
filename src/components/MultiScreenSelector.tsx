import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ScreenShare as ScreenShareIcon,
} from '@mui/icons-material';

interface Screen {
  id: string;
  name: string;
  thumbnail: string;
  isSelected: boolean;
}

interface MultiScreenSelectorProps {
  open: boolean;
  onClose: () => void;
  onScreensSelected: (screens: Screen[]) => void;
}

const MultiScreenSelector: React.FC<MultiScreenSelectorProps> = ({
  open,
  onClose,
  onScreensSelected,
}) => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadScreens();
    }
  }, [open]);

  const loadScreens = async () => {
    setIsLoading(true);
    try {
      // Get screen information
      const displayMedia = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      // Get all screens
      const screenInfo = await window.electron.getScreenInfo();
      
      // Create screen objects with thumbnails
      const screenObjects = await Promise.all(
        screenInfo.map(async (screen: any) => {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 320 },
              height: { ideal: 180 },
            },
          });

          const video = document.createElement('video');
          video.srcObject = stream;
          await video.play();

          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, 320, 180);

          // Stop the stream
          stream.getTracks().forEach(track => track.stop());

          return {
            id: screen.id,
            name: `Screen ${screen.id}`,
            thumbnail: canvas.toDataURL('image/jpeg'),
            isSelected: false,
          };
        })
      );

      setScreens(screenObjects);
    } catch (error) {
      console.error('Error loading screens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleScreenSelection = (screenId: string) => {
    setScreens(prev =>
      prev.map(screen =>
        screen.id === screenId
          ? { ...screen, isSelected: !screen.isSelected }
          : screen
      )
    );
  };

  const handleConfirm = () => {
    const selectedScreens = screens.filter(screen => screen.isSelected);
    onScreensSelected(selectedScreens);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Select Screens to Record</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Typography>Loading screens...</Typography>
          </div>
        ) : (
          <Grid container spacing={2} className="mt-4">
            {screens.map(screen => (
              <Grid item xs={12} sm={6} md={4} key={screen.id}>
                <Paper
                  className={`relative cursor-pointer transition-all ${
                    screen.isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleScreenSelection(screen.id)}
                >
                  <img
                    src={screen.thumbnail}
                    alt={screen.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {screen.isSelected ? (
                      <CheckIcon className="text-green-500" />
                    ) : (
                      <CloseIcon className="text-gray-500" />
                    )}
                  </div>
                  <Typography className="p-2 text-center">
                    {screen.name}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!screens.some(screen => screen.isSelected)}
        >
          Start Recording
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MultiScreenSelector; 