import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { apiErrorMessage } from '../api/client';
import { doctorsApi, type Doctor } from '../api/doctors';
import { reportsApi } from '../api/reports';

export default function ReportsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void doctorsApi
      .list()
      .then(setDoctors)
      .catch((e) => setError(apiErrorMessage(e, 'No se pudieron cargar los doctores')));
  }, []);

  const download = async () => {
    setLoading(true);
    setError('');
    try {
      const blob = await reportsApi.appointmentsPdf({
        from: from || undefined,
        to: to || undefined,
        doctorId: doctorId ? Number(doctorId) : undefined,
      });
      const url = URL.createObjectURL(blob);
      // Descarga directa del PDF: más fiable que window.open (evita bloqueos de
      // popups y funciona en la PWA del celular)
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-citas-${from || 'inicio'}_${to || 'hoy'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo generar el reporte'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Reportes
      </Typography>
      <Card sx={{ maxWidth: 640 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reporte de citas en PDF
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Filtre por rango de fechas y/o doctor. Sin filtros, el reporte
            incluye todas las citas.
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Desde"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <TextField
                label="Hasta"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </Stack>
            <TextField
              label="Doctor"
              select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <MenuItem value="">Todos los doctores</MenuItem>
              {doctors.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>
                  {d.name} ({d.specialty})
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              size="large"
              startIcon={<PictureAsPdfIcon />}
              onClick={download}
              disabled={loading}
            >
              {loading ? 'Generando…' : 'Generar PDF'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
