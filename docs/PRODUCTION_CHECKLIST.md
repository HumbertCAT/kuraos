# TherapistOS Production Deployment Checklist

## Pre-Deployment

### 1. Environment Variables (`.env.production`)

| Variable | Acción | Comando/Valor |
|----------|--------|---------------|
| `SECRET_KEY` | Generar nuevo | `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Password fuerte | Usar password manager |
| `DATABASE_URL` | Actualizar | Cambiar password en URL |
| `BACKEND_CORS_ORIGINS` | Añadir dominio | `https://app.therapistos.com` |
| `NEXT_PUBLIC_API_URL` | URL producción | `https://api.therapistos.com` |

### 2. Stripe (Modo Live)

| Variable | Cambio |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` → `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` → `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Crear nuevo webhook en Dashboard Live |
| `STRIPE_PRICE_ID_*` | Crear productos en modo Live |

### 3. Twilio WhatsApp

| Variable | Acción |
|----------|--------|
| `TWILIO_*` | Mantener si usas Twilio en producción |
| Webhook URL | Cambiar de ngrok a URL producción |

**Alternativa:** Migrar a Meta Cloud API con tu número Business.

### 4. SSL/HTTPS

- [ ] Certificado SSL para API
- [ ] Certificado SSL para Frontend
- [ ] Forzar HTTPS en nginx/load balancer

### 5. Database

- [ ] Backup strategy configurada
- [ ] Migrations aplicadas: `alembic upgrade head`
- [ ] Índices verificados

---

## Deployment

```bash
# 1. Build producción
docker-compose -f docker-compose.prod.yml build

# 2. Aplicar migraciones
docker-compose exec backend alembic upgrade head

# 3. Verificar salud
curl https://api.therapistos.com/health
```

---

## Post-Deployment

- [ ] Verificar login/registro
- [ ] Verificar pagos Stripe (modo live)
- [ ] Verificar webhook WhatsApp
- [ ] Verificar análisis AletheIA
- [ ] Configurar monitorización (Sentry, etc.)
