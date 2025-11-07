---
{
    "title": "REBALANCE DISK",
    "language": "en"
}

---

## Description

The `REBALANCE DISK` statement is used to optimize the data distribution on Backend (BE) nodes. This statement has the following functionalities:

- It can perform data balancing for specified BE nodes.
- It can balance data across all BE nodes in the entire cluster.
- It prioritizes balancing the data of specified nodes, regardless of the overall balance state of the cluster.

## Syntax

```sql
ADMIN REBALANCE DISK [ ON ( "<host>:<port>" [, ... ] ) ];
```

## Optional Parameters

**1. `"<host>:<port>"`**

> Specifies the list of BE nodes that need to be balanced.
>
> Each node consists of a hostname (or IP address) and a heartbeat port.
>
> If this parameter is not specified, it will balance all BE nodes.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege       | Object      | Notes                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | System      | The user must have ADMIN privileges to execute this command. |

## Usage Notes

- The default timeout for this command is 24 hours. After this period, the system will no longer prioritize balancing the disk data of specified BEs. To continue balancing, the command needs to be executed again.
- Once the disk data balancing for a specified BE node is completed, the high-priority setting for that node will automatically become invalid.
- This command can be executed even when the cluster is in an unbalanced state.

## Examples

- Balance data across all BE nodes in the cluster:

```sql
ADMIN REBALANCE DISK;
```

- Balance data for two specified BE nodes:

```sql
ADMIN REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");
```
