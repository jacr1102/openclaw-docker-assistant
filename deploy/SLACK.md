# Slack + OpenClaw (gateway en Docker)

Guía para conectar una **Slack app** al gateway OpenClaw en modo **Socket Mode**, alinear **permisos (scopes)**, **suscripción a eventos**, variables en el servidor y el flujo de **pairing** en DM.

Documentación oficial de referencia: [Slack | OpenClaw Docs](https://openclaw.im/docs/channels/slack).

No commitees tokens ni pegues secretos en issues o capturas públicas.

---

## 1. Crear la app en Slack

1. Abre [https://api.slack.com/apps](https://api.slack.com/apps) e inicia sesión.
2. **Create New App** → **From scratch** (nombre libre, workspace de desarrollo o producción).
3. Evita depender solo de plantillas tipo “Assistant / debugger” si no vas a usar el producto Slack Assistant: para OpenClaw necesitas un **bot** con scopes estándar en **Bot Token Scopes**, no solo `assistant:write`.

---

## 2. Socket Mode y App-Level Token (`xapp-…`)

1. **Settings → Socket Mode** → activar.
2. **App-Level Tokens → Generate**:
   - Nombre descriptivo (p. ej. `socket`).
   - Scope: **`connections:write`**.
3. Copia el token que empieza por **`xapp-`**. En el servidor irá en **`SLACK_APP_TOKEN`** (ver sección Docker).

---

## 3. Usuario bot y pestaña de mensajes (DM)

1. **App Home** → habilita la pestaña **Messages** / permitir que los usuarios envíen mensajes a la app (necesario para DM al bot).
2. Si al instalar Slack dice que **no hay bot user**, suele faltar esto o **Bot Token Scopes** (siguiente sección).

---

## 4. Permisos OAuth — Bot Token Scopes (obligatorio)

Los permisos deben estar en **OAuth & Permissions → Bot Token Scopes**, no sustituirlos solo por **User Token Scopes**. El **Bot User OAuth Token** (`xoxb-…`) es el que usa OpenClaw para actuar como bot.

Añade al menos estos scopes de **bot** (búscalos por nombre exacto en el panel):

| Scope | Uso típico |
|--------|------------|
| `chat:write` | Enviar y actualizar mensajes |
| `im:write` | Abrir / escribir en DM |
| `channels:history` | Historial en canales públicos |
| `groups:history` | Historial en canales privados |
| `im:history` | Historial en DM |
| `mpim:history` | Historial en mensajes grupales |
| `channels:read` | Info de canales públicos |
| `groups:read` | Info de canales privados |
| `im:read` | Info de DM |
| `mpim:read` | Info de conversaciones grupales |
| `users:read` | Resolver usuarios |
| `app_mentions:read` | Menciones al bot |
| `reactions:read` | Leer reacciones |
| `reactions:write` | Añadir reacciones |
| `pins:read` | Listar pins |
| `pins:write` | Fijar / quitar pins |
| `emoji:read` | Lista de emoji personalizados |
| `files:write` | Subida de archivos |
| `commands` | Si usarás slash commands definidos en la app |

Tras añadir o cambiar scopes: **Install to Workspace** / **Reinstall to Workspace** y autoriza de nuevo. Si Slack rota el token, copia el nuevo **Bot User OAuth Token** (`xoxb-…`).

**Notas:**

- **`assistant:write`** es para el flujo Slack Assistant / App Agent; **no** reemplaza la lista anterior para el conector OpenClaw habitual.
- **`chat:write`** solo en **User Token Scopes** no basta: el bot usa **`xoxb-`** y scopes de **bot**.

### User OAuth Token (`xoxp-…`) — opcional

No es necesario para el arranque básico. OpenClaw lo documenta como opcional (`userToken`) para lecturas con identidad de usuario. No lo pongas en **`SLACK_BOT_TOKEN`**.

---

## 5. Event Subscriptions (imprescindible)

Sin esto, el gateway puede mostrar *socket mode connected* pero **no recibir mensajes**.

1. **Event Subscriptions** → **Enable Events** → **On**.
2. **Subscribe to bot events** → añade:

   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`
   - `app_mention`
   - `reaction_added`
   - `reaction_removed`
   - `member_joined_channel`
   - `member_left_channel`
   - `channel_rename`
   - `pin_added`
   - `pin_removed`

   Si la UI ofrece un evento agregado tipo `message.*` que cubra varios tipos de mensaje, puedes usarlo según la documentación de Slack y OpenClaw.

3. Guarda los cambios.

Con **Socket Mode**, el transporte va por el socket; no necesitas una URL pública de eventos para el mismo fin que en HTTP mode.

**No hace falta reiniciar contenedores** solo por cambiar eventos en Slack. Sí actualiza el servidor si cambias **tokens** en `.env`.

---

## 6. Tokens: qué va dónde

| Token | Prefijo | Variable en servidor (recomendado) |
|--------|---------|-------------------------------------|
| App (Socket Mode) | `xapp-` | `SLACK_APP_TOKEN` |
| Bot | `xoxb-` | `SLACK_BOT_TOKEN` |
| User (opcional) | `xoxp-` | Solo si configuras `userToken` en `openclaw.json` según la doc; **no** en `SLACK_BOT_TOKEN` |

---

## 7. Docker y variables en el servidor

El `docker-compose.prod.yml` de este repo pasa **`SLACK_APP_TOKEN`** y **`SLACK_BOT_TOKEN`** al servicio `openclaw-gateway` y a `openclaw-cli`.

1. En **`.env.prod`** (no commitear), define:

   ```bash
   SLACK_APP_TOKEN=xapp-...
   SLACK_BOT_TOKEN=xoxb-...
   ```

2. Docker Compose usa por defecto **`.env`** en el directorio del compose para sustituir `${SLACK_*:-}`. El flujo de deploy del repo **fusiona** `.env.prod` en `.env` (primero `IMAGE_OPENCLAW`, luego el resto de `.env.prod`). Si editas solo `.env.prod`, regenera `.env` con el mismo criterio o usa `docker compose --env-file .env --env-file .env.prod …` según [deploy/README.md](./README.md).

3. **`IMAGE_OPENCLAW`** debe apuntar a la imagen real en el registro (no un placeholder). Si el paquete GHCR es privado, haz `docker login ghcr.io` en el servidor.

4. Recrear contenedores tras cambiar `.env` o compose:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --force-recreate
   ```

5. Comprobación **sin** exponer secretos:

   ```bash
   docker compose -f docker-compose.prod.yml exec openclaw-gateway sh -c 'echo "app_len=${#SLACK_APP_TOKEN} bot_len=${#SLACK_BOT_TOKEN}"'
   ```

   Ambos valores deben ser **mayores que 0**.

---

## 8. `openclaw.json` (configuración completa)

En el directorio de configuración del host (`OPENCLAW_CONFIG_DIR`, montado como `/home/node/.openclaw` en el contenedor), edita **`openclaw.json`**.

### Mínimo para activar Slack

Los tokens suelen ir por entorno (`SLACK_APP_TOKEN`, `SLACK_BOT_TOKEN`); en el JSON basta con activar el canal:

```json
"channels": {
  "slack": {
    "enabled": true,
    "mode": "socket"
  }
}
```

No hace falta pegar los mismos tokens en la Control UI si el contenedor ya los recibe por variables.

### Política de canales: `groupPolicy` (muy importante)

OpenClaw puede usar **`channels.slack.groupPolicy`**:

| Valor | Comportamiento típico |
|--------|------------------------|
| **`open`** | Los canales donde el bot esté invitado pueden usarse (sujeto a menciones y reglas de grupo). |
| **`allowlist`** | Solo se procesan canales **listados** en `channels.slack.channels`. |
| **`disabled`** | Desactiva el manejo de canales de grupo (ver doc). |

**Fallo frecuente:** `"groupPolicy": "allowlist"` con **`"channels": {}` vacío**. En ese caso **ningún canal** está en la lista blanca: el bot **no responderá en canales** aunque Socket Mode y los tokens estén bien.

**Opciones:**

1. **Pruebas o pocos canales restringidos:** usa lista blanca y rellena entradas (ID `C…`, o nombre tipo `#nombre-canal` si la doc/OpenClaw lo resuelve):

   ```json
   "channels": {
     "slack": {
       "enabled": true,
       "mode": "socket",
       "groupPolicy": "allowlist",
       "channels": {
         "C0123456789": { "allow": true, "requireMention": true }
       }
     }
   }
   ```

2. **Workspace de confianza / pruebas rápidas:** deja política abierta:

   ```json
   "channels": {
     "slack": {
       "enabled": true,
       "mode": "socket",
       "groupPolicy": "open",
       "channels": {}
     }
   }
   ```

Ajusta **`requireMention`**, **`dm`**, etc. según [Slack | OpenClaw Docs](https://openclaw.im/docs/channels/slack).

### Control UI (Slack en el dashboard)

Campos como **Capabilities** (JSON), **Channels → custom entries**, **Slack Config Writes** o **Chunk mode** son opcionales o avanzados. **No** son el sustituto de tener `groupPolicy` y lista de canales coherentes: si el bot no habla en un canal, revisa primero **`groupPolicy`** y **`channels.slack.channels`**, no solo toggles en la UI.

### Tras editar `openclaw.json`

Reinicia el gateway para cargar la config de forma fiable:

```bash
docker compose -f docker-compose.prod.yml restart openclaw-gateway
```

(Desde el directorio donde está `docker-compose.prod.yml`.)

**Seguridad:** no compartas en chats ni issues el contenido de `gateway.auth.token` ni otros secretos; rota el token si se expuso.

---

## 9. Pairing en DM (primer contacto)

Por defecto, la política de DM suele ser **pairing**: el primer mensaje a la app puede responder con un **código** y el texto pide aprobar acceso.

**La aprobación se hace en el servidor con el CLI**, no escribiendo “listo” en Slack. En el servidor, desde el directorio del compose:

```bash
docker compose -f docker-compose.prod.yml run --rm openclaw-cli pairing approve slack <CÓDIGO_QUE_MUESTRA_EL_BOT>
```

Usa el código actual que muestre Slack (caduca). Tras aprobar, los DM suelen seguir funcionando tras **reinicios del contenedor** mientras persista el volumen de config.

Para entornos donde aceptes abrir DMs sin aprobación (menos restrictivo), la doc de OpenClaw describe `channels.slack.dm.policy` y `allowFrom`; úsalo solo si entiendes el riesgo.

---

## 10. Comprobar que Slack entrega eventos

1. Logs del gateway:

   ```bash
   docker compose -f docker-compose.prod.yml logs -f openclaw-gateway
   ```

   Debes ver líneas como **`[slack] socket mode connected`**. Al escribir en Slack deberían aparecer entradas relacionadas con Slack (según nivel de log).

2. Dentro del contenedor, el proceso puede escribir en **`/tmp/openclaw/openclaw-*.log`** (ruta indicada al arrancar el gateway).

---

## 11. Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| `len=0` para `SLACK_*` en el contenedor | `.env` fusionado, compose con `SLACK_*` en `environment`, recrear contenedores |
| Socket OK pero nada al hablar | **Event Subscriptions** desactivados o sin eventos de bot suscritos |
| Solo `assistant:write` en bot | Añadir scopes de bot de la tabla; reinstalar app |
| DM con código “pairing” | Ejecutar `pairing approve` en el **servidor** (no basta con escribir en Slack) |
| **Canales:** bot conectado pero **silencio total** en `#…` | **`groupPolicy: "allowlist"` + `channels: {}`** → añade canales a la lista o usa `"groupPolicy": "open"` |
| Canal sin respuesta | Bot invitado al canal; **`@mención`** si `requireMention: true`; allowlist |
| Webchat/Control UI OK, Slack no | Suele ser **pairing**, **allowlist** o **eventos** Slack, no la API key del modelo |

---

## 12. Referencias

- [Slack | OpenClaw Docs](https://openclaw.im/docs/channels/slack)
- [Deploy general del servidor](./README.md)
