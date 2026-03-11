---
{
  "title": "CREATE WORKLOAD GROUP | コンピュート管理",
  "sidebar_label": "CREATE WORKLOAD GROUP",
  "description": "この文は workload group を作成するために使用されます。Workload group により、単一の be 上で cpu リソースと memory リソースの分離が可能になります。",
  "language": "ja"
}
---
# CREATE WORKLOAD GROUP

## デスクリプション

このステートメントはワークロードグループを作成するために使用されます。ワークロードグループは、単一のbe上でcpuリソースとメモリリソースの分離を可能にします。

## Syntax

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
PROPERTIES (
    `<property>`
    [ , ... ]
);
```
## パラメータ

1.`<property>`

`<property>`の形式は`<key>` = `<value>`であり、`<key>`の具体的な選択可能な値についてはworkload groupを参照してください。


## Examples

1. g1という名前のworkload groupを作成する：

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```
