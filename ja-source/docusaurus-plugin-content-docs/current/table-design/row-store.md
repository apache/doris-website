---
{
  "title": "ハイブリッド行列ストレージ",
  "language": "ja",
  "description": "Dorisはデフォルトでカラムナーストレージを使用し、各カラムは連続して格納されます。"
}
---
## ハイブリッド行列型ストレージ

Dorisはデフォルトで列型ストレージを使用し、各列は連続して格納されます。列型ストレージは分析シナリオ（集計、フィルタリング、ソートなど）において優れた性能を提供します。これは必要な列のみを読み取り、不要なIOを削減するためです。しかし、ポイントクエリシナリオ（`SELECT *`など）では、すべての列を読み取る必要があり、列ごとにIO操作が必要となるため、IOPSがボトルネックになる可能性があります。特に多くの列を持つワイドテーブル（例：数百列）においてその傾向が顕著です。

ポイントクエリシナリオにおけるIOPSボトルネックに対処するため、バージョン2.0.0以降、DorisはHybrid Row-Columnar Storageをサポートしています。ユーザーはテーブル作成時に行ストレージを有効にするかどうかを指定できます。行ストレージが有効になると、各行はポイントクエリ（`SELECT *`など）に対して1回のIO操作のみが必要となり、性能が大幅に向上します。

行ストレージの原理は、ストレージ時に追加の列が加えられることです。この列は対応する行のすべての列を連結し、特別なバイナリ形式を使用して格納します。

## 構文

テーブル作成時に、テーブルのPROPERTIESで行ストレージを有効にするかどうか、どの列に対して行ストレージを有効にするか、およびストレージ圧縮単位サイズpage_sizeを指定します。

1. 行ストレージを有効にするかどうか：デフォルトはfalse（有効でない）。

``` 
"store_row_column" = "true"
```
2. 行ストレージを有効にする列：`"store_row_column" = "true"`の場合、デフォルトですべての列が有効になります。一部の列のみ行ストレージを有効にする必要がある場合は、row_store_columnsパラメータ（バージョン3.0以降）を設定します。列名をカンマ区切りリストとして形式設定します。

``` 
"row_store_columns" = "column1,column2,column3"
```
3. 行ストレージのpage_size: デフォルトは16KBです。

``` 
"row_store_page_size" = "16384"
```
ページは、ストレージの読み書き操作における最小単位であり、`page_size`は行ストアページのサイズを指します。これは、単一行の読み取りにページIOの生成が必要であることを意味します。この値が大きいほど、圧縮効果が高くなり、ストレージ使用量が少なくなります。ただし、ポイントクエリ中のIOオーバーヘッドが増加し、パフォーマンスが低下します（各IO操作で少なくとも1ページを読み取るため）。逆に、値が小さいほど、ストレージ使用量が多くなり、ポイントクエリのパフォーマンスが向上します。16KBのデフォルト値は、ほとんどの場合においてバランスの取れた選択です。クエリパフォーマンスを優先する場合は、4KBまたはそれ以下のより小さい値を設定できます。ストレージ容量を優先する場合は、64KBまたはそれ以上のより大きい値を設定できます。


## Row Storeヒット条件

Row storeヒット条件は2つのシナリオに分かれます：1つはテーブル属性に依存し、ポイントクエリ条件を満たす高並行性プライマリキーポイントクエリ、もう1つは単一テーブルの`SELECT *`クエリです。これら2つのクエリタイプについて以下で説明します。

- 高並行性プライマリキーポイントクエリの場合、テーブル属性には`"enable_unique_key_merge_on_write" = "true"`（MOWテーブル）と`"store_row_column" = "true"`（すべての列がrow storeに個別に格納され、比較的高いストレージコストが発生する）、または`"row_store_columns" = "key,v1,v3,v5,v7"`（指定された列のみがrow storeに格納される）が必要です。クエリ実行時は、`WHERE`句にすべてのプライマリキーを含み、`AND`で接続された等価条件を確実に含める必要があります。例：`SELECT * FROM tbl WHERE k1 = 1 AND k2 = 2`または特定の列のクエリ`SELECT v1, v2 FROM tbl WHERE k1 = 1 AND k2 = 2`。row storeに一部の列のみ（例：v1）が含まれているが、クエリ対象の列（例：v2）がrow storeにない場合、残りの列はcolumn storeからクエリされます。この例では、v1はrow storeからクエリされ、v2はcolumn store（より大きなページサイズを持つため、読み取り増幅が増える）からクエリされます。高並行性プライマリキーポイントクエリ最適化がヒットしているかどうかは`EXPLAIN`を使用して確認できます。ポイントクエリの使用方法の詳細については、[High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query)を参照してください。

- 一般的な非プライマリキーポイントクエリの場合、row storeを利用するには、テーブルモデルが`DUPLICATE`であるか、`"enable_unique_key_merge_on_write" = "true"`（MOWテーブル）と`"store_row_column" = "true"`（すべての列がrow storeに個別に格納され、比較的高いストレージコストが発生する）を持つ必要があります。このパターンを満たすクエリは、`SELECT * FROM tbl [WHERE XXXXX] ORDER BY XXX LIMIT N`でrow storeをヒットできます。ここで角括弧内の内容はオプションのクエリ条件です。現在、`SELECT *`のみがサポートされており、TOPN遅延マテリアライゼーション最適化をヒットする必要があります。詳細については[TOPN Query Optimization](../query-acceleration/optimization-technology-principle/topn-optimization)を参照してください。つまり、`OPT TWO PHASE`をヒットする必要があります。最後に、`EXPLAIN`を使用して`FETCH ROW STORE`マーカーを確認し、row storeヒットを確認します。


## 使用例

以下の例では、8列を持つテーブルを作成し、そのうち5列の`key, v1, v3, v5, v7`についてrow storeを有効にし、高並行性ポイントクエリパフォーマンスのために`page_size`を4KBに設定しています。

```
CREATE TABLE `tbl_point_query` (
    `k` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "row_store_columns" = "k,v1,v3,v5,v7",
    "row_store_page_size" = "4096"
);
```
クエリ 1

```
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100
```
上記のステートメントの`EXPLAIN`出力には、`SHORT-CIRCUIT`マーカーが含まれる必要があります。ポイントクエリの使用方法の詳細については、[High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query)を参照してください。

以下の例では、`DUPLICATE`テーブルが行ストアクエリ条件を満たす方法を示しています。

```
CREATE TABLE `tbl_duplicate` (
    `k` int(11) NULL,
    `v1` string NULw
) ENGINE=OLAP
DUPLICATE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "light_schema_change" = "true",
    "store_row_column" = "true",
    "row_store_page_size" = "4096"
);
```
`"store_row_column" = "true"` が必要です。

クエリ2（注意：TOPN クエリ最適化にヒットする必要があり、`SELECT *` である必要があります）

```
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10
```
上記のステートメントの`EXPLAIN`出力には、`FETCH ROW STORE`マーカーと`OPT TWO PHASE`マーカーが含まれている必要があります。

## 注意

1. 行ストレージを有効にすると、使用されるストレージ容量が増加します。ストレージ容量の増加はデータ特性に関連しており、一般的に元のテーブルサイズの2倍から10倍になります。正確な容量使用量は実際のデータでテストする必要があります。
2. 行ストレージの`page_size`もストレージ容量に影響します。以前のテーブル属性パラメータ`row_store_page_size`に基づいて調整できます。
