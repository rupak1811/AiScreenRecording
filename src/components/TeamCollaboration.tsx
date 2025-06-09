import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Chat as ChatIcon,
  Share as ShareIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface TeamMember {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
  isOnline: boolean;
  lastActive: Date;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  timestampInVideo: number;
}

interface TeamCollaborationProps {
  isVisible: boolean;
  onClose: () => void;
  onShare: (emails: string[]) => void;
}

const TeamCollaboration: React.FC<TeamCollaborationProps> = ({
  isVisible,
  onClose,
  onShare,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [newComment, setNewComment] = useState('');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Load team members and comments
      loadTeamData();
    }
  }, [isVisible]);

  const loadTeamData = async () => {
    // Simulate loading team data
    const mockTeamMembers: TeamMember[] = [
      {
        id: '1',
        name: 'John Doe',
        role: 'owner',
        isOnline: true,
        lastActive: new Date(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        role: 'editor',
        isOnline: false,
        lastActive: new Date(Date.now() - 3600000),
      },
    ];

    const mockComments: Comment[] = [
      {
        id: '1',
        userId: '2',
        userName: 'Jane Smith',
        content: 'Great work on the introduction!',
        timestamp: Date.now() - 3600000,
        timestampInVideo: 120,
      },
    ];

    setTeamMembers(mockTeamMembers);
    setComments(mockComments);
  };

  const handleInvite = () => {
    if (inviteEmail) {
      onShare([inviteEmail]);
      setInviteEmail('');
      setShowInviteDialog(false);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: '1', // Current user
        userName: 'John Doe', // Current user
        content: newComment,
        timestamp: Date.now(),
        timestampInVideo: currentVideoTime,
      };

      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <Paper
      className="fixed right-4 top-4 bottom-4 p-4 bg-black bg-opacity-90 text-white"
      style={{ zIndex: 1000, width: 320 }}
    >
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6">Team Collaboration</Typography>
        <IconButton
          onClick={onClose}
          className="text-white"
          size="small"
        >
          <RemoveIcon />
        </IconButton>
      </div>

      {/* Team Members */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Typography variant="subtitle1">Team Members</Typography>
          <Tooltip title="Invite Member">
            <IconButton
              onClick={() => setShowInviteDialog(true)}
              className="text-white"
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </div>
        <List>
          {teamMembers.map(member => (
            <ListItem key={member.id}>
              <ListItemAvatar>
                <Badge
                  color={member.isOnline ? 'success' : 'default'}
                  variant="dot"
                  overlap="circular"
                >
                  <Avatar src={member.avatar}>
                    <PersonIcon />
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={member.name}
                secondary={`${member.role} • ${
                  member.isOnline
                    ? 'Online'
                    : `Last active ${member.lastActive.toLocaleTimeString()}`
                }`}
              />
            </ListItem>
          ))}
        </List>
      </div>

      {/* Comments */}
      <div>
        <Typography variant="subtitle1" className="mb-2">
          Comments
        </Typography>
        <List className="max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <ListItem key={comment.id} className="flex-col items-start">
              <div className="flex items-center w-full">
                <Avatar src={comment.userName} className="mr-2">
                  <PersonIcon />
                </Avatar>
                <ListItemText
                  primary={comment.userName}
                  secondary={formatTime(comment.timestampInVideo)}
                />
              </div>
              <Typography className="mt-2">{comment.content}</Typography>
            </ListItem>
          ))}
        </List>
        <div className="mt-4">
          <TextField
            fullWidth
            multiline
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            variant="outlined"
            className="bg-white bg-opacity-10"
            InputProps={{
              className: 'text-white',
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddComment}
            className="mt-2"
            disabled={!newComment.trim()}
          >
            Add Comment
          </Button>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="mt-4"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInviteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            color="primary"
            disabled={!inviteEmail}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TeamCollaboration; 