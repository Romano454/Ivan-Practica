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
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
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
import RestoreIcon from '@mui/icons-material/Restore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiErrorMessage } from '../api/client';
import { usersApi, type ManagedUser } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import PasswordStrengthMeter, { getStrength } from '../components/PasswordStrengthMeter';

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(80, 'Máximo 80 caracteres'),
  email: z.string().email('Email inválido'),
  // En edición la contraseña es opcional (vacía = no cambiar)
  password: z
    .string()
    .max(72, 'Máximo 72 caracteres')
    .refine((v) => v === '' || v.length >= 8, 'Mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'RECEPCIONISTA']),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const EMPTY: FormData = {
  name: '',
  email: '',
  password: '',
  role: 'RECEPCIONISTA',
  isActive: true,
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const password = watch('password', '');
  const isActive = watch('isActive', true);
  const isWeak = password.length > 0 && getStrength(password).label === 'Débil';

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.list());
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo cargar la lista de usuarios'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    reset({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!editing && !data.password) {
      setError('La contraseña es obligatoria para un usuario nuevo');
      return;
    }
    try {
      if (editing) {
        await usersApi.update(editing.id, {
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          password: data.password || undefined,
        });
        setFeedback('Usuario actualizado');
      } else {
        await usersApi.create({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        });
        setFeedback('Usuario creado');
      }
      setDialogOpen(false);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo guardar el usuario'));
    }
  };

  const onDelete = async () => {
    if (!deleting) return;
    try {
      await usersApi.remove(deleting.id);
      setFeedback('Usuario eliminado');
      setDeleting(null);
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo eliminar el usuario'));
      setDeleting(null);
    }
  };

  const onRestore = async (u: ManagedUser) => {
    try {
      await usersApi.restore(u.id);
      setFeedback('Usuario restaurado');
      void load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo restaurar el usuario'));
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Usuarios del sistema</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo usuario
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover sx={{ opacity: u.deletedAt ? 0.55 : 1 }}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
                </TableCell>
                <TableCell>
                  {u.deletedAt ? (
                    <Chip size="small" label="Eliminado" />
                  ) : u.isActive ? (
                    <Chip size="small" color="success" label="Activo" />
                  ) : (
                    <Chip size="small" color="warning" label="Inactivo" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {u.deletedAt ? (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onRestore(u)}
                      title="Restaurar"
                    >
                      <RestoreIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => openEdit(u)} title="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={u.id === me?.id}
                        onClick={() => setDeleting(u)}
                        title={u.id === me?.id ? 'No puede eliminarse a sí mismo' : 'Eliminar'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
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
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                label={editing ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña'}
                type="password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <PasswordStrengthMeter password={password} />
              {isWeak && (
                <Alert severity="warning">
                  La contraseña es débil: el sistema la rechazará.
                </Alert>
              )}
              <TextField
                label="Rol"
                select
                defaultValue={editing?.role ?? 'RECEPCIONISTA'}
                {...register('role')}
              >
                <MenuItem value="RECEPCIONISTA">Recepcionista</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
              </TextField>
              {editing && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setValue('isActive', e.target.checked)}
                    />
                  }
                  label="Usuario activo"
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting || isWeak}>
              Guardar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar usuario"
        message={`¿Eliminar al usuario ${deleting?.name}? Podrá restaurarlo después (eliminación lógica).`}
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
