---
{
    "title": "CREATE WORKLOAD GROUP | コンピュート管理",
    "language": "ja",
    "description": "このステートメントはワークロードグループを作成します。ワークロードグループを使用すると、単一の BE 上で CPU リソースとメモリリソースを分離できます。",
    "sidebar_label": "CREATE WORKLOAD GROUP"
}
---

# CREATE WORKLOAD GROUP

## 説明

このステートメントはワークロードグループを作成します。ワークロードグループを使用すると、単一の BE 上で CPU リソースとメモリリソースを分離できます。

## 構文

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
[FOR <compute_group>]
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## パラメータ

1. `<compute_group>`

    ワークロードグループを紐付けるコンピュートグループを指定します。

    - **クラウドモード（ストレージとコンピュートが分離）**: `FOR <compute_group>` 句を**明示的に指定する必要があります**。省略すると、`Must specify compute group via 'FOR <compute_group>' in cloud mode.` というエラーが発生します。
    - **非クラウドモード（ストレージとコンピュートが結合）**: `FOR <compute_group>` 句は省略できます。ここで指定する値は実際のコンピュートグループではなく、リソースグループ（Tag）を指します。構文は一貫性のためにクラウドモードと共通になっています。省略した場合は、デフォルトのリソースグループ（`default`）が使用されます。

2. `<property>`

    `<property>` の形式は `<key>` = `<value>` です。`<key>` に指定できる値の詳細については、[ワークロードグループ](../../../../admin-manual/workload-management/workload-group.md)を参照してください。


## 例

1. g1 という名前のワークロードグループを作成します（非クラウドモード: デフォルトのリソースグループに紐付けます）。

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```

2. `compute_group_a` に紐付けられた g1 という名前のワークロードグループを作成します（クラウドモードではこの句が必須です）。

   ```sql
    create workload group if not exists g1 for compute_group_a
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```
