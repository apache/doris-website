---
{
    "title": "TSO Action",
    "language": "en",
    "description": "Inspect TSO state with master forwarding or local status."
}
---

<version since="dev">

</version>

## Description

Returns a snapshot of TSO state without allocating a timestamp or incrementing the logical counter. Valid Doris user authentication is required. A non-master FE forwards the request to the Master FE by default; `local=true` returns the receiving FE's local state. See [TSO](../../cluster-management/tso.md) for prerequisites.

## Request

`GET /api/tso`

## Parameters

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `local` | boolean | No | `false` | When true, skips master forwarding and queries the receiving FE's local state. |

There are no path parameters or request body.

## Example

Using the default HTTP port, prompt for the password:

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

Illustrative response (timestamps depend on the running cluster):

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "window_end_physical_time": 1625097601000,
    "current_tso": 426009585254400123,
    "current_tso_physical_time": 1625097600000,
    "current_tso_logical_counter": 123
  }
}
```

## Response fields

| Field | Type | Description |
| --- | --- | --- |
| `window_end_physical_time` | long | Reserved allocation-window boundary, in Unix milliseconds. |
| `current_tso` | long | Current composed 64-bit allocation cursor. |
| `current_tso_physical_time` | long | Physical component of current_tso, in milliseconds. |
| `current_tso_logical_counter` | long | Logical counter component of current_tso. |

## Errors and caveats

Authentication failure, an unready FE, or forwarding failure can prevent a successful response. An uninitialized local service may return zero values; a snapshot does not guarantee subsequent allocations will succeed. Only the active master allocates TSOs, but any ready FE can receive status requests. The window boundary normally leads the current physical component because it reserves a future allocation window.
