import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/eops-logo.png';

const Navbar = ({ onMenuSelect }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('/');
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenuClick = (view) => {
    if (onMenuSelect) onMenuSelect(view);
    setDrawerOpen(false);
  };

  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #e0fdf8, #e3f8ff)',
        }}
      >
        <img
          src={logo}
          alt="EOPS Logo"
          style={{ width: 90, marginRight: 10 }}
        />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f9f9a' }}>
          Menu
        </Typography>
      </Box>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick('match')}>
            <ListItemIcon>
              <CheckCircleOutlineIcon sx={{ color: '#16a085' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  YES/MAYBE
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: '#e53935' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #ffffff, #e9fffb)',
          borderBottom: '1px solid #c8f4ec',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2, color: '#0f9f9a' }}
          >
            <MenuIcon />
          </IconButton>

          <img
            src={logo}
            alt="EOPS Logo"
            style={{
              width: 105,
              maxHeight: 38,
              objectFit: 'contain',
              marginRight: 12,
            }}
          />

          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: 1,
              fontWeight: 900,
              color: '#0f9f9a',
              letterSpacing: '0.04em',
              fontSize: '0.95rem',
            }}
          >
            EMEDIX GC
          </Typography>

          <Button
            id="logout-button"
            onClick={handleLogout}
            startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: '#0f9f9a',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              '&:hover': {
                backgroundColor: '#dffaf5',
              },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navbar;