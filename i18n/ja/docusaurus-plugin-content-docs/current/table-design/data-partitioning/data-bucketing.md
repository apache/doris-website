---
{
  "title": "データバケッティング",
  "language": "ja",
  "description": "パーティションは、ビジネスロジックに基づいてさらに異なるデータbucketに分割することができます。各bucketは物理的なデータtabletとして保存されます。"
}
---
パーティションは、ビジネスロジックに基づいてさらに異なるデータbucketに分割することができます。各bucketは物理的なデータtabletとして保存されます。合理的なbucket戦略は、クエリ時にスキャンするデータ量を効果的に削減し、それによってクエリパフォーマンスを向上させ、クエリの同時実行数を増加させることができます。

## Bucketメソッド

DorisはHash BucketingとRandom Bucketingの2つのbucketメソッドをサポートしています。

### Hash Bucketing

テーブルの作成時またはパーティションの追加時に、ユーザーは1つまたは複数の列をbucket列として選択し、bucket数を指定する必要があります。同一パーティション内で、システムはbucket keyとbucket数に基づいてhash計算を実行します。同じhash値を持つデータは同じbucketに割り当てられます。例えば、下図では、パーティションp250102はregion列に基づいて3つのbucketに分割され、同じhash値を持つ行が同じbucketに配置されています。

![hash-bucket](/images/table-desigin/hash-bucket.png)

以下のシナリオではHash Bucketingの使用を推奨します：

* ビジネスで特定のフィールドに基づくフィルタリングを頻繁に行う必要がある場合、このフィールドをbucket keyとしてHash Bucketingに使用することでクエリ効率を向上させることができます。

* テーブル内のデータ分散が比較的均等である場合、Hash Bucketingも適切な選択です。

以下の例は、Hash Bucketingでテーブルを作成する方法を示しています。詳細な構文については、CREATE TABLEステートメントを参照してください。

```sql
CREATE TABLE demo.hash_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY HASH(region) BUCKETS 8;
```
この例では、`DISTRIBUTED BY HASH(region)`がHash Bucketingの作成を指定し、`region`列をバケットキーとして選択します。一方、`BUCKETS 8`は8個のバケットの作成を指定します。

### Random Bucketing

各パーティション内で、Random Bucketingは特定のフィールドのハッシュ値に依存せず、データをランダムに様々なバケットに分散させます。Random Bucketingは均一なデータ分散を保証し、不適切なバケットキー選択によって引き起こされるデータスキューを回避します。

データインポート中、単一のインポートジョブの各バッチはタブレットにランダムに書き込まれ、均一なデータ分散を保証します。例えば、ある操作において、8つのデータバッチがパーティション`p250102`の下の3つのバケットにランダムに割り当てられます。

![random-bucket](/images/table-desigin/random-bucket.png)

Random Bucketingを使用する際は、シングルタブレットインポートモード（`load_to_single_tablet`を`true`に設定）を有効にできます。大規模データインポート時、1つのデータバッチは1つのデータタブレットにのみ書き込まれ、データインポートの同時実行性とスループットの向上に役立ち、データインポートとCompactionによって引き起こされる書き込み増幅を削減し、クラスタの安定性を保証します。

以下のシナリオでRandom Bucketingの使用を推奨します：

* 任意の次元分析のシナリオにおいて、ビジネスが特定の列に基づいてフィルタやjoinクエリを頻繁に行わない場合、Random Bucketingを選択できます。

* 頻繁にクエリされる列や列の組み合わせのデータ分散が極めて不均一な場合、Random Bucketingを使用することでデータスキューを回避できます。

* Random Bucketingはバケットキーに基づいたプルーニングができず、ヒットしたパーティション内の全データをスキャンするため、ポイントクエリシナリオには推奨されません。

* DUPLICATEテーブルのみがRandom partitioningを使用できます。UNIQUEテーブルとAGGREGATEテーブルはRandom Bucketingを使用できません。

以下の例はRandom Bucketingでテーブルを作成する方法を示しています。詳細な構文については、CREATE TABLE文を参照してください：

```sql
CREATE TABLE demo.random_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY RANDOM BUCKETS 8;
```
この例では、`DISTRIBUTED BY RANDOM`文がRandom Bucketingの使用を指定しています。Random Bucketingの作成ではbucket keyを選択する必要がなく、`BUCKETS 8`文が8つのbucketの作成を指定しています。

## Bucket Keyの選択

:::tip Note

Hash BucketingのみがBucket keyの選択を必要とします。Random BucketingではBucket keyの選択は必要ありません。

:::

Bucket keyは1つ以上の列にできます。DUPLICATEテーブルの場合、任意のKey列またはValue列をbucket keyとして使用できます。AGGREGATEまたはUNIQUEテーブルの場合、段階的集約を確実にするために、bucket列はKey列である必要があります。

一般的に、以下のルールに基づいてbucket keyを選択できます：

