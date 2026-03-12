---
{
    "title": "Timestamp Oracle (TSO)",
    "language": "en",
    "description": "Timestamp Oracle (TSO) provides globally monotonic timestamps for Doris."
}
---

## Overview

Timestamp Oracle (TSO) is a service running on the **Master FE** that generates **globally monotonic** 64-bit timestamps. Doris uses TSO as a unified version reference in distributed scenarios, avoiding the correctness risks caused by physical clock skew across nodes.

Typical use cases include:

- A unified “transaction version” across multiple tables and nodes.
- Incremental processing / version-based reads using a single global ordering.
- Better observability: a timestamp is easier to interpret than an internal version counter.

## Timestamp Format

TSO is a 64-bit integer:

- High bits: **physical time (milliseconds)** since Unix epoch
- Low bits: **logical counter** for issuing multiple unique timestamps within the same millisecond

The core guarantee of TSO is **monotonicity**, not being an exact wall clock.

## Architecture and Lifecycle

- **Master FE** hosts the `TSOService` daemon.
- FE components (for example, transaction publish and metadata repair flows) obtain timestamps from `Env.getCurrentEnv().getTSOService().getTSO()`.
- The service uses a **time window lease** (window end physical time) to reduce persistence overhead while ensuring monotonicity across master failover.

### Monotonicity Across Master Failover

On master switch, the new Master FE replays the persisted window end and calibrates the initial physical time to ensure the first TSO it issues is strictly greater than any TSO issued by the previous master.

## Configuration

TSO is controlled by FE configuration items (see [FE Configuration](../config/fe-config.md) for how to set and persist configs):

- `enable_feature_tso`
- `tso_service_update_interval_ms`
- `max_update_tso_retry_count`
- `max_get_tso_retry_count`
- `tso_service_window_duration_ms`
- `tso_time_offset_debug_mode` (test only)
- `enable_tso_persist_journal` (may affect rollback compatibility)
- `enable_tso_checkpoint_module` (may affect older versions reading newer images)

## Observability and Debugging

### FE HTTP API

You can fetch the current TSO without consuming the logical counter via FE HTTP API:

- `GET /api/tso`

See [TSO Action](../open-api/fe-http/tso-action.md) for authentication, response fields, and examples.

### System Table: `information_schema.rowsets`

When enabled, Doris records the commit TSO into rowset metadata and exposes it via:

- `information_schema.rowsets.COMMIT_TSO`

See [rowsets](../system-tables/information_schema/rowsets.md).

## FAQ

### Can I treat TSO as a wall clock?

No. Although the physical part is in milliseconds, the physical time may be advanced proactively (for example, to handle high logical counter usage), so TSO should be used as a **monotonic version** rather than a precise wall clock.
