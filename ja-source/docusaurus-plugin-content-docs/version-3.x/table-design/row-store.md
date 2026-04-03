---
{
  "title": "ハイブリッド行列ストレージ",
  "language": "ja",
  "description": "Dorisはデフォルトでcolumnar storageを使用し、各列は連続して格納されます。"
}
---
## ハイブリッド行列ストレージ

Dorisはデフォルトで列指向ストレージを使用し、各列は連続して格納されます。列指向ストレージは分析シナリオ（集計、フィルタリング、ソートなど）において優れたパフォーマンスを提供します。これは必要な列のみを読み取り、不要なIOを削減するためです。しかし、ポイントクエリシナリオ（`SELECT *`など）では、すべての列を読み取る必要があり、各列に対してIO操作が必要となるため、IOPSがボトルネックになる可能性があります。特に多くの列を持つワイドテーブル（例：数百の列）で顕著です。

ポイントクエリシナリオにおけるIOPSボトルネックに対処するため、バージョン2.0.0から、DorisはHybrid Row-Columnar Storageをサポートしています。ユーザーがテーブルを作成する際に、行ストレージを有効にするかどうかを指定できます。行ストレージが有効な場合、ポイントクエリ（`SELECT *`など）では各行に対して1回のIO操作のみが必要となり、パフォーマンスが大幅に向上します。

行ストレージの原理は、ストレージ時に追加の列が加えられることです。この列は対応する行のすべての列を連結し、特別なバイナリ形式で格納します。

## 構文

テーブル作成時に、テーブルのPROPERTIESで行ストレージを有効にするか、どの列に対して行ストレージを有効にするか、およびストレージ圧縮単位サイズpage_sizeを指定します。

1. 行ストレージを有効にするか：デフォルトはfalse（無効）です。

``` 
"store_row_column" = "true"
```
2. 行ストレージを有効にする列：`"store_row_column" = "true"`の場合、デフォルトですべての列が有効になります。一部の列のみを行ストレージ有効にするよう指定する必要がある場合は、row_store_columnsパラメータ（バージョン3.0以降）を設定し、列名のカンマ区切りリストとして書式設定します。

``` 
"row_store_columns" = "column1,column2,column3"
```
3. 行ストレージのpage_size: デフォルトは16KBです。

``` 
"row_store_page_size" = "16384"
```
ページは、ストレージの読み書き操作における最小単位であり、`page_size`は行ストアページのサイズを指します。これは、単一行の読み取りにページIOの生成が必要であることを意味します。この値が大きいほど、圧縮効果が向上し、ストレージ容量の使用量が少なくなります。しかし、ポイントクエリ時のIOオーバーヘッドが増加し、パフォーマンスが低下します（各IO操作で少なくとも1ページを読み取るため）。逆に、値が小さいほど、ストレージ容量の使用量は多くなりますが、ポイントクエリのパフォーマンスは向上します。デフォルト値の16KBは、ほとんどの場合でバランスの取れた選択です。クエリパフォーマンスを重視する場合は、4KBまたはそれ以下のより小さい値を設定できます。ストレージ容量を重視する場合は、64KBまたはそれ以上のより大きい値を設定できます。

## Row Storeヒット条件

Row storeヒット条件は2つのシナリオに分かれます：1つはテーブル属性に依存し、ポイントクエリ条件を満たす高同時実行プライマリキーポイントクエリ、もう1つは単一テーブルの`SELECT *`クエリです。これら2つのクエリタイプについて以下で説明します。

- 高同時実行プライマリキーポイントクエリの場合、テーブル属性は`"enable_unique_key_merge_on_write" = "true"`（MOWテーブル）および`"store_row_column" = "true"`（すべての列がrow storeに個別に格納される、これは比較的高いストレージコストを発生させます）または`"row_store_columns" = "key,v1,v3,v5,v7"`（指定された列のみがrow storeに格納される）を持つ必要があります。クエリ時には、`WHERE`句にすべてのプライマリキーが`AND`で接続された等価条件で含まれることを確認してください。例：`SELECT * FROM tbl WHERE k1 = 1 AND k2 = 2`または特定の列のクエリ`SELECT v1, v2 FROM tbl WHERE k1 = 1 AND k2 = 2`。row storeに一部の列のみが含まれている場合（例：v1）、クエリされた列（例：v2）がrow storeにない場合、残りの列はcolumn storeからクエリされます。この例では、v1はrow storeからクエリされ、v2はcolumn store（より大きなページサイズを持ち、より多くの読み取り増幅を引き起こします）からクエリされます。高同時実行プライマリキーポイントクエリ最適化がヒットしているかどうかは、`EXPLAIN`を使用して確認できます。ポイントクエリの使用方法の詳細については、[High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query)を参照してください。

- 一般的な非プライマリキーポイントクエリの場合、row storeを活用するには、テーブルモデルが`DUPLICATE`であるか、`"enable_unique_key_merge_on_write" = "true"`（MOWテーブル）および`"store_row_column" = "true"`（すべての列がrow storeに個別に格納される、これは比較的高いストレージコストを発生させます）を持つ必要があります。このパターンを満たすクエリは、`SELECT * FROM tbl [WHERE XXXXX] ORDER BY XXX LIMIT N`でrow storeをヒットできます。ここで角括弧内の内容はオプションのクエリ条件です。現在は`SELECT *`のみがサポートされており、TOPN遅延マテリアライゼーション最適化をヒットする必要があることに注意してください。詳細については、[TOPN Query Optimization](../query-acceleration/optimization-technology-principle/topn-optimization)を参照してください。つまり、`OPT TWO PHASE`をヒットすることです。最後に、`EXPLAIN`を使用して`FETCH ROW STORE`マーカーを確認し、row storeヒットを確認してください。

## 使用例

以下の例では、8列のテーブルを作成し、そのうち5列の`key, v1, v3, v5, v7`をrow storeに対応させ、高同時実行ポイントクエリパフォーマンスのために`page_size`を4KBに設定しています。

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
上記ステートメントの`EXPLAIN`出力には`SHORT-CIRCUIT`マーカーが含まれるはずです。ポイントクエリの使用方法の詳細については、[High-Concurrency Point Query](../query-acceleration/high-concurrent-point-query)を参照してください。

以下の例は、`DUPLICATE`テーブルが行ストアクエリ条件を満たす方法を示しています。

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
`"store_row_column" = "true"`が必要です。

クエリ2（注意：TOPN クエリ最適化にヒットする必要があり、`SELECT *`である必要があります）

```
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10
```
上記のステートメントの`EXPLAIN`出力には、`FETCH ROW STORE`マーカーと`OPT TWO PHASE`マーカーが含まれるはずです。

## 注意

1. 行ストレージを有効にすると、使用されるストレージ容量が増加します。ストレージ容量の増加はデータ特性に関連しており、一般的に元のテーブルのサイズの2倍から10倍になります。正確な容量使用量は実際のデータでテストする必要があります。
2. 行ストレージの`page_size`もストレージ容量に影響します。前述のテーブル属性パラメータ`row_store_page_size`に基づいて調整できます。
