---
{
  "title": "CREATE WORKLOAD GROUP | コンピュート管理",
  "language": "ja",
  "description": "この文は workload group を作成するために使用されます。Workload group により、単一の be 上で cpu リソースと memory リソースの分離が可能になります。",
  "sidebar_label": "CREATE WORKLOAD GROUP"
}
---
# CREATE WORKLOAD GROUP

## 説明

このステートメントはworkload groupを作成するために使用されます。Workload groupは単一のbe上でcpuリソースとメモリリソースの分離を可能にします。

文法:

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
PROPERTIES (
    property_list
);
```
説明:

property_listでサポートされるプロパティ:

* cpu_share: 必須、ワークロードグループが取得できるcpu時間の量を設定するために使用され、cpuリソースのソフト分離を実現できます。cpu_shareは、実行中のワークロードグループが利用可能なcpuリソースの重みを示す相対値です。例えば、ユーザーがcpu_shareをそれぞれ10、30、40に設定したワークロードグループrg-a、rg-b、rg-cの3つを作成し、ある瞬間にrg-aとrg-bがタスクを実行していてrg-cにはタスクがない場合、rg-aは (10 / (10 + 30)) = 25%のcpuリソースを取得でき、ワークロードグループrg-bは75%のcpuリソースを取得できます。システムで実行中のワークロードグループが1つだけの場合、そのcpu_shareの値に関係なく、すべてのcpuリソースを取得します。

* memory_limit: 必須、ワークロードグループが使用できるbeメモリの割合を設定します。ワークロードグループのメモリ制限の絶対値は: `physical_memory * mem_limit * memory_limit`で、mem_limitはbe設定項目です。システム内のすべてのワークロードグループのmemory_limitの合計は100%を超えてはいけません。ワークロードグループは、ほとんどの場合、グループ内のタスクに対してmemory_limitの使用が保証されます。ワークロードグループのメモリ使用量がこの制限を超えた場合、excess memoryを解放するために、グループ内でメモリ使用量がより大きいタスクがキャンセルされる可能性があります。enable_memory_overcommitを参照してください。

* enable_memory_overcommit: オプション、ワークロードグループのソフトメモリ分離を有効にします。デフォルトはfalseです。falseに設定されている場合、ワークロードグループはハードメモリ分離され、ワークロードグループのメモリ使用量が制限を超えた直後に、メモリ使用量が最大のタスクが直ちにキャンセルされ、excess memoryが解放されます。trueに設定されている場合、ワークロードグループはハードメモリ分離され、ワークロードグループのメモリ使用量が制限を超えた直後に、メモリ使用量が最大のタスクが直ちにキャンセルされ、excess memoryが解放されます。trueに設定されている場合、ワークロードグループはソフト分離され、システムに空きメモリリソースがある場合、ワークロードグループはmemory_limit制限を超えた後もシステムメモリを継続して使用でき、システムの総メモリが不足している場合は、メモリ占有量が最大のグループ内の複数のタスクをキャンセルし、システムメモリ圧迫を緩和するためにexcess memoryの一部を解放します。ワークロードグループでこの設定を有効にする場合、すべてのワークロードグループのmemory_limitの合計は100%未満にし、残りの部分をワークロードグループのメモリovercommitに使用することが推奨されます。

## 例

1. g1という名前のワークロードグループを作成する:

   ```sql
    create workload group if not exists g1
    properties (
        "cpu_share"="10",
        "memory_limit"="30%",
        "enable_memory_overcommit"="true"
    );
   ```
## キーワード

CREATE、WORKLOAD、GROUP
