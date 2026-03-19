---
{
  "title": "CREATE WORKLOAD GROUP | コンピュート管理",
  "sidebar_label": "CREATE WORKLOAD GROUP",
  "description": "この文は、ワークロードグループを作成するために使用されます。ワークロードグループは、単一のbe上でcpuリソースとメモリリソースの分離を可能にします。",
  "language": "ja"
}
---
# CREATE WORKLOAD GROUP

## デスクリプション

このステートメントはワークロードグループの作成に使用されます。ワークロードグループは、単一のbe上でcpuリソースとメモリリソースの分離を可能にします。

## Syntax

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "<rg_name>"
PROPERTIES (
    `<property>`
    [ , ... ]
);
```
## パラメータ

1.`<property>`

`<property>` の形式は `<key>` = `<value>` で、`<key>` で利用可能な具体的な値は以下の通りです：

| Parameter | デスクリプション | Required |
| -- | -- | -- |
| `<cpu_share>` | workload groupが取得できるcpu時間を設定するために使用され、cpuリソースのソフト分離を実現できます。cpu_shareは実行中のworkload groupが利用可能なcpuリソースの重みを示す相対値です。例えば、ユーザーがcpu_shareをそれぞれ10、30、40として3つのworkload group rg-a、rg-b、rg-cを作成し、ある瞬間にrg-aとrg-bがタスクを実行している一方でrg-cにタスクがない場合、rg-aは(10 / (10 + 30)) = 25%のcpuリソースを取得でき、workload group rg-bは75%のcpuリソースを取得できます。システムで実行中のworkload groupが1つのみの場合、そのcpu_shareの値に関係なく、すべてのcpuリソースを取得します。 | Y |
| `<memory_limit>` | workload groupが使用できるbeメモリの割合を設定します。workload groupのメモリ制限の絶対値は：`physical_memory * mem_limit * memory_limit` で、mem_limitはbe設定項目です。システム内のすべてのworkload groupのmemory_limitの合計は100%を超えてはいけません。workload groupは、ほとんどの場合でグループ内のタスクにmemory_limitの使用が保証されます。workload groupのメモリ使用量がこの制限を超えた場合、グループ内のより大きなメモリ使用量を持つタスクが余分なメモリを解放するためにキャンセルされる場合があります。enable_memory_overcommitを参照してください。 | Y |
| `<enable_memory_overcommit>` | workload groupのソフトメモリ分離を有効にします。デフォルトはfalseです。falseに設定した場合、workload groupはハードメモリ分離され、workload groupのメモリ使用量が制限を超えた直後に最も多くのメモリ使用量を持つタスクが余分なメモリを解放するために即座にキャンセルされます。trueに設定した場合、workload groupはハードメモリ分離され、workload groupのメモリ使用量が制限を超えた直後に最も多くのメモリ使用量を持つタスクが余分なメモリを解放するために即座にキャンセルされます。trueに設定した場合、workload groupはソフト分離され、システムに空きメモリリソースがある場合、workload groupはmemory_limit制限を超えた後もシステムメモリを継続して使用でき、システム全体のメモリが逼迫した場合、グループ内で最も多くのメモリを占有している複数のタスクをキャンセルし、余分なメモリの一部を解放してシステムメモリ圧迫を緩和します。workload groupでこの設定を有効にする場合、すべてのworkload groupのmemory_limitの合計は100%未満にし、残りの部分をworkload groupのメモリオーバーコミット用に使用することを推奨します。 | Y |


## Examples

1. g1という名前のworkload groupを作成する：

   ```sql
    create workload group if not exists g1
    properties (
        "cpu_share"="10",
        "memory_limit"="30%",
        "enable_memory_overcommit"="true"
    );
   ```
