---
{
  "title": "データバケッティング",
  "language": "ja",
  "description": "パーティションは、ビジネスロジックに基づいてさらに異なるデータbucketに分割することができます。各bucketは物理的なデータtabletとして格納されます。"
}
---
パーティションは、ビジネスロジックに基づいて異なるデータbucketにさらに分割できます。各bucketは物理的なデータtabletとして保存されます。適切なbucket戦略により、クエリ時にスキャンするデータ量を効果的に削減し、クエリパフォーマンスの向上とクエリ同時実行数の増加を実現できます。

## バケット方法

DorisはHash BucketingとRandom Bucketingの2つのbucket方法をサポートしています。

### Hash Bucketing

テーブルの作成時またはパーティションの追加時に、ユーザーは1つ以上の列をbucket列として選択し、bucket数を指定する必要があります。同一パーティション内で、システムはbucketキーとbucket数に基づいてhash計算を実行します。同じhash値を持つデータは同じbucketに割り当てられます。例えば、下図では、パーティションp250102がregion列に基づいて3つのbucketに分割され、同じhash値を持つ行が同じbucketに配置されています。

![hash-bucket](/images/table-desigin/hash-bucket.png)

以下のシナリオでHash Bucketingの使用を推奨します：

* ビジネスで特定のフィールドに基づく頻繁なフィルタリングが必要な場合、このフィールドをbucketキーとしてHash Bucketingに使用することで、クエリ効率を向上できます。

* テーブル内のデータ分散が比較的均一である場合、Hash Bucketingも適切な選択です。

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
この例では、`DISTRIBUTED BY HASH(region)`はHash Bucketingの作成を指定し、`region`列をバケットキーとして選択します。一方、`BUCKETS 8`は8つのバケットの作成を指定します。


### Random Bucketing

各パーティション内で、Random Bucketingは特定のフィールドのハッシュ値に依存せずに、データをさまざまなバケットにランダムに分散します。Random Bucketingは均一なデータ分散を保証し、不適切なバケットキー選択によって引き起こされるデータスキューを回避します。

データインポート中、単一のインポートジョブの各バッチはタブレットにランダムに書き込まれ、均一なデータ分散を保証します。例えば、一つの操作で、8つのデータバッチがパーティション`p250102`の下の3つのバケットにランダムに割り当てられます。

![random-bucket](/images/table-desigin/random-bucket.png)

Random Bucketingを使用する際は、single-tabletインポートモード（`load_to_single_tablet`を`true`に設定）を有効にできます。大規模データインポート中、1つのデータバッチは1つのデータタブレットのみに書き込まれ、データインポートの並行性とスループットの向上に役立ち、データインポートとCompactionによって引き起こされる書き込み増幅を削減し、クラスタの安定性を確保します。

以下のシナリオでRandom Bucketingの使用を推奨します：

* 任意の次元分析のシナリオで、ビジネスが特定の列に基づいてフィルタリングやjoinクエリを頻繁に行わない場合、Random Bucketingを選択できます。

* 頻繁にクエリされる列または列の組み合わせのデータ分散が極めて不均一な場合、Random Bucketingを使用することでデータスキューを回避できます。

* Random Bucketingはバケットキーに基づいたプルーニングができず、ヒットしたパーティション内のすべてのデータをスキャンするため、ポイントクエリシナリオには推奨されません。

* DUPLICATEテーブルのみがRandom partitioningを使用できます。UNIQUEおよびAGGREGATEテーブルはRandom Bucketingを使用できません。

以下の例は、Random Bucketingでテーブルを作成する方法を示しています。詳細な構文については、CREATE TABLE文を参照してください：

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
例では、`DISTRIBUTED BY RANDOM`文はRandom Bucketingの使用を指定します。Random Bucketingの作成にはバケットキーを選択する必要がなく、`BUCKETS 8`文は8個のバケットの作成を指定します。

## バケットキーの選択

:::tip Note

Hash Bucketingのみバケットキーの選択が必要です。Random Bucketingはバケットキーの選択を必要としません。

:::

