import { Box, LinearProgress, Typography } from '@mui/material';
import zxcvbn from 'zxcvbn';

export type StrengthLabel = 'Débil' | 'Intermedia' | 'Fuerte';

// Misma escala que el backend: 0-1 débil, 2 intermedia, 3-4 fuerte
export function getStrength(password: string): { score: number; label: StrengthLabel } {
  const { score } = zxcvbn(password);
  if (score <= 1) return { score, label: 'Débil' };
  if (score === 2) return { score, label: 'Intermedia' };
  return { score, label: 'Fuerte' };
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = getStrength(password);
  const color = label === 'Débil' ? 'error' : label === 'Intermedia' ? 'warning' : 'success';
  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={((score + 1) / 5) * 100}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" sx={{ color: `${color}.main` }}>
        Contraseña {label.toLowerCase()}
      </Typography>
    </Box>
  );
}
