import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { accessLogsApi, type AccessLog } from '../api/accessLogs';
import { apiErrorMessage } from '../api/client';

export default function AccessLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setLogs(await accessLogsApi.list());
      } catch (e) {
        setError(apiErrorMessage(e, 'No se pudieron cargar los logs de acceso'));
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      logs.filter((l) => {
        const matchesUser =
          !filterUser ||
          l.user?.email.toLowerCase().includes(filterUser.toLowerCase()) ||
          l.user?.name.toLowerCase().includes(filterUser.toLowerCase());
        const matchesEvent = !filterEvent || l.event === filterEvent;
        return matchesUser && matchesEvent;
      }),
    [logs, filterUser, filterEvent],
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Logs de acceso
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Usuario (nombre o email)"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          sx={{ width: 280 }}
        />
        <TextField
          size="small"
          label="Evento"
          select
          sx={{ minWidth: 160 }}
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="INGRESO">Ingreso</MenuItem>
          <MenuItem value="SALIDA">Salida</MenuItem>
        </TextField>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha y hora</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>Navegador</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id} hover>
                <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {l.user ? `${l.user.name} (${l.user.email})` : `Usuario #${l.userId}`}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={l.event}
                    color={l.event === 'INGRESO' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>{l.ip}</TableCell>
                <TableCell>{l.browser}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Sin registros para los filtros seleccionados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
