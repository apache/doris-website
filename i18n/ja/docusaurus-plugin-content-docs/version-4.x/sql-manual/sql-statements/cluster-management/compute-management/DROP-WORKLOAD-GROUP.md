---
{
  "title": "DROP WORKLOAD GROUP",
  "description": "この文はワークロードグループを削除するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、ワークロードグループを削除するために使用されます。

## 構文

```sql
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>'
```
## Examples

1. g1という名前のワークロードグループを削除する：

    ```sql
    drop workload group if exists g1;
    ```
