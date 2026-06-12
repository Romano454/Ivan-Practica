import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MediCitas
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Bienvenido, {user?.name}
            </Typography>
            <Typography color="text.secondary">
              Rol: {user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Los módulos de pacientes, doctores y citas se habilitan en la Fase 2.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
