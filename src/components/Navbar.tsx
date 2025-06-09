import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppBar, Toolbar, Button, Box, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Home as HomeIcon,
  Videocam as VideocamIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/', icon: <HomeIcon />, label: 'Home' },
    { path: '/recorder', icon: <VideocamIcon />, label: 'Recorder' },
    { path: '/editor', icon: <EditIcon />, label: 'Editor' },
    { path: '/settings', icon: <SettingsIcon />, label: 'Settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <List>
      {navItems.map((item) => (
        <ListItem
          button
          component={Link}
          to={item.path}
          key={item.path}
          onClick={handleDrawerToggle}
          className={location.pathname === item.path ? 'bg-primary-50' : ''}
        >
          <ListItemIcon className={location.pathname === item.path ? 'text-primary-600' : 'text-gray-600'}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label}
            className={location.pathname === item.path ? 'text-primary-600' : 'text-gray-600'}
          />
        </ListItem>
      ))}
    </List>
  );

  return (
    <AppBar position="sticky" color="transparent" elevation={0} className="backdrop-blur-md bg-white/80">
      <Toolbar className="justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <Link to="/" className="text-xl md:text-2xl font-bold text-primary-600">
            AI Screen Recorder
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <Box className="hidden md:flex gap-2">
          {navItems.map((item) => (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                component={Link}
                to={item.path}
                startIcon={item.icon}
                className={`${
                  location.pathname === item.path
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Button>
            </motion.div>
          ))}
        </Box>

        {/* Mobile Navigation */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          className="md:hidden"
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        className="md:hidden"
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar; 