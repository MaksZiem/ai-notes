import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const BEARER_AUTH = 'access-token';

const TITLE = 'AI Notes API';

const DESCRIPTION = `REST API aplikacji do notatek i projektów z funkcjami AI (pisanie, streszczenia, wyszukiwanie semantyczne, czat z notatkami, agent).

## Autoryzacja
Większość endpointów wymaga tokenu JWT w nagłówku \`Authorization: Bearer <token>\`.
Token zwracają **POST /auth/signup** i **POST /auth/signin**.
Kliknij **Authorize** i wklej sam token (bez słowa "Bearer"), aby wywoływać chronione endpointy z tego widoku.

## Uprawnienia
Dostęp do projektów i notatek ma poziomy **VIEW < EDIT < DELETE**. Nadaje się je członkom projektu, członkom pojedynczej notatki lub przez link udostępniania. Właściciel i admin mają pełny dostęp.

## Format błędów
Każdy błąd ma spójny format JSON:
\`\`\`json
{
  "statusCode": 403,
  "code": "ACCESS_LEVEL_REQUIRED",
  "message": "Required access level: EDIT, your level: VIEW",
  "params": { "required": "EDIT", "current": "VIEW" }
}
\`\`\`
- \`code\` to stały identyfikator błędu, na podstawie którego frontend wyświetla przetłumaczony komunikat (PL/EN), a \`params\` zawiera wartości do wstawienia w ten komunikat.
- \`message\` jest po angielsku i służy do debugowania.
- Błędy walidacji (400) zwracają w \`message\` tablicę komunikatów, po jednym na każde niepoprawne pole.

## Limity AI
Endpointy AI korzystają z darmowego limitu Gemini. Po jego wyczerpaniu zwracają 429 z kodem \`AI_QUOTA_EXCEEDED\`.

## Język AI
AI odpowiada w języku notatki lub pytania.`;

const TAGS: [string, string][] = [
  ['auth', 'Rejestracja, logowanie i konta użytkowników'],
  ['projects', 'Projekty, ich członkowie i zaproszenia'],
  ['notes', 'Notatki, członkowie notatek i linki udostępniania'],
  ['project-invites', 'Podgląd i akceptacja zaproszeń do projektu'],
  ['shared-notes', 'Notatki udostępnione linkiem, także bez konta'],
  ['notifications', 'Powiadomienia i zaproszenia użytkownika'],
  [
    'ai',
    'Pisanie z pomocą AI: generowanie, przepisywanie, tytuły, słowa kluczowe',
  ],
  ['agent', 'Agent AI, który wykonuje polecenia na notatkach i projektach'],
  ['uploads', 'Wgrywanie obrazów do treści notatek'],
  ['health', 'Stan aplikacji dla monitoringu i reverse proxy'],
];

export function setupSwagger(app: INestApplication): void {
  const builder = new DocumentBuilder()
    .setTitle(TITLE)
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT z /auth/signin lub /auth/signup',
      },
      BEARER_AUTH,
    );

  for (const [name, description] of TAGS) {
    builder.addTag(name, description);
  }

  const document = SwaggerModule.createDocument(app, builder.build(), {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: `${TITLE} Docs`,
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
