---
{
  "title": "データバケッティング",
  "language": "ja",
  "description": "パーティションは、ビジネスロジックに基づいてさらに異なるデータバケットに分割することができます。各バケットは物理的なデータタブレットとして保存されます。"
}
---
パーティションは、ビジネスロジックに基づいて異なるデータバケットにさらに分割することができます。各バケットは物理的なデータタブレットとして保存されます。適切なバケット戦略により、クエリ中にスキャンされるデータ量を効果的に削減し、クエリパフォーマンスの向上とクエリ並行性の増加を実現できます。

## バケット方式

Dorisは2つのバケット方式をサポートしています：Hash BucketingとRandom Bucketingです。

### Hash Bucketing

テーブルの作成時またはパーティションの追加時に、ユーザーは1つ以上の列をバケット列として選択し、バケット数を指定する必要があります。同一パーティション内で、システムはバケットキーとバケット数に基づいてハッシュ計算を実行します。同じハッシュ値を持つデータは同じバケットに割り当てられます。例えば、下図では、パーティションp250102がregion列に基づいて3つのバケットに分割され、同じハッシュ値を持つ行が同じバケットに配置されています。

![hash-bucket](/images/table-desigin/hash-bucket.png)

以下のシナリオでHash Bucketingの使用を推奨します：

* ビジネスで特定のフィールドに基づく頻繁なフィルタリングが必要な場合、そのフィールドをバケットキーとしてHash Bucketingに使用することで、クエリ効率を向上させることができます。

* テーブル内のデータ分散が比較的均一な場合、Hash Bucketingも適切な選択です。

以下の例は、Hash Bucketingでテーブルを作成する方法を示しています。詳細な構文については、CREATE TABLE文を参照してください。

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
この例では、`DISTRIBUTED BY HASH(region)`はHash Bucketingの作成を指定し、`region`列をバケットキーとして選択します。一方、`BUCKETS 8`は8つのバケットの作成を指定します。


### Random Bucketing

各パーティション内で、Random Bucketingは特定のフィールドのハッシュ値に依存せずに、データをさまざまなバケットにランダムに分散します。Random Bucketingは均一なデータ分散を保証し、不適切なバケットキー選択によって引き起こされるデータスキューを回避します。

データインポート中、単一のインポートジョブの各バッチはtabletにランダムに書き込まれ、均一なデータ分散を保証します。例えば、ある操作では、8つのデータバッチがパーティション`p250102`配下の3つのバケットにランダムに割り当てられます。

![random-bucket](/images/table-desigin/random-bucket.png)

Random Bucketingを使用する場合、single-tabletインポートモード（`load_to_single_tablet`を`true`に設定）を有効にできます。大規模なデータインポート中、1つのデータバッチは1つのdata tabletのみに書き込まれ、データインポートの並行性とスループットの向上に役立ち、データインポートとCompactionによって引き起こされる書き込み増幅を削減し、それによってクラスターの安定性を保証します。

以下のシナリオでRandom Bucketingの使用を推奨します：

* 任意次元分析のシナリオで、ビジネスが特定の列に基づいてフィルタやjoinクエリを頻繁に行わない場合、Random Bucketingを選択できます。

* 頻繁にクエリされる列または列の組み合わせのデータ分散が極めて不均一な場合、Random Bucketingを使用してデータスキューを回避できます。

* Random Bucketingはバケットキーに基づく枝刈りができず、ヒットしたパーティション内のすべてのデータをスキャンするため、ポイントクエリシナリオには推奨しません。

* DUPLICATEテーブルのみがRandom partitioningを使用できます。UNIQUEおよびAGGREGATEテーブルはRandom Bucketingを使用できません。

以下の例では、Random Bucketingを使用してテーブルを作成する方法を示しています。詳細な構文については、CREATE TABLE文を参照してください：

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
この例では、`DISTRIBUTED BY RANDOM`文によってRandom Bucketingの使用を指定しています。Random Bucketingを作成する場合、バケットキーを選択する必要はなく、`BUCKETS 8`文で8つのバケットの作成を指定します。

## バケットキーの選択

:::tip Note

Hash Bucketingのみバケットキーの選択が必要です。Random Bucketingではバケットキーの選択は不要です。

:::

バケットキーは1つ以上のカラムにすることができます。DUPLICATEテーブルの場合、任意のKeyカラムまたはValueカラムをバケットキーとして使用できます。AGGREGATEまたはUNIQUEテーブルの場合、段階的集約を保証するため、バケットカラムはKeyカラムである必要があります。

