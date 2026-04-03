---
{
  "title": "DROP WORKLOAD GROUP",
  "description": "このステートメントはworkload groupを削除するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、ワークロードグループを削除するために使用されます。

## 構文

```sql
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>'
```
## 例

1. g1という名前のワークロードグループを削除する：

    ```sql
    drop workload group if exists g1;
    ```
