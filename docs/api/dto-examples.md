# DTO examples - APP-LOGISTICA / EPP Tracker 3.0

## Estado

Estos ejemplos son documentales. No representan datos reales, no crean usuarios y no activan backend.

Los ejemplos usan `camelCase` para DTO HTTP. La base MySQL documentada usa `snake_case`.

## User safe response

No incluir `password_hash`, password plano, tokens ni secretos.

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "username": "operador.demo",
  "email": "operador@example.test",
  "name": "Operador Demo",
  "role": "operator",
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "active": true,
  "lastLoginAt": "2026-01-15T12:00:00.000Z",
  "createdAt": "2026-01-01T09:00:00.000Z",
  "updatedAt": "2026-01-15T12:00:00.000Z"
}
```

## Warehouse

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "code": "BOD-DEMO",
  "name": "Bodega Demo",
  "city": "Ciudad Demo",
  "country": "Chile",
  "active": true,
  "createdAt": "2026-01-01T09:00:00.000Z",
  "updatedAt": "2026-01-01T09:00:00.000Z"
}
```

## Worker

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "rut": "00.000.000-0",
  "name": "Trabajador Demo",
  "position": "Cargo Demo",
  "department": "Area Demo",
  "workerType": "internal",
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "active": true,
  "createdAt": "2026-01-01T09:00:00.000Z",
  "updatedAt": "2026-01-01T09:00:00.000Z"
}
```

## Inventory item

`unitCost` es dato interno opcional. No debe ser foco de vale ni reportes MVP.

```json
{
  "id": "44444444-4444-4444-8444-444444444444",
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "sku": "EPP-DEMO-001",
  "description": "Producto EPP Demo",
  "category": "Proteccion",
  "unit": "unidad",
  "size": "M",
  "quantity": 25,
  "unitCost": 0,
  "active": true,
  "createdAt": "2026-01-01T09:00:00.000Z",
  "updatedAt": "2026-01-01T09:00:00.000Z"
}
```

## Consumption create request

`projectIdLegacy` es opcional y solo para compatibilidad historica. No es obligatorio.

`requesterReference` es opcional para centro de costo / faena / area solicitante.

```json
{
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "workerId": "33333333-3333-4333-8333-333333333333",
  "requesterReference": "Faena Demo",
  "projectIdLegacy": null,
  "notes": "",
  "items": [
    {
      "inventoryItemId": "44444444-4444-4444-8444-444444444444",
      "quantity": 2
    }
  ]
}
```

## Consumption response

```json
{
  "id": "55555555-5555-4555-8555-555555555555",
  "voucherNumber": "VE-20260115-0001",
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "workerId": "33333333-3333-4333-8333-333333333333",
  "requesterReference": "Faena Demo",
  "projectIdLegacy": null,
  "deliveredByUserId": "11111111-1111-4111-8111-111111111111",
  "consumedAt": "2026-01-15T12:30:00.000Z",
  "notes": "",
  "items": [
    {
      "id": 1,
      "consumptionRecordId": "55555555-5555-4555-8555-555555555555",
      "inventoryItemId": "44444444-4444-4444-8444-444444444444",
      "skuSnapshot": "EPP-DEMO-001",
      "descriptionSnapshot": "Producto EPP Demo",
      "unitSnapshot": "unidad",
      "sizeSnapshot": "M",
      "quantity": 2,
      "unitCostSnapshot": 0
    }
  ],
  "createdAt": "2026-01-15T12:30:00.000Z",
  "updatedAt": "2026-01-15T12:30:00.000Z"
}
```

## Consumption item

`unitCostSnapshot` existe solo como dato historico interno.

```json
{
  "id": 1,
  "consumptionRecordId": "55555555-5555-4555-8555-555555555555",
  "inventoryItemId": "44444444-4444-4444-8444-444444444444",
  "skuSnapshot": "EPP-DEMO-001",
  "descriptionSnapshot": "Producto EPP Demo",
  "unitSnapshot": "unidad",
  "sizeSnapshot": "M",
  "quantity": 2,
  "unitCostSnapshot": 0,
  "createdAt": "2026-01-15T12:30:00.000Z"
}
```

## Operational report response

Reporte operativo por bodega. No se centra en proyecto ni costos.

```json
{
  "report": {
    "type": "warehouse",
    "period": {
      "from": "2026-01-01T00:00:00.000Z",
      "to": "2026-01-31T23:59:59.999Z"
    },
    "summary": [
      {
        "warehouseId": "22222222-2222-4222-8222-222222222222",
        "warehouseName": "Bodega Demo",
        "voucherCount": 1,
        "workerCount": 1,
        "distinctProductCount": 1,
        "totalQuantity": 2,
        "requesterReferences": ["Faena Demo"]
      }
    ],
    "detail": [
      {
        "voucherNumber": "VE-20260115-0001",
        "consumedAt": "2026-01-15T12:30:00.000Z",
        "warehouseName": "Bodega Demo",
        "workerName": "Trabajador Demo",
        "workerRut": "00.000.000-0",
        "sku": "EPP-DEMO-001",
        "description": "Producto EPP Demo",
        "unit": "unidad",
        "size": "M",
        "quantity": 2,
        "requesterReference": "Faena Demo"
      }
    ]
  }
}
```

## Error response estandar

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para completar el consumo.",
    "details": [
      {
        "field": "items[0].quantity",
        "message": "La cantidad solicitada supera el stock disponible."
      }
    ]
  }
}
```

## DTO notes

- Nunca devolver `password_hash`.
- Nunca devolver password plano.
- No usar correos reales en fixtures o documentacion.
- No usar la credencial demo local en ejemplos.
- `projectIdLegacy` se mantiene opcional.
- `requesterReference` se mantiene opcional.
- Costos existen solo como dato interno historico, no como foco MVP.
