import { Card, CardContent, Typography } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Bienvenido, {user?.name}
        </Typography>
        <Typography color="text.secondary">
          Rol: {user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Use el menú lateral para gestionar pacientes, doctores y citas. Las
          estadísticas y reportes llegan en la Fase 3.
        </Typography>
      </CardContent>
    </Card>
  );
}
