import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './lib/logger';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/error';

const app = express();
// Não anuncia que a app é Express (reduz fingerprinting)
app.disable('x-powered-by');

// Segurança e parsing
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Raiz redireciona para health (conveniência)
app.get('/', (_req, res) => res.redirect('/api/v1/health'));

// API versionada
app.use('/api/v1', routes);

// 404 e tratador de erro (sempre no final)
app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 API rodando em http://localhost:${env.PORT}/api/v1`);
  logger.info(`   Health: http://localhost:${env.PORT}/api/v1/health`);
  logger.info(`   Ambiente: ${env.NODE_ENV}`);
});

// Encerramento gracioso
const shutdown = (signal: string) => {
  logger.info(`${signal} recebido, encerrando servidor...`);
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Encerramento forçado após timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Promise rejeitada sem tratamento');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Exceção não capturada');
  process.exit(1);
});