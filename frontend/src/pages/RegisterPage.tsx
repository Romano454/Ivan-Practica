import { useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReCAPTCHA from 'react-google-recaptcha';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import PasswordStrengthMeter, { getStrength } from '../components/PasswordStrengthMeter';

const schema = z
  .object({
    name: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(80, 'El nombre no puede superar 80 caracteres'),
    email: z.string().email('El email no es válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña no puede superar 72 caracteres'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const captchaRef = useRef<ReCAPTCHA>(null);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const isWeak = password.length > 0 && getStrength(password).label === 'Débil';

  const onSubmit = async (data: FormData) => {
    setError('');
    const captchaToken = captchaRef.current?.getValue() ?? '';
    if (!captchaToken) {
      setError('Complete el CAPTCHA para continuar');
      return;
    }
    try {
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        captchaToken,
      });
      navigate('/login', { state: { registered: true } });
    } catch (e) {
      captchaRef.current?.reset();
      setError(apiErrorMessage(e, 'Error al registrar el usuario'));
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
              <PersonAddIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h5">Crear cuenta</Typography>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
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
              label="Contraseña"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <PasswordStrengthMeter password={password} />
            <TextField
              label="Confirmar contraseña"
              type="password"
              {...register('confirm')}
              error={!!errors.confirm}
              helperText={errors.confirm?.message}
            />
            {isWeak && (
              <Alert severity="warning">
                La contraseña es débil: alárguela y combine mayúsculas, números y símbolos.
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting || isWeak}
            >
              {isSubmitting ? 'Registrando…' : 'Registrarse'}
            </Button>
            <Typography variant="body2" align="center">
              ¿Ya tiene cuenta?{' '}
              <Link component={RouterLink} to="/login">
                Inicie sesión
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