* **クエリフィルタ条件の使用:** Hash Bucketingにクエリフィルタ条件を使用することで、データの刈り込みが可能になり、データスキャン量が削減されます。

* **高カーディナリティ列の使用:** Hash Bucketingに高カーディナリティ（多くの一意の値）を持つ列を選択することで、各bucket間でのデータの均等分散が促進されます。

* **高同時実行ポイントクエリシナリオ:** bucketingには単一の列または少数の列を選択することを推奨します。ポイントクエリは1つのbucketのスキャンのみをトリガーする可能性があり、異なるクエリが異なるbucketのスキャンをトリガーする確率が高く、それによりクエリ間のIO影響が削減されます。

* **高スループットクエリシナリオ:** データをより均等に分散させるために、bucketingには複数の列を選択することを推奨します。クエリ条件がすべてのbucket keyの等価条件を含むことができない場合、クエリスループットが向上し、単一クエリのレイテンシが削減されます。

## Bucket数の選択

Dorisでは、bucketは物理ファイル（tablet）として格納されます。テーブル内のtablet数は、`partition_num`（パーティション数）に`bucket_num`（bucket数）を乗じた値と等しくなります。パーティション数が指定されると、変更することはできません。

bucket数を決定する際は、マシン拡張を事前に考慮する必要があります。バージョン2.0以降、Dorisはマシンリソースとクラスタ情報に基づいて、パーティション内のbucket数を自動的に設定することをサポートしています。

### Bucket数の手動設定

`DISTRIBUTED`文を使用してbucket数を指定できます：

```sql
-- Set hash bucket num to 8
DISTRIBUTED BY HASH(region) BUCKETS 8

-- Set random bucket num to 8
DISTRIBUTED BY RANDOM BUCKETS 8
```
bucketの数を決定する際、通常2つの原則に従います：数量と容量です。この2つが競合する場合は、容量の原則が優先されます：

* **容量の原則：** tabletの容量は1-10GBの範囲内にすることを推奨します。tabletが小さすぎると集計効果が悪く、メタデータ管理の負荷が増加する可能性があります；tabletが大きすぎるとレプリカのマイグレーションと補完に不利で、Schema Change操作の再試行コストが増加します。

* **数量の原則：** 拡張を考慮しない場合、テーブルのtablet数はクラスタ全体のディスク数より少し多くすることを推奨します。

例えば、BEマシンが10台あり、各BEに1つのディスクがある場合を想定すると、データのbucketingについて以下の推奨に従うことができます：

| テーブル容量 | 推奨bucket数          |
| ---------- | -------------------------------------- |
| 500MB      | 4-8 buckets                            |
| 5GB        | 6-16 buckets                           |
| 50GB       | 32 buckets                             |
| 500GB      | Partition推奨、パーティションあたり50GB、パーティションあたり16-32 buckets |
| 5TB        | Partition推奨、パーティションあたり50GB、パーティションあたり16-32 buckets |

:::tip Note

テーブルのデータ量は`SHOW DATA`コマンドを使用して確認できます。結果はレプリカ数とテーブルのデータ量で除算する必要があります。

:::

### 自動bucket数設定

自動bucket数計算機能は、一定期間におけるパーティション容量に基づいて将来のパーティション容量を自動的に予測し、それに応じてbucket数を決定します。

```sql
-- Set hash bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")

-- Set random bucket auto
DISTRIBUTED BY RANDOM BUCKETS AUTO
properties("estimate_partition_size" = "20G")
```
バケット作成時に、`estimate_partition_size`属性を通じて推定パーティションサイズを調整できます。このパラメータはオプションであり、提供されない場合、Dorisはデフォルトで10GBに設定されます。このパラメータは、履歴パーティションデータに基づいてシステムが計算する将来のパーティションサイズとは関係がないことにご注意ください。

## データバケットの維持

:::tip Note

現在、Dorisは新しく追加されたパーティションのバケット数の変更のみをサポートしており、以下の操作はサポートしていません：

1. バケットタイプの変更
2. バケットキーの変更
3. 既存バケットのバケット数の変更

:::

テーブル作成時、各パーティションのバケット数は`DISTRIBUTED`文を通じて統一的に指定されます。データの増加または減少に対応するため、パーティションを動的に追加する際に新しいパーティションのバケット数を指定できます。以下の例は、`ALTER TABLE`コマンドを使用して新しく追加されたパーティションのバケット数を変更する方法を示しています：

```sql
-- Modify hash bucket table
ALTER TABLE demo.hash_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY HASH(region) BUCKETS 16;

-- Modify random bucket table
ALTER TABLE demo.random_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY RANDOM BUCKETS 16;

-- Modify dynamic partition table
ALTER TABLE demo.dynamic_partition_tbl
SET ("dynamic_partition.buckets"="16");
```
バケット数を変更した後、SHOW PARTITIONコマンドを使用して更新されたバケット数を確認できます。
