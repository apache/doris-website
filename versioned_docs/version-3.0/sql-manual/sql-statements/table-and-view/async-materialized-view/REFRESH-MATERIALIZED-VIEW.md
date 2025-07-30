---
{
    "title": "REFRESH MATERIALIZED VIEW",
    "language": "en"
}
---

## Description

This statement is used to manually refresh the specified asynchronous materialized view

## Syntax

```sql
REFRESH MATERIALIZED VIEW <mv_name> <refresh_type>
```

Where:
```sql
refresh_type
  : { <partitionSpec> | COMPLETE | AUTO }
```

```sql
partitionSpec
  : PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
```

## Required Parameters

**1. `<mv_name>`**
> Specifies the materialized view name.
>
> The materialized view name must start with a letter character (or any language character if unicode name support is enabled) and cannot contain spaces or special characters unless the entire materialized view name string is enclosed in backticks (e.g., `My Object`).
>
> The materialized view name cannot use reserved keywords.
>
> For more details, see Reserved Keywords.

**2. `<refresh_type>`**
> Specifies the refresh type of this materialized view.
>
> The refresh type may be one of the partitionSpec, COMPLETE or AUTO.

## Optional Parameters

**1. `<partition_name>`**
> Specifies the partition name when refresh the partition
>

## Access Control Requirements
Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | Materialized View  | REFRESH is an ALTER operation on a materialized view |


## Usage Notes

- AUTO: The calculation will determine which partitions of the materialized view are not synchronized with the base table. (Currently, if the base table is an external table, it is considered to be always synchronized with the materialized view. Therefore, if the base table is an external table, it is necessary to specify `COMPLETE` or designate the partitions to be refreshed), and then proceed to refresh the corresponding partitions accordingly.
- COMPLETE: It will forcibly refresh all partitions of the materialized view without checking whether the partitions are synchronized with the base table.
- partitionSpec: It will forcibly refresh the specified partitions without checking whether the partitions are synchronized with the base table.

## Examples

- Refresh materialized view mv1 (automatically calculate the partition to be refreshed)

    ```sql
    REFRESH MATERIALIZED VIEW mv1 AUTO;
    ```


- Refresh partition named p_19950801_19950901 and p_19950901_19951001

    ```sql
    REFRESH MATERIALIZED VIEW mv1 partitions(p_19950801_19950901,p_19950901_19951001);
    ```


- Force refresh of all materialized view data

    ```sql
    REFRESH MATERIALIZED VIEW mv1 complete;
    ```
