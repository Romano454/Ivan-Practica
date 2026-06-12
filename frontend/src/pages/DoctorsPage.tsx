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
import { doctorsApi, type Doctor } from '../api/doctors';
import { useAuth } from '../auth/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(80, 'Máximo 80 caracteres'),
  specialty: z.string().min(3, 'Mínimo 3 caracteres').max(60, 'Máximo 60 caracteres'),
  phone: z.string().regex(/^[0-9+\s-]{6,20}$/, 'Teléfono inválido'),
  email: z.string().email('Email inválido').or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const EMPTY: FormData = { name: '', specialty: '', phone: '', email: '' };

export default function DoctorsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);
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
      setDoctors(await doctorsApi.list(search));
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo cargar la lista de doctores'));
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

  const openEdit = (d: Doctor) => {
    setEditing(d);
    reset({ name: d.name, specialty: d.specialty, phone: d.phone, email: d.email ?? '' });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, email: data.email || undefined };
    try {
      if (editing) {
        await doctorsApi.update(editing.id, payload);
        setFeedback('Doctor actualizado');
      } else {
        await doctorsApi.create(payload);
        setFeedback('Doctor registrado');
      }
      setDialogOpen(false);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo guardar el doctor'));
    }
  };

  const onDelete = async () => {
    if (!deleting) return;
    try {
      await doctorsApi.remove(deleting.id);
      setFeedback('Doctor eliminado');
      setDeleting(null);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo eliminar el doctor'));
      setDeleting(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Doctores</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo doctor
          </Button>
        )}
      </Stack>
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Solo el administrador puede crear o modificar doctores.
        </Alert>
      )}
      <TextField
        size="small"
        placeholder="Buscar por nombre o especialidad…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 360 }}
        slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: "text.disabled" }} /> } }}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              {isAdmin && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.specialty}</TableCell>
                <TableCell>{d.phone}</TableCell>
                <TableCell>{d.email ?? '—'}</TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(d)} title="Editar">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleting(d)}
                      title="Eliminar"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                  Sin doctores registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar doctor' : 'Nuevo doctor'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Nombre completo"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
              <TextField
                label="Especialidad"
                {...register('specialty')}
                error={!!errors.specialty}
                helperText={errors.specialty?.message}
              />
              <TextField
                label="Teléfono"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
              <TextField
                label="Email (opcional)"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
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
        title="Eliminar doctor"
        message={`¿Eliminar al doctor ${deleting?.name}? El registro se conserva en la base de datos (eliminación lógica).`}
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
