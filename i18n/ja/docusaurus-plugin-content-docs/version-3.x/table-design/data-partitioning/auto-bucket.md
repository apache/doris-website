---
{
  "title": "オートバケット",
  "language": "ja",
  "description": "ユーザーは不適切なbucket設定により、しばしば様々な問題に遭遇します。これに対処するため、"
}
---
ユーザーは不適切なbucket設定により様々な問題に遭遇することがよくあります。これに対処するため、bucketの数を設定するための自動化されたアプローチを提供しており、これは現在OLAPテーブルにのみ適用可能です。

:::tip

この機能はCCRによって同期される際に無効になります。このテーブルがCCRによってコピーされる場合、つまりPROPERTIESに`is_being_synced = true`が含まれている場合、show create tableでは有効として表示されますが、実際には効果を発揮しません。`is_being_synced`が`false`に設定されると、これらの機能は動作を再開しますが、`is_being_synced`プロパティはCCR周辺モジュール専用であり、CCR同期中に手動で設定すべきではありません。

:::

以前は、ユーザーはテーブル作成時にbucketの数を手動で設定する必要がありましたが、自動bucket機能はApache Dorisbucketの数を動的に予測する方法であり、bucketの数が常に適切な範囲内に保たれ、ユーザーはbucket数の細かい点を心配する必要がありません。

明確にするため、このセクションではbucketを初期bucketとその後のbucketの2つの期間に分けます。初期とその後は、この機能を明確に説明するためにこの記事で使用される用語に過ぎず、Apache Dorisには初期や後続のbucketは存在しません。

上記のbucket作成に関するセクションで分かるように、`BUCKET_DESC`は非常にシンプルですが、bucketの数を指定する必要があります。自動bucket予測機能では、BUCKET_DESCの構文により、bucketの数を直接`Auto`に変更し、新しいPropertiesの設定を追加します。

```sql
-- old version of the creation syntax for specifying the number of buckets
DISTRIBUTED BY HASH(site) BUCKETS 20

-- Newer versions use the creation syntax for automatic bucket imputation
DISTRIBUTED BY HASH(site) BUCKETS AUTO
properties("estimate_partition_size" = "100G")
```
新しい設定パラメータestimate_partition_sizeは、単一パーティションのデータ量を示します。このパラメータはオプションであり、指定されない場合、Dorisはestimate_partition_sizeのデフォルト値として10GBを使用します。

上記で説明したように、パーティション化されたバケットは物理レベルではtabletであり、最高のパフォーマンスを得るために、tabletサイズは1GB - 10GBの範囲にすることが推奨されます。では、自動バケッティング投影はどのようにしてtabletサイズがこの範囲内に収まることを保証するのでしょうか？

要約すると、いくつかの原則があります。

- 全体的なデータ量が少ない場合、バケット数をあまり高く設定すべきではありません
- 全体的なデータ量が大きい場合、バケット数はディスクブロックの総数に関連させ、各BEマシンと各ディスクの容量を十分に活用すべきです

:::tip
propertie estimate_partition_sizeはalterをサポートしていません
:::

## 初期バケッティング投影

1. データサイズに基づいてバケット数Nを取得します。最初に、`estimate_partition_size`の値を5で割ります（Dorisでテキストフォーマットでデータを保存する際のデータ圧縮率5対1を考慮）。得られる結果は

```
(, 100MB), then take N=1

[100MB, 1GB), then take N=2

(1GB, ), then one bucket per GB
```
2. BEノードの数と各BEノードのディスク容量に基づいて、バケット数Mを計算します。

```
Where each BE node counts as 1, and every 50G of disk capacity counts as 1.

The calculation rule for M is: M = Number of BE nodes * (Size of one disk block / 50GB) * Number of disk blocks.

For example: If there are 3 BEs, and each BE has 4 disks of 500GB, then M = 3 * (500GB / 50GB) * 4 = 120.

```
3. 最終的なバケット数を取得する計算ロジック。

