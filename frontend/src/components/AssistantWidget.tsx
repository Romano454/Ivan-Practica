import { useEffect, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { assistantApi, type ChatMessage } from '../api/assistant';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'Hola, soy el asistente de MediCitas. Puedo responder sobre las citas de hoy, citas pendientes, doctores y pacientes.',
};

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const history = [...messages, { role: 'user' as const, content }];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      // El saludo inicial no se envía: el historial empieza en el primer mensaje del usuario
      const { reply } = await assistantApi.chat(history.slice(1).slice(-10));
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([
        ...history,
        {
          role: 'assistant',
          content: 'No pude responder en este momento, intente nuevamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: 340,
            height: 440,
            display: 'flex',
            flexDirection: 'column',
            zIndex: (t) => t.zIndex.drawer + 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SmartToyIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Asistente MediCitas
            </Typography>
            <IconButton size="small" color="inherit" onClick={() => setOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5, bgcolor: 'background.default' }}>
            <Stack spacing={1}>
              {messages.map((m, i) => (
                <Box
                  key={i}
                  sx={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: m.role === 'user' ? 'primary.main' : 'background.paper',
                    color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    whiteSpace: 'pre-line',
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="body2">{m.content}</Typography>
                </Box>
              ))}
              {loading && (
                <Box sx={{ alignSelf: 'flex-start', px: 1.5, py: 1 }}>
                  <CircularProgress size={18} />
                </Box>
              )}
              <div ref={bottomRef} />
            </Stack>
          </Box>
          <Box sx={{ p: 1, display: 'flex', gap: 1, borderTop: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Escriba su pregunta…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <IconButton color="primary" onClick={() => void send()} disabled={loading}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: (t) => t.zIndex.drawer + 2 }}
        onClick={() => setOpen((v) => !v)}
        title="Asistente"
      >
        <SmartToyIcon />
      </Fab>
    </>
  );
}