一般的に、以下のルールに基づいてバケットキーを選択できます：

* **クエリフィルタ条件の使用：** Hash Bucketingでクエリフィルタ条件を使用することで、データプルーニングに役立ち、データスキャン量を削減します；

* **高カーディナリティカラムの使用：** Hash Bucketingで高カーディナリティ（一意な値が多い）カラムを選択することで、各バケット間でのデータの均等な分散に役立ちます；

* **高並行性ポイントクエリシナリオ：** バケット化には単一カラムまたはより少ないカラムを選択することを推奨します。ポイントクエリは1つのバケットのスキャンのみをトリガーする可能性があり、異なるクエリが異なるバケットのスキャンをトリガーする確率が高く、これによりクエリ間のIOの影響を削減します。

* **高スループットクエリシナリオ：** データをより均等に分散させるため、バケット化には複数のカラムを選択することを推奨します。クエリ条件がすべてのバケットキーの等価条件を含むことができない場合、クエリスループットが向上し、単一クエリのレイテンシが削減されます。

## バケット数の選択

Dorisでは、バケットは物理ファイル（tablet）として保存されます。テーブル内のtablet数は`partition_num`（パーティション数）に`bucket_num`（バケット数）を掛けた値と等しくなります。パーティション数が指定されると、変更することはできません。

バケット数を決定する際は、マシン拡張を事前に考慮する必要があります。バージョン2.0以降、Dorisはマシンリソースとクラスタ情報に基づいてパーティション内のバケット数を自動的に設定することをサポートしています。

### バケット数の手動設定

`DISTRIBUTED`文を使用してバケット数を指定できます：

```sql
-- Set hash bucket num to 8
DISTRIBUTED BY HASH(region) BUCKETS 8

-- Set random bucket num to 8
DISTRIBUTED BY RANDOM BUCKETS 8
```
bucketの数を決定する際、通常、量とサイズという2つの原則に従います。この2つが競合する場合は、サイズの原則が優先されます：

* **サイズの原則：** tabletのサイズは1-10GBの範囲内にすることが推奨されます。tabletが小さすぎると、集約効果が悪くなり、メタデータ管理の負荷が増加する可能性があります。tabletが大きすぎると、replicaの移行と補完に不利であり、Schema Change操作の再試行コストが増加します。

* **量の原則：** 拡張を考慮しない場合、テーブルのtablet数は、クラスタ全体のディスク数よりもわずかに多くすることが推奨されます。

例えば、BEごとに1つのディスクを持つ10台のBEマシンがあると仮定した場合、以下のデータbucketing推奨事項に従うことができます：

| テーブルサイズ | 推奨bucket数 |
| ---------- | -------------------------------------- |
| 500MB      | 4-8 buckets                            |
| 5GB        | 6-16 buckets                           |
| 50GB       | 32 buckets                             |
| 500GB      | Partition推奨、partitionあたり50GB、partitionあたり16-32 buckets |
| 5TB        | Partition推奨、partitionあたり50GB、partitionあたり16-32 buckets |

:::tip Note

テーブルのデータ量は`SHOW DATA`コマンドを使用して確認できます。結果はreplica数とテーブルのデータ量で除算する必要があります。

:::

### 自動bucket数設定

自動bucket数計算機能は、一定期間のpartitionサイズに基づいて将来のpartitionサイズを自動的に予測し、それに応じてbucket数を決定します。

```sql
-- Set hash bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")

-- Set random bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")
```
バケット作成時、`estimate_partition_size`属性を通じて推定パーティションサイズを調整できます。このパラメータはオプションであり、指定されていない場合、Dorisはデフォルトで10GBに設定されます。このパラメータは、過去のパーティションデータに基づいてシステムが計算する将来のパーティションサイズとは関係がないことに注意してください。

## データバケットの維持

:::tip Note

現在、Dorisは新たに追加されたパーティションでのバケット数の変更のみをサポートし、以下の操作はサポートしていません：

1. バケットタイプの変更
2. バケットキーの変更
3. 既存のバケットのバケット数の変更

:::

テーブル作成時、各パーティションのバケット数は`DISTRIBUTED`文を通じて統一的に指定されます。データの増加や減少に対応するため、パーティションを動的に追加する際に新しいパーティションのバケット数を指定できます。以下の例は、`ALTER TABLE`コマンドを使用して新たに追加されたパーティションのバケット数を変更する方法を示しています：

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
