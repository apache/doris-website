---
{
    "title": "Meta Service Configuration",
    "language": "en",
    "description": "Types, defaults, runtime mutability, and effects of Meta Service configuration options in compute-storage decoupled mode."
}
---

This page lists Meta Service configuration options added in 4.1.5 and does not yet cover all options. Meta Service uses `doris_cloud.conf`; these options do not belong in the FE's `fe.conf` or the BE's `be.conf`.

## Transaction management

### `enable_get_prepare_txn_by_coordinator_by_running_key`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Changeable at runtime | Yes |
| Version | Added in 4.1.5 |

Controls how Meta Service scans for prepared transactions belonging to a coordinator. By default, it scans the running-transaction index first, then retrieves the corresponding transaction information, avoiding a scan of all transaction records. Set it to `false` to scan transaction information records directly. Both approaches use the same transaction selection criteria and return the same results. Keep the default unless you need to change the scan strategy.

To set the option explicitly, add the following to Meta Service's `doris_cloud.conf`:

```properties
enable_get_prepare_txn_by_coordinator_by_running_key = true
```
