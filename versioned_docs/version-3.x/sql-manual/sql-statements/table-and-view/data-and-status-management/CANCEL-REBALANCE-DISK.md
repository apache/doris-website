---
{
    "title": "CANCEL REBALANCE DISK",
    "language": "en"
}

---

## Description

The `CANCEL REBALANCE DISK` statement is used to cancel the high-priority disk data balancing for Backend (BE) nodes. This statement has the following functionalities:

- It can cancel the high-priority disk balancing for specified BE nodes.
- It can cancel the high-priority disk balancing for all BE nodes in the entire cluster.
- After cancellation, the system will still balance the disk data of BE nodes using the default scheduling method.

## Syntax

```sql
ADMIN CANCEL REBALANCE DISK [ ON ( "<host>:<port>" [, ... ] ) ];
```

## Optional Parameters

**1. `"<host>:<port>"`**

> Specifies the list of BE nodes for which the high-priority disk balancing needs to be canceled.
>
> Each node consists of a hostname (or IP address) and a heartbeat port.
>
> If this parameter is not specified, it will cancel the high-priority disk balancing for all BE nodes.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege       | Object      | Notes                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | System      | The user must have ADMIN privileges to execute this command. |

## Usage Notes

- This statement only indicates that the system will no longer prioritize balancing the disk data of specified BEs; however, the system will still balance BE's disk data using the default scheduling method.
- After executing this command, any previously set high-priority balancing strategy will become immediately invalid.

## Examples

- Cancel high-priority disk balancing for all BEs in the cluster:

    ```sql
    ADMIN CANCEL REBALANCE DISK;
    ```

- Cancel high-priority disk balancing for specified BEs:

```sql
ADMIN CANCEL REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");
```
