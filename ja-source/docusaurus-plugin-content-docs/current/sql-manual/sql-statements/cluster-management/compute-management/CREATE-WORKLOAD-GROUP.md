---
{
  "title": "CREATE WORKLOAD GROUP | コンピュート管理",
  "language": "ja",
  "description": "このステートメントは workload group を作成するために使用されます。Workload group は単一の be 上で cpu リソースと memory リソースの分離を可能にします。",
  "sidebar_label": "CREATE WORKLOAD GROUP"
}
---
# CREATE WORKLOAD GROUP

## 説明

このステートメントは、ワークロードグループを作成するために使用されます。ワークロードグループは、単一のbe上でcpuリソースとメモリリソースの分離を可能にします。

## 構文

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
PROPERTIES (
    `<property>`
    [ , ... ]
);
```
## パラメータ

1.`<property>`

`<property>`の形式は`<key>` = `<value>`です。`<key>`の具体的なオプション値は[workload group](../../../../admin-manual/workload-management/workload-group.md)を参照してください。


## 例

1. g1という名前のworkload groupを作成する：

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```
