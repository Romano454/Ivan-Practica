import { Request } from 'express';

// Con 'trust proxy' = 1, Express ya resuelve la IP real del cliente en req.ip
// sin confiar en cabeceras x-forwarded-for arbitrarias del cliente.
export function getClientIp(req: Request): string {
  return req.ip ?? 'desconocida';
}
