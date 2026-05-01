---
{
    "title": "TSO Action",
    "language": "en",
    "description": "Get current TSO (Timestamp Oracle) information from the Master FE."
}
---

## Request

`GET /api/tso`

## Description

Returns the current TSO (Timestamp Oracle) information from the **Master FE**.

- This endpoint is **read-only**: it returns the current TSO value **without increasing** it.
- Authentication is required. Use an account with **administrator privileges**.
- This endpoint is useful for observing the current TSO window end, physical time part, and logical counter part.
- This endpoint is only a snapshot of current state. It does not guarantee that a later transaction can always obtain a new TSO.

## Path parameters

None.

## Query parameters

None.

## Request body

None.

## Response

On success, the response body has `code = 0` and the `data` field contains:

| Field | Type | Description |
| --- | --- | --- |
| window_end_physical_time | long | The end physical time (ms) of the current TSO window on the Master FE. |
| current_tso | long | The current composed 64-bit TSO value. |
| current_tso_physical_time | long | The extracted physical time part (ms) from `current_tso`. |
| current_tso_logical_counter | long | The extracted logical counter part from `current_tso`. |

Interpretation:

- `window_end_physical_time` is the upper bound of the currently leased TSO window, not the time of the latest issued TSO.
- `current_tso_physical_time` and `current_tso_logical_counter` together describe the current global allocation cursor.
- It is normal for `window_end_physical_time` to be greater than `current_tso_physical_time`, because the window end is a pre-leased future upper bound.

Example:

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "window_end_physical_time": 1625097600000,
    "current_tso": 123456789012345678,
    "current_tso_physical_time": 1625097600000,
    "current_tso_logical_counter": 123
  }
}
```

## Errors

Common error cases include:

- FE is not ready
- Current FE is not master
- Authentication failure

## Notes

- Calling this API does not consume the logical counter.
- If the system is experiencing clock rollback or clock stall, the returned TSO may still look normal at the instant of observation, while later transaction commits can fail because FE cannot obtain a new TSO after retries.
- A single normal response only proves the current snapshot looks healthy; it is not a guarantee that later allocations will succeed.
- See [TSO](../../cluster-management/tso.md) for clock-backward behavior and [FE Configuration](../../config/fe-config.md) for related settings such as `tso_clock_backward_startup_threshold_ms` and `enable_tso_forward_when_counter_full`.
