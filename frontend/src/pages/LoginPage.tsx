import { useRef, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../auth/AuthContext';

const schema = z.object({
  email: z.string().email('El email no es válido'),
  password: z.string().min(1, 'Ingrese su contraseña'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef<ReCAPTCHA>(null);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (data: FormData) => {
    setError('');
    const captchaToken = captchaRef.current?.getValue() ?? '';
    if (!captchaToken) {
      setError('Complete el CAPTCHA para continuar');
      return;
    }
    try {
      await login({ ...data, captchaToken });
      navigate('/');
    } catch (e) {
      captchaRef.current?.reset();
      setError(
        axios.isAxiosError(e)
          ? (e.response?.data?.message ?? 'Error al iniciar sesión')
          : 'Error al iniciar sesión',
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: 400, m: 2 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack sx={{ alignItems: 'center' }} spacing={1}>
              <LocalHospitalIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h5">MediCitas</Typography>
              <Typography variant="body2" color="text.secondary">
                Inicie sesión para continuar
              </Typography>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Contraseña"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              />
            </Box>
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
            <Typography variant="body2" align="center">
              ¿No tiene cuenta?{' '}
              <Link component={RouterLink} to="/register">
                Regístrese
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
