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

### Monotonicity Guarantee

TSO monotonicity is guaranteed by combining three layers:

- **Within the same millisecond**: Doris keeps the physical time unchanged and increases the logical counter, so a later TSO in the same millisecond is always larger.
- **Across milliseconds**: once physical time moves forward, the logical counter is reset, so the next TSO still remains greater than previous ones.
- **Across restart or master switch**: Doris replays the persisted TSO window end and calibrates the new starting physical time to be greater than the previously persisted upper bound.

This is why Doris treats TSO as a **monotonic version generator**, not as a direct wall-clock mirror.

### Monotonicity Across Master Failover

On master switch, the new Master FE replays the persisted window end and calibrates the initial physical time to ensure the first TSO it issues is strictly greater than any TSO issued by the previous master.

### Why Only Master FE Issues TSO

Only the Master FE is allowed to issue TSO values and expose `/api/tso`.

- This avoids multiple FE nodes issuing timestamps independently.
- The active master owns both timestamp generation and persistence of the leased window end.
- After role change, the old master is not supposed to continue serving as a TSO allocator.

Without this master-only rule, Doris could not safely guarantee a single global TSO order.

### Persistence and Recovery

The key persisted state is the **window end physical time** (`windowEndTSO`), not every individual issued TSO.

- Doris leases a future time window and persists the **right boundary** of that window to EditLog.
- Persisting the window boundary is much cheaper than writing every issued timestamp while still providing a safe upper bound for recovery.
- If enabled, the checkpoint image can also store the TSO module so that recovery can restore the same boundary faster.
- During recovery, the new master replays the persisted boundary and chooses a new physical time that is greater than the historical upper bound before issuing new TSO values.

This design is what lets Doris preserve monotonicity across restart and master switch without turning every TSO allocation into a persistence operation.

### End-to-End Flow

- Master FE runs `TSOService` and allocates TSO values.
- The daemon periodically renews the time window and writes the new window end to EditLog.
- Checkpoint image can optionally persist the TSO module for faster recovery.
- After restart or master switch, Doris replays the window end and calibrates a safe new starting point.
- Transactions on tables with `enable_tso = true` record commit TSO into rowset metadata.
- `/api/tso` shows current service state, while `information_schema.rowsets.COMMIT_TSO` shows committed results written into rowsets.

## Configuration

TSO is controlled by FE configuration items (see [FE Configuration](../config/fe-config.md) for how to set and persist configs):

- `enable_tso_feature`
- `tso_service_update_interval_ms`
- `tso_max_update_retry_count`
- `tso_max_get_retry_count`
- `tso_service_window_duration_ms`
- `tso_clock_backward_startup_threshold_ms`
- `tso_time_offset_debug_mode` (test only)
- `enable_tso_persist_journal` (may affect rollback compatibility)
- `enable_tso_checkpoint_module` (may affect older versions reading newer images)
- `enable_tso_forward_when_counter_full`

## Clock Backward Behavior

TSO handles clock backward differently during startup calibration and normal runtime:

- During startup calibration, the new Master FE compares the persisted TSO window end with the current system time.
- If the backward gap exceeds `tso_clock_backward_startup_threshold_ms`, TSO initialization fails fast and the Master FE cannot safely issue new TSOs.
- During normal runtime, detecting clock backward only triggers warning logs and metrics. The service does not immediately stop.

This means a clock rollback does not always fail transactions immediately. The actual risk depends on whether physical time can move forward again before the logical counter is exhausted.

Runtime rollback detection is intentionally softer than startup calibration. During runtime, Doris prefers to keep the master available and relies on the existing monotonicity guards, logical counter, and persisted window boundary. The hard failure happens at startup calibration because that is the point where Doris must prove the next TSO can still be greater than historical values.

## Logical Counter Exhaustion

TSO uses a logical counter to generate multiple timestamps within the same millisecond. If physical time cannot advance for a while, the service keeps consuming the logical counter under the same physical millisecond.

- When the logical counter reaches its limit, `getTSO()` retries according to `tso_max_get_retry_count`.
- If retries are exhausted before a new physical millisecond becomes available, TSO allocation fails.
- Transactions that need a commit TSO may then fail because FE cannot obtain a valid TSO.

This is the main reason clock rollback can eventually surface as transaction errors even though runtime rollback detection itself is not a hard-stop mechanism.

## Configuration Impact

- `tso_clock_backward_startup_threshold_ms`: only affects startup calibration. It defines how much backward clock drift is tolerated before TSO initialization fails.
- `enable_tso_forward_when_counter_full`: when enabled, the TSO service proactively advances physical time by 1ms once the logical counter becomes high, which helps reduce the chance of hitting the logical counter limit.
- `enable_tso_forward_when_counter_full = false`: the service depends more strictly on real wall-clock progress and does not proactively advance physical time. Under clock stall or rollback, logical-counter exhaustion is more likely.
- `tso_max_get_retry_count`: controls how many retries FE performs before returning a TSO allocation failure.
- `tso_service_update_interval_ms`: affects how often the daemon checks clock conditions and refreshes the TSO window.
- `enable_tso_persist_journal`: is the persistence foundation that allows restart or master switch to resume from a safe upper bound instead of risking rollback.
- `enable_tso_checkpoint_module`: affects whether checkpoint image also carries the TSO boundary for faster recovery; it does not change the runtime allocation algorithm.

## Observability and Debugging

### FE HTTP API

You can fetch the current TSO without consuming the logical counter via FE HTTP API:

- `GET /api/tso`

The response is a read-only snapshot of the current TSO state, including the current logical counter and the current window end. It is useful for observation, but it does not guarantee that future transactions will always be able to obtain a new TSO.

`window_end_physical_time` is the leased upper bound of the current TSO window, while `current_tso` represents the current allocation cursor. It is normal for the window end to be ahead of the current TSO physical time.

See [TSO Action](../open-api/fe-http/tso-action.md) for authentication, response fields, examples, and caveats.

### System Table: `information_schema.rowsets`

When enabled, Doris records the commit TSO into rowset metadata and exposes it via:

- `information_schema.rowsets.COMMIT_TSO`

This requires both FE-level `enable_tso_feature = true` and table-level `enable_tso = true`.

Table-level `enable_tso` only controls whether commit TSO is recorded for that table. It does not change how `TSOService` allocates timestamps or how monotonicity is protected.

See [rowsets](../system-tables/information_schema/rowsets.md).

## FAQ

### Can I treat TSO as a wall clock?

No. Although the physical part is in milliseconds, the physical time may be advanced proactively (for example, to handle high logical counter usage), so TSO should be used as a **monotonic version** rather than a precise wall clock.

### Why can transactions fail during clock rollback?

Clock rollback during runtime only raises warnings and metrics, but it can keep TSO in the same physical millisecond for longer than expected. If the logical counter is consumed faster than physical time recovers, FE may fail to obtain a new TSO after `tso_max_get_retry_count` retries, and transactions that require commit TSO may fail.
