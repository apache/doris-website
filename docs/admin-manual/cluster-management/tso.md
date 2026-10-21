---
{
    "title": "Timestamp Oracle (TSO)",
    "language": "en",
    "description": "TSO configuration, status inspection, recovery, and clock-rollback behavior."
}
---

<version since="dev">

</version>

## Overview

Timestamp Oracle (TSO) allocates monotonically increasing timestamps on the Master FE, providing a global ordering reference for Doris transactions and incremental processing. It is currently available only in dev and is controlled by the FE configuration `enable_feature_changelog`, which defaults to `false`. The physical component can advance proactively, so a TSO is not an exact wall-clock reading.

## Basic usage

1. Set `enable_feature_changelog = true` in the FE configuration file `fe.conf` and restart FE. This experimental configuration cannot be changed dynamically; keep it consistent across FEs. Assess the cluster impact of enabling changelog before changing it.
2. Ensure the cluster has a ready Master FE and prepare valid Doris credentials.
3. Query the read-only status endpoint. This command uses the default HTTP port and prompts for the root password:

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

A successful response has `code = 0`; its `data` contains the allocation cursor, physical time, logical counter, and window end. Requests sent to a non-master FE are forwarded to the Master FE by default. See [TSO Action](../open-api/fe-http/tso-action.md) for a complete response example.

To inspect the local state of the FE receiving the request, use:

```bash
curl --user root 'http://127.0.0.1:8030/api/tso?local=true'
```

This call does not allocate a timestamp. Local state may be uninitialized; a non-master FE's local result does not represent the active master's allocation state.

## Timestamp format and recovery

A TSO is a 64-bit integer containing a physical component in milliseconds and an 18-bit logical counter. Within one physical millisecond, incrementing the counter makes subsequent allocations larger. The counter restarts when the physical component advances.

The Master FE reserves a future allocation window and persists its boundary together with committed TSO state. On startup or master failover, the service replays this state and calibrates a safe starting point before allocating timestamps. Persistence is part of the current implementation and does not require separate TSO journal or checkpoint switches.

## Configuration reference

These are FE configurations; see [FE Configuration](../config/fe-config.md). The base switch `enable_feature_changelog` is a `boolean`, defaults to `false`, is not mutable, and is not restricted to the Master FE.

| Parameter | Type | Default | Mutable | Master only | Description |
| --- | --- | --- | --- | --- | --- |
| `tso_service_update_interval_ms` | int | `50 ms` | false | true | Interval between allocation-window update checks. |
| `tso_max_update_retry_count` | int | `3` | true | true | Maximum attempts to update the TSO state. |
| `tso_max_get_retry_count` | int | `10` | true | true | Maximum attempts to allocate a TSO before reporting failure. |
| `tso_service_window_duration_ms` | int | `1000 ms` | true | true | Duration of the reserved allocation window; also bounds the periodic persistence interval. |
| `tso_clock_backward_startup_threshold_ms` | long | `1800000 ms` | true | true | Maximum tolerated difference between the replayed window end and the system clock during startup calibration. |
| `tso_time_offset_debug_mode` | int | `0 ms` | true | false | Clock offset for testing only; do not use for normal operation. |
| `enable_tso_forward_when_counter_full` | boolean | `true` | true | true | Advance the physical component by 1 ms when the logical counter exceeds half its capacity and wall-clock progress is insufficient. |

## Errors and caveats

- Startup calibration fails if the replayed window boundary is ahead of the system clock by more than `tso_clock_backward_startup_threshold_ms`. The service cannot safely allocate new TSOs. Check clock synchronization, persisted state, and FE logs.
- Runtime clock rollback produces warnings and metrics rather than immediately stopping the service. If physical time cannot advance, the logical counter may be exhausted; after allocation retries are exhausted, transactions that need a TSO may fail.
- `/api/tso` is a snapshot and does not consume the logical counter. Zero values or an apparently normal snapshot do not replace initialization and transaction-commit checks.
- `information_schema.rowsets.COMMIT_TSO` is a string representing a rowset TSO range, not one BIGINT. See [rowsets](../system-tables/information_schema/rowsets.md).

## Best practices

Synchronize FE clocks, inspect status with the HTTP endpoint, and use FE logs to diagnose calibration or allocation failures. Keep the debug clock offset unchanged outside deliberate tests. Enable the base switch only after assessing changelog and its dependent features; obtaining a wall-clock value alone is not a reason to enable it.
