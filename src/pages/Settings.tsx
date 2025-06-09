import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Divider,
  Box,
} from '@mui/material';

interface SettingsConfig {
  autoZoom: boolean;
  cursorHighlight: boolean;
  noiseReduction: boolean;
  voiceCoaching: boolean;
  quality: 'high' | 'medium' | 'low';
  frameRate: number;
  audioBitrate: number;
  videoBitrate: number;
  outputFormat: 'webm' | 'mp4';
  storagePath: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<SettingsConfig>({
    autoZoom: true,
    cursorHighlight: true,
    noiseReduction: true,
    voiceCoaching: true,
    quality: 'high',
    frameRate: 30,
    audioBitrate: 128,
    videoBitrate: 2500,
    outputFormat: 'webm',
    storagePath: '',
  });

  const handleChange = (key: keyof SettingsConfig, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('recorderSettings', JSON.stringify(settings));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <Paper className="max-w-4xl mx-auto p-3 sm:p-6">
        <Typography variant="h4" className="font-bold mb-4 sm:mb-6">
          Settings
        </Typography>

        <div className="space-y-4 sm:space-y-6">
          {/* AI Features */}
          <section>
            <Typography variant="h6" className="mb-4">
              AI Features
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoZoom}
                    onChange={(e) => handleChange('autoZoom', e.target.checked)}
                  />
                }
                label="Automatic Zoom"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.cursorHighlight}
                    onChange={(e) => handleChange('cursorHighlight', e.target.checked)}
                  />
                }
                label="Cursor Highlighting"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.noiseReduction}
                    onChange={(e) => handleChange('noiseReduction', e.target.checked)}
                  />
                }
                label="Noise Reduction"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.voiceCoaching}
                    onChange={(e) => handleChange('voiceCoaching', e.target.checked)}
                  />
                }
                label="Voice Coaching"
              />
            </div>
          </section>

          <Divider />

          {/* Recording Quality */}
          <section>
            <Typography variant="h6" className="mb-4">
              Recording Quality
            </Typography>
            <div className="space-y-4 sm:space-y-6">
              <FormControl fullWidth>
                <InputLabel>Quality Preset</InputLabel>
                <Select
                  value={settings.quality}
                  onChange={(e) => handleChange('quality', e.target.value)}
                  label="Quality Preset"
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>

              <div>
                <Typography gutterBottom>Frame Rate: {settings.frameRate} FPS</Typography>
                <Slider
                  value={settings.frameRate}
                  min={24}
                  max={60}
                  step={1}
                  onChange={(_, value) => handleChange('frameRate', value)}
                />
              </div>

              <div>
                <Typography gutterBottom>
                  Audio Bitrate: {settings.audioBitrate} kbps
                </Typography>
                <Slider
                  value={settings.audioBitrate}
                  min={64}
                  max={320}
                  step={32}
                  onChange={(_, value) => handleChange('audioBitrate', value)}
                />
              </div>

              <div>
                <Typography gutterBottom>
                  Video Bitrate: {settings.videoBitrate} kbps
                </Typography>
                <Slider
                  value={settings.videoBitrate}
                  min={1000}
                  max={8000}
                  step={500}
                  onChange={(_, value) => handleChange('videoBitrate', value)}
                />
              </div>
            </div>
          </section>

          <Divider />

          {/* Output Settings */}
          <section>
            <Typography variant="h6" className="mb-4">
              Output Settings
            </Typography>
            <div className="space-y-4">
              <FormControl fullWidth>
                <InputLabel>Output Format</InputLabel>
                <Select
                  value={settings.outputFormat}
                  onChange={(e) => handleChange('outputFormat', e.target.value)}
                  label="Output Format"
                >
                  <MenuItem value="webm">WebM</MenuItem>
                  <MenuItem value="mp4">MP4</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Storage Path"
                value={settings.storagePath}
                onChange={(e) => handleChange('storagePath', e.target.value)}
                helperText="Directory where recordings will be saved"
              />
            </div>
          </section>

          <Box className="flex justify-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              className="mt-4"
            >
              Save Settings
            </Button>
          </Box>
        </div>
      </Paper>
    </div>
  );
};

export default Settings; 