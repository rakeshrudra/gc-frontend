import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Fade,
  Grow,
  Stack,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import TableChartIcon from '@mui/icons-material/TableChart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import DescriptionIcon from '@mui/icons-material/Description';
import { AuthContext } from '../context/AuthContext';
import { getGrievances } from '../services/grievances';

const OPEN_STATUSES = ['new', 'assigned', 'acknowledged', 'in_progress', 'waiting_for_requester', 'escalated'];
const MANAGER_ADMIN_ROLES = ['emedix_admin', 'emedix_superadmin'];
const ONBOARDING_ROLES = ['emedix_sales', 'emedix_op_admin', 'emedix_admin', 'emedix_superadmin'];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const ActionCard = ({ icon, iconBg, iconColor, title, description, onClick, badgeCount, delay = 0 }) => (
  <Grow in timeout={450} style={{ transitionDelay: `${delay}ms` }}>
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 4,
        border: '1px solid #a8d8d3',
        backgroundColor: '#ffffff',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: '#0f9f9a',
          boxShadow: '0 16px 32px rgba(15, 159, 154, 0.16)',
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ borderRadius: 4, textAlign: 'left', height: '100%', p: 0.5 }} aria-label={title}>
        <CardContent sx={{ p: 2.75 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Badge
              badgeContent={badgeCount > 0 ? badgeCount : undefined}
              color="error"
              sx={{ '& .MuiBadge-badge': { fontWeight: 800, fontSize: '0.65rem' } }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  backgroundColor: iconBg,
                  color: iconColor,
                }}
              >
                {icon}
              </Avatar>
            </Badge>
            <ArrowForwardIcon
              sx={{
                color: '#5a6b73',
                fontSize: 20,
                mt: 0.5,
                transition: 'transform 0.25s ease, color 0.25s ease',
                '.MuiCardActionArea-root:hover &': {
                  transform: 'translateX(4px)',
                  color: '#0f9f9a',
                },
              }}
            />
          </Stack>

          <Typography sx={{ fontWeight: 800, color: '#113b4a', mt: 2, fontSize: '1.02rem' }}>
            {title}
          </Typography>

          <Typography variant="body2" sx={{ color: '#5a6b73', mt: 0.6, lineHeight: 1.5 }}>
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  </Grow>
);

