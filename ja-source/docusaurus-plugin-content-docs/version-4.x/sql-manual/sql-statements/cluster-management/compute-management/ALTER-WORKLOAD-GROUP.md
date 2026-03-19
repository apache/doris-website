---
{
  "title": "ALTER WORKLOAD GROUP",
  "description": "この文は、ワークロードグループを変更するために使用されます。",
  "language": "ja"
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

`<property>`フォーマットは`<key>` = `<value>`です。`<key>`の具体的なオプション値はworkload groupを参照してください。

## Examples

1. g1という名前のworkload groupを変更する：

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```