```
Calculate an intermediate value x = min(M, N, 128).

If x < N and x < the number of BE nodes, the final bucket is y.

The number of BE nodes; otherwise, the final bucket is x.
```
4. x = max(x, autobucket_min_buckets)、ここでautobucket_min_bucketsはConfig内で設定されます（デフォルトは1です）

上記プロセスの疑似コード表現は以下の通りです

```
int N = Compute the N value;
int M = compute M value;

int y = number of BE nodes;
int x = min(M, N, 128);

if (x < N && x < y) {
  return y;
}
return x;
```
上記のアルゴリズムを踏まえて、このロジック部分をより良く理解するためにいくつかの例を紹介しましょう。

```
case1:
Amount of data 100 MB, 10 BE machines, 2TB * 3 disks
Amount of data N = 1
BE disks M = 10* (2TB/50GB) * 3 = 1230
x = min(M, N, 128) = 1
Final: 1

case2:
Data volume 1GB, 3 BE machines, 500GB * 2 disks
Amount of data N = 2
BE disks M = 3* (500GB/50GB) * 2 = 60
x = min(M, N, 128) = 2
Final: 2

case3:
Data volume 100GB, 3 BE machines, 500GB * 2 disks
Amount of data N = 20
BE disks M = 3* (500GB/50GB) * 2 = 60
x = min(M, N, 128) = 20
Final: 20

case4:
Data volume 500GB, 3 BE machines, 1TB * 1 disk
Data volume N = 100
BE disks M = 3* (1TB /50GB) * 1 = 60
x = min(M, N, 128) = 63
Final: 63

case5:
Data volume 500GB, 10 BE machines, 2TB * 3 disks
Amount of data N = 100
BE disks M = 10* (2TB / 50GB) * 3 = 1230
x = min(M, N, 128) = 100
Final: 100

case 6:
Data volume 1TB, 10 BE machines, 2TB * 3 disks
Amount of data N = 205
BE disks M = 10* (2TB / 50GB) * 3 = 1230
x = min(M, N, 128) = 128
Final: 128

case 7:
Data volume 500GB, 1 BE machine, 100TB * 1 disk
Amount of data N = 100
BE disk M = 1* (100TB / 50GB) * 1 = 2048
x = min(M, N, 128) = 100
Final: 100

case 8:
Data volume 1TB, 200 BE machines, 4TB * 7 disks
Amount of data N = 205
BE disks M = 200* (4TB / 50GB) * 7 = 114800
x = min(M, N, 128) = 128
Final: 200
```
## 後続のバケット分割投影

上記が初期バケット分割の計算ロジックです。後続のバケット分割は、すでに一定量のパーティションデータが存在するため、利用可能なパーティションデータの量に基づいて評価できます。後続のバケットサイズは、最初の7つのパーティションまでのEMA[1]（短期指数移動平均）値に基づいて評価され、これがestimate_partition_sizeとして使用されます。この時点で、パーティションバケットを計算する方法は2つあります。日単位でのパーティション分割を想定し、前方に数えて最初の日のパーティションサイズをS7、前方に数えて2日目のパーティションサイズをS6、以下S1まで続きます。

- 7日間のパーティションデータが厳密に日次で増加している場合、この時点でトレンド値が採用されます。6つのデルタ値があり、それらは

```
S7 - S6 = delta1,
S6 - S5 = delta2,
...
S2 - S1 = delta6
```
これにより ema(delta) 値が得られます。そして、今日の estimate_partition_size = S7 + ema(delta)

- 最初のケースではない場合、今回は直接前日のEMAの平均を取ります。今日の estimate_partition_size = EMA(S1, ... , S7) , S7)

:::tip

上記のアルゴリズムに従って、初期のバケット数とその後のバケット数を計算できます。以前は固定されたバケット数のみを指定できましたが、ビジネスデータの変化により、前のパーティションのバケット数と次のパーティションのバケット数が異なる可能性があります。これはユーザーには透過的で、ユーザーは各パーティションの正確なバケット数を気にする必要はなく、この自動推定によりバケット数がより合理的になります。

:::
