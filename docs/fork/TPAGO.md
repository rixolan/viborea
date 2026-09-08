# Protocolo TPago (Bancard)

Fuente: [tpagodocs.bancard.com.py](https://tpagodocs.bancard.com.py/) v3.16.0 (2026-06-11).

No keys de producción. Sandbox: `https://comercios.bancard.com.py:8888`. Producción: `https://comercios.bancard.com.py` (callbacks en **443**).

La API cobra en **guaraníes enteros** (ISO 4217 PYG, exponente 0, código `600`). El schema de Bandeja sigue siendo `amount` + `currency`. El adaptador traduce; no guardamos “Gs.”.

## Flujo (v1: link de pago, no suscripción)

```
Alumno reserva (web)
  → booking status = pending_payment
  → POST generate-payment-link
       amount, description, reference_id = booking.id
  → guardar payment_link.id + link_alias
  → devolver payment_link.link_url al alumno
Alumno paga en TPago (tarjeta)
  → TPago POST /hooks/tpago  (TLS 1.2)
  → si response_code == "00"  → booking confirmed, charge paid
    si no                    → charge failed; booking sigue pending
  → responder SIEMPRE { "status": "success" }
     si no: TPago revierte el cobro al alumno
```

Canal `whatsapp` usa el mismo `reference_id`. Un solo schedule.

No usar suscripciones TPago para packs en v1. Pack = entitlement nuestro + un link por compra.

## Auth

Basic `BASE64(public_key:private_key)`. El ejemplo oficial usa **dos puntos**. Un párrafo de la doc dice “semicolon”; es un error, HTTP Basic es `:`.

Env (sandbox):

```
TPAGO_BASE_URL=https://comercios.bancard.com.py:8888
TPAGO_COMMERCE_CODE=
TPAGO_BRANCH_CODE=
TPAGO_PUBLIC_KEY=
TPAGO_PRIVATE_KEY=
```

Sin esas vars el adaptador corre **dry-run** (no red).

## Endpoints que usamos

| Uso | Método | Path |
|---|---|---|
| Crear link | POST | `/external-commerce/api/0.1/commerces/{commerce}/branches/{branch}/links/generate-payment-link` |
| Callback | POST nuestro | `/hooks/tpago` |
| Reverso mismo día | PUT | `.../links/payments/revert/{payment_hook_alias}` |

## Callback

`payment.response_code === "00"` = cobrado. Status string puede ser `confirmed`.

Códigos: `0` Confirmed · `1` Failed · `2` Pending · `3` Reversed · `4` Reverse pending · `5` Reverse failed.

IPs TPago (allowlist en prod): `190.128.218.209` `190.128.232.10` `190.104.129.98` `200.85.46.226`.

Idempotencia: mismo `link_alias` dos veces no duplica confirmación.

## Tarjetas sandbox (solo :8888)

| | Número | Exp | CVV | Resultado |
|---|---|---|---|---|
| Mastercard | 5418 6301 1000 0014 | 08/26 | 277 | aprobado |
| Visa | 4907 8605 0000 0016 | 08/26 | 570 | aprobado |
| Infonet | 8601 0100 0000 0013 | 08/26 | — | rechazado |

7 rechazos/24 h o 35/30 días bloquean la tarjeta 30 días en el comercio.

## Fuera de este protocolo

Elegir TPago vs Pagopar sin comisión por escrito. Keys live. WhatsApp. Suscripciones. Stripe.
