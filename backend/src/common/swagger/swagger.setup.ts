import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SESSION_AUTH = 'session-cookie';

const TITLE = 'AI Notes API';

const DESCRIPTION = `REST API aplikacji do notatek i projektów z funkcjami AI (pisanie, streszczenia, wyszukiwanie semantyczne, czat z notatkami, agent).

## Autoryzacja
Sesja jest trzymana w cookie \`notes_session\` (httpOnly, SameSite=Lax, ważne 7 dni).
Cookie ustawiają **POST /auth/signup** i **POST /auth/signin**, a usuwa je **POST /auth/signout**.
Po zalogowaniu z tego widoku (Try it out na /auth/signin) chronione endpointy działają od razu, bo przeglądarka sama dołącza cookie.

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
- Błędy walidacji danych wejściowych mają kod \`VALIDATION_FAILED\` i zwracają w \`message\` tablicę komunikatów, po jednym na każde niepoprawne pole.
- Identyfikator w ścieżce, który nie jest UUID, daje błąd 400 z kodem \`INVALID_ID\` (\`params.param\` to nazwa parametru).
- Błędy bez własnego kodu (np. nieistniejąca ścieżka) dostają kod z nazwy statusu HTTP, np. \`NOT_FOUND\`.

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
    .addCookieAuth(
      'notes_session',
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'Cookie sesji ustawiane przez /auth/signin lub /auth/signup',
      },
      SESSION_AUTH,
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