const HeroHeader = ({ greeting, subtitle, sideTop, sideBottom }) => (
  <Fade in timeout={500}>
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 3, sm: 4 },
        mb: 3,
        background: 'linear-gradient(135deg, #0f9f9a 0%, #0c7f7b 55%, #0a6b68 100%)',
        boxShadow: '0 20px 40px rgba(12, 127, 123, 0.28)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          right: 80,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }}
      />

      <Stack direction="row" alignItems="flex-start" sx={{ position: 'relative' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.9rem' },
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            {greeting}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '0.88rem', sm: '0.95rem' },
              color: 'rgba(255,255,255,0.85)',
              mt: 0.5,
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {sideTop && (
          <Box sx={{ flexShrink: 0, ml: 2, textAlign: 'right' }}>
            <Typography
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.9rem' },
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {sideTop}
            </Typography>
            {sideBottom && (
              <Typography
                sx={{
                  fontSize: { xs: '0.88rem', sm: '0.95rem' },
                  color: 'rgba(255,255,255,0.85)',
                  mt: 0.5,
                  whiteSpace: 'nowrap',
                }}
              >
                {sideBottom}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  </Fade>
);

const Home = () => {
  const navigate = useNavigate();
  const { role, adminRole, storeUser, admin } = useContext(AuthContext);
  const [openGrievanceCount, setOpenGrievanceCount] = useState(0);

  const isManager = MANAGER_ADMIN_ROLES.includes(adminRole);
  const canAccessOnboarding = ONBOARDING_ROLES.includes(adminRole);
  const grievanceScope = isManager ? 'unassigned' : 'mine';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!grievanceScope) return;
      try {
        const results = await Promise.all(
          OPEN_STATUSES.map((status) => getGrievances({ scope: grievanceScope, status, page: 1, limit: 1 }))
        );
        if (!cancelled) {
          setOpenGrievanceCount(results.reduce((sum, r) => sum + (r?.total ?? 0), 0));
        }
      } catch {
        if (!cancelled) setOpenGrievanceCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [grievanceScope]);

  const displayName = storeUser?.person_name || admin?.username || '';
  const greeting = displayName ? `${getGreeting()}, ${displayName}` : getGreeting();

  if (role === 'store') {
    return (
      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 }, maxWidth: 1100, mx: 'auto' }}>
        <HeroHeader
          greeting={greeting}
          subtitle="Manage your orders and grievances from one place."
          sideTop={storeUser?.store_display_name ?? storeUser?.store_name}
          sideBottom={storeUser?.role}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 2.5,
          }}
        >
          <ActionCard
            icon={<TableChartIcon />}
            iconBg="#f3e5f5"
            iconColor="#8e24aa"
            title="Processed Orders"
            description="View and update the status of your store's orders."
            onClick={() => navigate('/processed-orders')}
            delay={0}
          />
          <ActionCard
            icon={<SupportAgentIcon />}
            iconBg="#fff3e0"
            iconColor="#ef6c00"
            title="My Grievances"
            description="Track the status of grievances you've raised."
            onClick={() => navigate('/grievances')}
            badgeCount={openGrievanceCount}
            delay={100}
          />
          <ActionCard
            icon={<SupportAgentIcon />}
            iconBg="#e0f7f5"
            iconColor="#0f9f9a"
            title="Raise a Grievance"
            description="Report a store-related issue and track it to resolution."
            onClick={() => navigate('/grievances/new')}
            delay={200}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <HeroHeader
        greeting={greeting}
        subtitle="Click a card below to get started, or use the menu in the top left."
        sideTop={adminRole}
        sideBottom="Emedix Team"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 2.5,
        }}
      >
        <ActionCard
          icon={<UploadFileIcon />}
          iconBg="#e0f2f1"
          iconColor="#0f9f9a"
          title="YES/MAYBE Report"
          description="Upload Excel or CSV file and view medicine matching results."
          onClick={() => navigate('/dashboard')}
          delay={0}
        />
        <ActionCard
          icon={<TableChartIcon />}
          iconBg="#f3e5f5"
          iconColor="#8e24aa"
          title="Processed Orders"
          description="View and update the status of store orders."
          onClick={() => navigate('/processed-orders')}
          delay={50}
        />
        <ActionCard
          icon={<SupportAgentIcon />}
          iconBg="#fff3e0"
          iconColor="#ef6c00"
          title="Grievances"
          description="Review and act on grievances assigned to you."
          onClick={() => navigate('/grievances')}
          badgeCount={openGrievanceCount}
          delay={100}
        />
        <ActionCard
          icon={<AssignmentReturnIcon />}
          iconBg="#e0f2f1"
          iconColor="#0f9f9a"
          title="Expiry Return"
          description="Manage expiry return requests."
          onClick={() => navigate('/expiry-return')}
          delay={200}
        />
        <ActionCard
          icon={<UploadFileIcon />}
          iconBg="#e0f2f1"
          iconColor="#0f9f9a"
          title="Master Upload"
          description="Upload and manage master medicine data."
          onClick={() => navigate('/master-upload')}
          delay={250}
        />
        {canAccessOnboarding && (
          <>
            <ActionCard
              icon={<PersonAddAlt1Icon />}
              iconBg="#e0f7f5"
              iconColor="#0c7f7b"
              title="Onboarding Clients"
              description="View and manage prospective franchise clients."
              onClick={() => navigate('/onboarding')}
              delay={300}
            />
            <ActionCard
              icon={<DescriptionIcon />}
              iconBg="#e0f7f5"
              iconColor="#0c7f7b"
              title="Contracts"
              description="Prepare and track franchise contracts."
              onClick={() => navigate('/contracts')}
              delay={350}
            />
          </>
        )}
        <ActionCard
          icon={<SearchIcon />}
          iconBg="#e3f2fd"
          iconColor="#1565c0"
          title="Search Medicines & Vendors"
          description="Search master data and view vendor bill, date, and discount."
          onClick={() => navigate('/medicine-vendor-search')}
          delay={400}
        />
      </Box>

      <Typography sx={{ mt: 3, fontSize: '0.82rem', color: '#5a6b73', textAlign: 'center' }}>
        The menu has the same options anytime.
      </Typography>
    </Box>
  );
};

export default Home;
