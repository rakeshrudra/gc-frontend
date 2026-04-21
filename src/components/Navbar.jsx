import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
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
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuSelect }) => {
  const navigate = useNavigate();
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
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', backgroundColor: '#e1f5fe' }}>
        <LocalPharmacyIcon sx={{ mr: 1, color: '#0288d1' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#01579b' }}>
          Menu
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick('match')}>
            <ListItemIcon>
              <CheckCircleOutlineIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>YES/MAYBE</Typography>} 
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            navigate('/vendorsearch');
            setDrawerOpen(false);
          }}>
            <ListItemIcon>
              <SearchIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Vendor Search</Typography>} 
            />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon color="error" />
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
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e1f5fe',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2, color: '#0288d1' }}
          >
            <MenuIcon />
          </IconButton>
          <LocalPharmacyIcon
            sx={{
              mr: 1,
              fontSize: 24,
              color: '#0288d1',
            }}
          />
          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              color: '#01579b',
              letterSpacing: '0.02em',
              fontSize: '0.9rem', // Smaller font
            }}
          >
            E-MEDIX GYAN CENTER
          </Typography>

          <Button
            id="logout-button"
            onClick={handleLogout}
            startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: '#0277bd',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              '&:hover': {
                backgroundColor: '#e1f5fe',
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
