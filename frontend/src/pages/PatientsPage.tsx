import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiErrorMessage } from '../api/client';
import { patientsApi, type Patient } from '../api/patients';
import ConfirmDialog from '../components/ConfirmDialog';

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
  document: z
    .string()
    .regex(/^[0-9A-Za-z.-]{4,20}$/, 'Entre 4 y 20 caracteres (letras, números, punto o guion)'),
  phone: z.string().regex(/^[0-9+\s-]{6,20}$/, 'Teléfono inválido'),
  email: z.string().email('Email inválido').or(z.literal('')),
  birthDate: z.string(),
  gender: z.enum(['MASCULINO', 'FEMENINO', 'OTRO']),
});

type FormData = z.infer<typeof schema>;

const EMPTY: FormData = {
  firstName: '',
  lastName: '',
  document: '',
  phone: '',
  email: '',
  birthDate: '',
  gender: 'OTRO',
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
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
      setPatients(await patientsApi.list(search));
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo cargar la lista de pacientes'));
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    reset({
      firstName: p.firstName,
      lastName: p.lastName,
      document: p.document,
      phone: p.phone,
      email: p.email ?? '',
      birthDate: p.birthDate ?? '',
      gender: p.gender,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      email: data.email || undefined,
      birthDate: data.birthDate || undefined,
    };
    try {
      if (editing) {
        await patientsApi.update(editing.id, payload);
        setFeedback('Paciente actualizado');
      } else {
        await patientsApi.create(payload);
        setFeedback('Paciente registrado');
      }
      setDialogOpen(false);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo guardar el paciente'));
    }
  };

  const onDelete = async () => {
    if (!deleting) return;
    try {
      await patientsApi.remove(deleting.id);
      setFeedback('Paciente eliminado');
      setDeleting(null);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo eliminar el paciente'));
      setDeleting(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Pacientes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo paciente
        </Button>
      </Stack>
      <TextField
        size="small"
        placeholder="Buscar por nombre, apellido o documento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 360 }}
        slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: "text.disabled" }} /> } }}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Documento</TableCell>
              <TableCell>Apellidos</TableCell>
              <TableCell>Nombres</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>F. nacimiento</TableCell>
              <TableCell>Género</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.document}</TableCell>
                <TableCell>{p.lastName}</TableCell>
                <TableCell>{p.firstName}</TableCell>
                <TableCell>{p.phone}</TableCell>
                <TableCell>{p.email ?? '—'}</TableCell>
                <TableCell>{p.birthDate ?? '—'}</TableCell>
                <TableCell>{p.gender}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(p)} title="Editar">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleting(p)}
                    title="Eliminar"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Sin pacientes registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Nombres"
                  fullWidth
                  {...register('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
                <TextField
                  label="Apellidos"
                  fullWidth
                  {...register('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Documento (CI)"
                  fullWidth
                  {...register('document')}
                  error={!!errors.document}
                  helperText={errors.document?.message}
                />
                <TextField
                  label="Teléfono"
                  fullWidth
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Stack>
              <TextField
                label="Email (opcional)"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Fecha de nacimiento"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('birthDate')}
                />
                <TextField label="Género" select fullWidth defaultValue="OTRO" {...register('gender')}>
                  <MenuItem value="MASCULINO">Masculino</MenuItem>
                  <MenuItem value="FEMENINO">Femenino</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </TextField>
              </Stack>
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
        title="Eliminar paciente"
        message={`¿Eliminar a ${deleting?.firstName} ${deleting?.lastName}? El registro se conserva en la base de datos (eliminación lógica).`}
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
