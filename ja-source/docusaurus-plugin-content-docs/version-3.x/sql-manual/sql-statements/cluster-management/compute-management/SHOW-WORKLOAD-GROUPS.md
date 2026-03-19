---
{
  "title": "SHOW WORKLOAD GROUPS",
  "description": "この文は、現在のユーザーがusageprivの権限を持つリソースグループを表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、現在のユーザーがusage_priv権限を持つリソースグループを表示するために使用されます。

## 構文

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```
## 使用上の注意

このステートメントはワークロードグループの簡単な表示のみを行います。より複雑な表示についてはtvf workload_groups()を参照してください。

## 例

1. すべてのワークロードグループを表示する：

    ```sql
    mysql> show workload groups;
    +----------+--------+--------------------------+---------+
    | Id       | Name   | Item                     | Value   |
    +----------+--------+--------------------------+---------+
    | 10343386 | normal | cpu_share                | 10      |
    | 10343386 | normal | memory_limit             | 30%     |
    | 10343386 | normal | enable_memory_overcommit | true    |
    | 10352416 | g1     | memory_limit             | 20%     |
    | 10352416 | g1     | cpu_share                | 10      |
    +----------+--------+--------------------------+---------+
    ```
2. パターンを使用したワークロードグループの表示

    ```sql
    mysql> show workload groups like "normal%";
    +----------+--------+--------------------------+---------+
    | Id       | Name   | Item                     | Value   |
    +----------+--------+--------------------------+---------+
    | 10343386 | normal | cpu_share                | 10      |
    | 10343386 | normal | memory_limit             | 30%     |
    | 10343386 | normal | enable_memory_overcommit | true    |
    +----------+--------+--------------------------+---------+
    ```
