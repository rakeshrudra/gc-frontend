import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import LockResetIcon from '@mui/icons-material/LockReset';
import logo from '../assets/eops-logo.png';

const Navbar = ({ onMenuSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

  const isHomePage = location.pathname === '/home';
  const settingsOpen = Boolean(settingsAnchorEl);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('/');
  };

  const handleSettingsOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleResetPassword = () => {
    handleSettingsClose();
    navigate('/reset-password');
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenuClick = (route, view) => {
    if (onMenuSelect && view) onMenuSelect(view);
    if (route) navigate(route);
    setDrawerOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/home');
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
          <ListItemButton onClick={() => handleMenuClick('/home')}>
            <ListItemIcon>
              <HomeOutlinedIcon sx={{ color: '#0f9f9a' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Home
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick('/dashboard', 'match')}>
            <ListItemIcon>
              <CheckCircleOutlineIcon sx={{ color: '#16a085' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  YES/MAYBE Report
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick('/medicine-vendor-search', 'searchMaster')}>
            <ListItemIcon>
              <SearchIcon sx={{ color: '#0f9f9a' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Search Medicines and Vendors
                </Typography>
              }
            />
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
            }}
          >
            {!isHomePage && (
              <IconButton
                onClick={handleHomeClick}
                size="small"
                sx={{
                  color: '#0f9f9a',
                  p: 0.75,
                  '&:hover': {
                    backgroundColor: '#dffaf5',
                  },
                }}
              >
                <HomeIcon sx={{ fontSize: 22 }} />
              </IconButton>
            )}

            <IconButton
              onClick={handleSettingsOpen}
              size="small"
              sx={{
                color: '#0f9f9a',
                p: 0.75,
                '&:hover': {
                  backgroundColor: '#dffaf5',
                },
              }}
            >
              <SettingsIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>

          <Menu
            anchorEl={settingsAnchorEl}
            open={settingsOpen}
            onClose={handleSettingsClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleResetPassword}>
              <ListItemIcon>
                <LockResetIcon fontSize="small" sx={{ color: '#0f9f9a' }} />
              </ListItemIcon>
              <ListItemText primary="Reset Password" />
            </MenuItem>

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#e53935' }} />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navbar;