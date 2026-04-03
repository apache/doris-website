---
{
  "title": "ALTER WORKLOAD GROUP",
  "language": "ja",
  "description": "このステートメントは、workload groupを変更するために使用されます。"
}
---
## 説明

このステートメントはワークロードグループを変更するために使用されます。

## 構文

```sql
ALTER WORKLOAD GROUP  "<rg_name>"
PROPERTIES (
  `<property>`
  [ , ... ]
);
```
## パラメータ

1.`<property>`

`<property>`の形式は`<key>` = `<value>`で、`<key>`の具体的なオプション値については[workload group](../../../../admin-manual/workload-management/workload-group.md)を参照してください。

## 例

1. g1という名前のworkload groupを変更する：

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```