バケットキーは1つまたは複数のカラムにできます。DUPLICATEテーブルの場合、任意のKeyカラムまたはValueカラムをバケットキーとして使用できます。AGGREGATEまたはUNIQUEテーブルの場合、段階的な集約を確保するため、バケットカラムはKeyカラムである必要があります。

一般的に、以下のルールに基づいてバケットキーを選択できます：

* **クエリフィルタ条件の使用：** Hash Bucketingでクエリフィルタ条件を使用すると、データプルーニングが促進され、データスキャン量が削減されます；

* **高カーディナリティカラムの使用：** Hash Bucketingで高カーディナリティ（多くのユニークな値）カラムを選択すると、各バケット間でデータを均等に分散するのに役立ちます；

* **高同時実行ポイントクエリシナリオ：** バケット化には単一カラムまたはより少ないカラムを選択することを推奨します。ポイントクエリは1つのバケットのスキャンのみをトリガーする可能性があり、異なるクエリが異なるバケットのスキャンをトリガーする確率が高いため、クエリ間のIO影響を削減します。

* **高スループットクエリシナリオ：** データをより均等に分散させるため、バケット化には複数のカラムを選択することを推奨します。クエリ条件がすべてのバケットキーの等価条件を含められない場合、クエリスループットが増加し、単一クエリのレイテンシが削減されます。

## バケット数の選択

Dorisでは、バケットは物理ファイル（tablet）として保存されます。テーブル内のtablet数は`partition_num`（パーティション数）に`bucket_num`（バケット数）を掛けたものと等しくなります。パーティション数が指定されると、変更できません。

バケット数を決定する際、事前にマシン拡張を考慮する必要があります。バージョン2.0以降、Dorisはマシンリソースとクラスタ情報に基づいてパーティション内のバケット数を自動的に設定することをサポートしています。

### バケット数の手動設定

`DISTRIBUTED`文を使用してバケット数を指定できます：

```sql
-- Set hash bucket num to 8
DISTRIBUTED BY HASH(region) BUCKETS 8

-- Set random bucket num to 8
DISTRIBUTED BY RANDOM BUCKETS 8
```
bucketの数を決定する際は、通常2つの原則に従います：数量と容量。この2つに矛盾がある場合は、容量の原則を優先します：

* **容量の原則：** tabletの容量は1-10GBの範囲内にすることを推奨します。tabletが小さすぎると集約効果が悪くなり、メタデータ管理の負荷が増加する可能性があります；tabletが大きすぎるとreplicaの移行と補充に不利であり、Schema Change操作の再試行コストが増加します。

* **数量の原則：** 拡張を考慮しない場合、テーブルのtablet数は、クラスター全体のdisk数よりもわずかに多くすることを推奨します。

例えば、BEあたり1つのdiskを持つ10台のBEマシンがある場合、以下のデータbucketing推奨事項に従うことができます：

| テーブル容量 | 推奨bucket数                            |
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

自動bucket数計算機能は、一定期間のpartition容量に基づいて将来のpartition容量を自動的に予測し、それに応じてbucket数を決定します。

```sql
-- Set hash bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")

-- Set random bucket auto
DISTRIBUTED BY RANDOM BUCKETS AUTO
properties("estimate_partition_size" = "20G")
```
バケットを作成する際、`estimate_partition_size`属性を通じて推定パーティションサイズを調整できます。このパラメータはオプションであり、提供されない場合、Dorisはデフォルトで10GBに設定されます。このパラメータは、システムが履歴パーティションデータに基づいて計算する将来のパーティションサイズとは関係ないことにご注意ください。

## データバケットの保守

:::tip Note

現在、Dorisは新しく追加されたパーティションでのバケット数の変更のみをサポートしており、以下の操作はサポートしていません：

1. バケットタイプの変更
2. バケットキーの変更
3. 既存バケットのバケット数の変更

:::

テーブルを作成する際、各パーティションのバケット数は`DISTRIBUTED`文を通じて統一的に指定されます。データの増加や減少に対処するため、パーティションを動的に追加する際に新しいパーティションのバケット数を指定できます。以下の例は、`ALTER TABLE`コマンドを使用して新しく追加されたパーティションのバケット数を変更する方法を示しています：

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
