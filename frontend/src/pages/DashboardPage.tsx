import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PeopleIcon from '@mui/icons-material/People';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiErrorMessage } from '../api/client';
import { reportsApi, type Stats } from '../api/reports';
import { useAuth } from '../auth/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: '#ed6c02',
  ATENDIDA: '#2e7d32',
  CANCELADA: '#9e9e9e',
};

interface SummaryCard {
  label: string;
  value: number;
  icon: React.ReactElement;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void reportsApi
      .stats()
      .then(setStats)
      .catch((e) => setError(apiErrorMessage(e, 'No se pudieron cargar las estadísticas')));
  }, []);

  const cards: SummaryCard[] = stats
    ? [
        { label: 'Pacientes', value: stats.counts.patients, icon: <PeopleIcon color="primary" /> },
        { label: 'Doctores', value: stats.counts.doctors, icon: <MedicalServicesIcon color="primary" /> },
        { label: 'Citas totales', value: stats.counts.appointments, icon: <EventIcon color="primary" /> },
        { label: 'Citas pendientes', value: stats.counts.pending, icon: <PendingActionsIcon color="warning" /> },
      ]
    : [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Bienvenido, {user?.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Resumen general del consultorio
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((c) => (
          <Grid key={c.label} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {c.label}
                    </Typography>
                    <Typography variant="h4">{c.value}</Typography>
                  </Box>
                  {c.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Citas por mes
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats?.byMonth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" name="Citas" fill="#00796b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Citas por estado
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats?.byStatus ?? []}
                    dataKey="total"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={90}
                    label
                  >
                    {(stats?.byStatus ?? []).map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? '#0288d1'} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Citas por doctor
              </Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats?.byDoctor ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis type="category" dataKey="doctor" width={160} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" name="Citas" fill="#0288d1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
