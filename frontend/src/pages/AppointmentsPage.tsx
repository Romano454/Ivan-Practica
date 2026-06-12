import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  appointmentsApi,
  type Appointment,
  type AppointmentStatus,
} from '../api/appointments';
import { apiErrorMessage } from '../api/client';
import { doctorsApi, type Doctor } from '../api/doctors';
import { patientsApi, type Patient } from '../api/patients';
import ConfirmDialog from '../components/ConfirmDialog';

const schema = z.object({
  patientId: z.string().min(1, 'Seleccione un paciente'),
  doctorId: z.string().min(1, 'Seleccione un doctor'),
  date: z.string().min(1, 'Seleccione una fecha'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida'),
  reason: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  notes: z.string().max(500, 'Máximo 500 caracteres'),
  status: z.enum(['PENDIENTE', 'ATENDIDA', 'CANCELADA']),
});

type FormData = z.infer<typeof schema>;

const EMPTY: FormData = {
  patientId: '',
  doctorId: '',
  date: '',
  time: '',
  reason: '',
  notes: '',
  status: 'PENDIENTE',
};

const STATUS_COLOR: Record<AppointmentStatus, 'warning' | 'success' | 'default'> = {
  PENDIENTE: 'warning',
  ATENDIDA: 'success',
  CANCELADA: 'default',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const load = useCallback(async () => {
    try {
      setAppointments(
        await appointmentsApi.list({
          date: filterDate || undefined,
          doctorId: filterDoctor ? Number(filterDoctor) : undefined,
          status: (filterStatus || undefined) as AppointmentStatus | undefined,
        }),
      );
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo cargar la lista de citas'));
    }
  }, [filterDate, filterDoctor, filterStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const [p, d] = await Promise.all([patientsApi.list(), doctorsApi.list()]);
        setPatients(p);
        setDoctors(d);
      } catch (e) {
        setError(apiErrorMessage(e, 'No se pudieron cargar pacientes y doctores'));
      }
    })();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    reset({
      patientId: String(a.patientId),
      doctorId: String(a.doctorId),
      date: a.date,
      time: a.time,
      reason: a.reason,
      notes: a.notes ?? '',
      status: a.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      patientId: Number(data.patientId),
      doctorId: Number(data.doctorId),
      date: data.date,
      time: data.time,
      reason: data.reason,
      notes: data.notes || undefined,
    };
    try {
      if (editing) {
        await appointmentsApi.update(editing.id, { ...payload, status: data.status });
        setFeedback('Cita actualizada');
      } else {
        await appointmentsApi.create(payload);
        setFeedback('Cita registrada');
      }
      setDialogOpen(false);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo guardar la cita'));
    }
  };

  const onDelete = async () => {
    if (!deleting) return;
    try {
      await appointmentsApi.remove(deleting.id);
      setFeedback('Cita eliminada');
      setDeleting(null);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo eliminar la cita'));
      setDeleting(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Citas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva cita
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Fecha"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <TextField
          size="small"
          label="Doctor"
          select
          sx={{ minWidth: 200 }}
          value={filterDoctor}
          onChange={(e) => setFilterDoctor(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {doctors.map((d) => (
            <MenuItem key={d.id} value={String(d.id)}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Estado"
          select
          sx={{ minWidth: 160 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PENDIENTE">Pendiente</MenuItem>
          <MenuItem value="ATENDIDA">Atendida</MenuItem>
          <MenuItem value="CANCELADA">Cancelada</MenuItem>
        </TextField>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>{a.date}</TableCell>
                <TableCell>{a.time}</TableCell>
                <TableCell>
                  {a.patient ? `${a.patient.lastName}, ${a.patient.firstName}` : '—'}
                </TableCell>
                <TableCell>{a.doctor?.name ?? '—'}</TableCell>
                <TableCell>{a.reason}</TableCell>
                <TableCell>
                  <Chip size="small" label={a.status} color={STATUS_COLOR[a.status]} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(a)} title="Editar">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleting(a)}
                    title="Eliminar"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Sin citas para los filtros seleccionados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Paciente"
                select
                defaultValue={editing ? String(editing.patientId) : ''}
                {...register('patientId')}
                error={!!errors.patientId}
                helperText={errors.patientId?.message}
              >
                {patients.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName} — {p.document}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Doctor"
                select
                defaultValue={editing ? String(editing.doctorId) : ''}
                {...register('doctorId')}
                error={!!errors.doctorId}
                helperText={errors.doctorId?.message}
              >
                {doctors.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Fecha"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('date')}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                />
                <TextField
                  label="Hora"
                  type="time"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('time')}
                  error={!!errors.time}
                  helperText={errors.time?.message}
                />
              </Stack>
              <TextField
                label="Motivo"
                {...register('reason')}
                error={!!errors.reason}
                helperText={errors.reason?.message}
              />
              <TextField
                label="Notas (opcional)"
                multiline
                minRows={2}
                {...register('notes')}
                error={!!errors.notes}
                helperText={errors.notes?.message}
              />
              {editing && (
                <TextField
                  label="Estado"
                  select
                  defaultValue={editing.status}
                  {...register('status')}
                >
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="ATENDIDA">Atendida</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Guardar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar cita"
        message="¿Eliminar esta cita? El registro se conserva en la base de datos (eliminación lógica)."
        onConfirm={onDelete}
        onClose={() => setDeleting(null)}
      />

      <Snackbar
        open={!!feedback}
        autoHideDuration={3000}
        onClose={() => setFeedback('')}
        message={feedback}
      />
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
