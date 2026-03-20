---
{
  "title": "CREATE WORKLOAD GROUP | コンピュート管理",
  "sidebar_label": "CREATE WORKLOAD GROUP",
  "description": "このステートメントはワークロードグループを作成するために使用されます。ワークロードグループは、単一のbe上でcpuリソースとメモリリソースの分離を可能にします。",
  "language": "ja"
}
---
# CREATE WORKLOAD GROUP

## 説明

このステートメントはworkload groupを作成するために使用されます。Workload groupは単一のbe上でcpuリソースとmemoryリソースの分離を可能にします。

文法:

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
PROPERTIES (
    property_list
);
```
illustrate:

property_listでサポートされているプロパティ：

* cpu_share: 必須。ワークロードグループが取得できるcpu時間を設定するために使用され、cpuリソースのソフト分離を実現できます。cpu_shareは実行中のワークロードグループが利用可能なcpuリソースの重みを示す相対値です。例えば、ユーザーがcpu_shareをそれぞれ10、30、40に設定した3つのワークロードグループrg-a、rg-b、rg-cを作成し、ある時点でrg-aとrg-bがタスクを実行しているがrg-cにはタスクがない場合、rg-aは(10 / (10 + 30)) = 25%のcpuリソースを取得でき、ワークロードグループrg-bは75%のcpuリソースを取得できます。システムで実行されているワークロードグループが1つだけの場合、そのcpu_shareの値に関係なく、すべてのcpuリソースを取得します。

* memory_limit: 必須。ワークロードグループが使用できるbeメモリの割合を設定します。ワークロードグループメモリ制限の絶対値は：`physical_memory * mem_limit * memory_limit`で、mem_limitはbe設定項目です。システム内のすべてのワークロードグループの合計memory_limitは100%を超えてはいけません。ワークロードグループは、ほとんどの場合、グループ内のタスクに対してmemory_limitの使用が保証されています。ワークロードグループのメモリ使用量がこの制限を超えた場合、メモリ使用量の多いグループ内のタスクがキャンセルされ、超過メモリが解放される可能性があります。enable_memory_overcommitを参照してください。

* enable_memory_overcommit: オプション。ワークロードグループのソフトメモリ分離を有効にします。デフォルトはfalseです。falseに設定された場合、ワークロードグループはハードメモリ分離され、ワークロードグループのメモリ使用量が制限を超えた直後に、メモリ使用量が最も大きいタスクが即座にキャンセルされ、超過メモリが解放されます。trueに設定された場合、ワークロードグループはハードメモリ分離され、ワークロードグループのメモリ使用量が制限を超えた直後に、メモリ使用量が最も大きいタスクが即座にキャンセルされ、超過メモリが解放されます。trueに設定された場合、ワークロードグループはソフト分離され、システムに空きメモリリソースがある場合、ワークロードグループはmemory_limit制限を超えてもシステムメモリを継続して使用でき、システム全体のメモリが逼迫した場合、グループ内でメモリ占有量が最も大きい複数のタスクをキャンセルし、超過メモリの一部を解放してシステムメモリ圧迫を緩和します。この設定をワークロードグループで有効にする場合、すべてのワークロードグループの合計memory_limitを100%未満にし、残りの部分をワークロードグループメモリオーバーコミット用に使用することを推奨します。

## Example

1. g1という名前のワークロードグループを作成する：

   ```sql
    create workload group if not exists g1
    properties (
        "cpu_share"="10",
        "memory_limit"="30%",
        "enable_memory_overcommit"="true"
    );
   ```
## Keywords

CREATE、WORKLOAD、GROUP
