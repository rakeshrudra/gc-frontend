import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
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
  Button,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import TableChartIcon from "@mui/icons-material/TableChart";
import BoltIcon from "@mui/icons-material/Bolt";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

import logo from "../assets/eops-logo.png";
import vitalityLogo from "../assets/vitality-logo.png";
import { AuthContext } from "../context/AuthContext";
import { redirectToJiffy, redirectToVitality } from "../services/authApi";

const Navbar = ({ onMenuSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, role, adminRole } = useContext(AuthContext);
  const isStoreRole = role === "store";
  const canAccessOnboarding = [
    "emedix_sales",
    "emedix_op_admin",
    "emedix_admin",
    "emedix_superadmin",
  ].includes(adminRole);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

  const isHomePage = location.pathname === "/home";
  const settingsOpen = Boolean(settingsAnchorEl);

  const handleLogout = () => {
    handleSettingsClose();
    logout();
  };

  const handleSettingsOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setDrawerOpen(open);
  };

  const handleMenuClick = (route, view) => {
    if (onMenuSelect && view) {
      onMenuSelect(view);
    }

    if (route) {
      navigate(route);
    }

    setDrawerOpen(false);
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  const drawerContent = (
    <Box
      sx={{
        width: 250,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      role="presentation"
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #e0fdf8, #e3f8ff)",
        }}
      >
        <img
          src={logo}
          alt="EOPS Logo"
          style={{ width: 90, marginRight: 10 }}
        />

        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: "#0f9f9a",
          }}
        >
          Menu
        </Typography>
      </Box>

      <Divider />

      <List>
        {/* HOME */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick("/home")}>
            <ListItemIcon>
              <HomeOutlinedIcon sx={{ color: "#0f9f9a" }} />
            </ListItemIcon>

            <ListItemText
              primary={
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Home
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>

        {/* YES MAYBE REPORT */}
        {!isStoreRole && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleMenuClick("/dashboard", "match")}
            >
              <ListItemIcon>
                <CheckCircleOutlineIcon sx={{ color: "#16a085" }} />
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    YES/MAYBE Report
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}

        {/* PROCESSED ORDERS */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick("/processed-orders")}>
            <ListItemIcon>
              <TableChartIcon sx={{ color: "#8e24aa" }} />
            </ListItemIcon>

            <ListItemText
              primary={
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Processed Orders
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>

        {/* EXPIRY RETURN */}
        {!isStoreRole && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleMenuClick("/expiry-return")}>
              <ListItemIcon>
                <AssignmentReturnIcon sx={{ color: "#0f9f9a" }} />
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    Expiry Return
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}

        {/* MASTER UPLOAD */}
        {!isStoreRole && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleMenuClick("/master-upload")}>
              <ListItemIcon>
                <UploadFileIcon sx={{ color: "#0f9f9a" }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    Master Upload
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}

        {/* CREATE ONBOARDING */}
        {canAccessOnboarding && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleMenuClick("/onboarding")}>
              <ListItemIcon>
                <PersonAddAlt1Icon sx={{ color: "#0f9f9a" }} />
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    Create Onboarding
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}

        {/* SEARCH */}
        {!isStoreRole && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() =>
                handleMenuClick("/medicine-vendor-search", "searchMaster")
              }
            >
              <ListItemIcon>
                <SearchIcon sx={{ color: "#0f9f9a" }} />
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    Search Medicines and Vendors
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>

      <Box sx={{ mt: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<BoltIcon />}
          onClick={() => {
            setDrawerOpen(false);
            redirectToJiffy();
          }}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "#f39c12",
            boxShadow: "0 4px 12px rgba(243, 156, 18, 0.4)",
            "&:hover": {
              backgroundColor: "#d6870f",
            },
          }}
        >
          Go to Jiffy
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={
            <img src={vitalityLogo} alt="" style={{ width: 20, height: 20 }} />
          }
          onClick={() => {
            setDrawerOpen(false);
            redirectToVitality();
          }}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 700,
            color: "#0f9f9a",
            borderColor: "#0f9f9a",
            "&:hover": {
              backgroundColor: "#e9fffb",
              borderColor: "#0f9f9a",
            },
          }}
        >
          Go to Vitality
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #ffffff, #e9fffb)",
          borderBottom: "1px solid #c8f4ec",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{
              mr: 2,
              color: "#0f9f9a",
            }}
          >
            <MenuIcon />
          </IconButton>

          <img
            src={logo}
            alt="EOPS Logo"
            style={{
              width: 105,
              maxHeight: 38,
              objectFit: "contain",
              marginRight: 12,
            }}
          />

          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: 1,
              fontWeight: 900,
              color: "#0f9f9a",
              letterSpacing: "0.04em",
              fontSize: "0.95rem",
            }}
          >
            EMEDIX GC
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.4,
            }}
          >
            {!isHomePage && (
              <IconButton
                onClick={handleHomeClick}
                size="small"
                sx={{
                  color: "#0f9f9a",
                  p: 0.75,
                  "&:hover": {
                    backgroundColor: "#dffaf5",
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
                color: "#0f9f9a",
                p: 0.75,
                "&:hover": {
                  backgroundColor: "#dffaf5",
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
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: "#e53935" }} />
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
