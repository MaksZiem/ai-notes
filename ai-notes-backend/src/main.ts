import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { UPLOAD_DIR } from './uploads/uploads.controller';
import { setupSwagger } from './common/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads/' });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  (app as any).set('etag', false);
  app.use((req, res, next) => {
    res.removeHeader('x-powered-by');
    res.removeHeader('date');
    next();
  });

  setupSwagger(app);

  await app.listen(3000);
}
bootstrap();
