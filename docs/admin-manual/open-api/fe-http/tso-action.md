---
{
    "title": "TSO Action",
    "language": "en",
    "description": "Get current TSO (Timestamp Oracle) information from the Master FE."
}
---

# TSO Action

## Request

`GET /api/tso`

## Description

Returns the current TSO (Timestamp Oracle) information from the **Master FE**.

- This endpoint is **read-only**: it returns the current TSO value **without increasing** it.
- Authentication is required. Use an account with **administrator privileges**.

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
