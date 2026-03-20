---
{
  "title": "データキャッシュ",
  "language": "ja",
  "description": "データキャッシュは、リモートストレージシステム（HDFSまたはオブジェクト）から最近アクセスされたデータファイルをキャッシュすることにより、同じデータの後続のクエリを高速化します。"
}
---
Data Cacheは、リモートストレージシステム（HDFSまたはオブジェクトストレージ）から最近アクセスされたデータファイルをローカルディスクにキャッシュすることで、同じデータの後続クエリを高速化します。同じデータに頻繁にアクセスするシナリオでは、Data Cacheは繰り返されるリモートデータアクセスのオーバーヘッドを回避し、ホットデータのクエリ分析のパフォーマンスと安定性を向上させることができます。

## 適用シナリオ

データキャッシュ機能は、Hive、Iceberg、Hudi、およびPaimonテーブルへのクエリでのみ動作します。内部テーブルクエリや非ファイル外部テーブルクエリ（JDBC、Elasticsearchなど）には効果がありません。

データキャッシュがクエリ効率を改善できるかどうかは、複数の要因に依存します。以下は、データキャッシュの適用シナリオです：

* 高速ローカルディスク

  SSDやNVMEメディアローカルディスクなどの高速ローカルディスクをデータキャッシュディレクトリとして使用することを推奨します。機械的ハードドライブをデータキャッシュディレクトリとして使用することは推奨されません。本質的に、ローカルディスクのIO帯域幅とIOPSは、ネットワーク帯域幅とソースストレージシステムのIO帯域幅およびIOPSよりも大幅に高くなければ、顕著なパフォーマンス向上をもたらすことができません。

* 十分なキャッシュ領域サイズ

  データキャッシュは、キャッシュ退避ポリシーとしてLRU戦略を使用します。クエリされるデータにホットとコールドの明確な区別がない場合、キャッシュされたデータが頻繁に更新および置換される可能性があり、クエリパフォーマンスが低下する可能性があります。クエリパターンにホットとコールドの明確な区別があるシナリオ（例：ほとんどのクエリが今日のデータのみにアクセスし、履歴データにはほとんどアクセスしない）で、キャッシュ領域がホットデータを格納するのに十分である場合に、データキャッシュを有効にすることを推奨します。

* リモートストレージの不安定なIOレイテンシ

  この状況は通常、HDFSストレージで発生します。ほとんどの企業では、異なる事業部門が同じHDFSを共有するため、ピーク時間中に非常に不安定なIOレイテンシが発生する可能性があります。この場合、安定したIOレイテンシを確保する必要がある場合は、データキャッシュを有効にすることを推奨します。ただし、最初の2つの条件も考慮する必要があります。

## Data Cacheの有効化

データキャッシュ機能はデフォルトで無効になっており、FEとBEで関連パラメータを設定することで有効にする必要があります。

### BE設定

まず、`be.conf`でキャッシュパス情報を設定し、BEノードを再起動して設定を有効にします。

| パラメータ            | 必須 | 説明                              |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | はい   | Data Cacheを有効にするかどうか、デフォルトはfalse               |
| `file_cache_path`   | はい   | キャッシュディレクトリに関連する設定、JSON形式。                      |
| `clear_file_cache`  | いいえ   | デフォルトはfalse。trueの場合、BEノード再起動時にキャッシュディレクトリがクリアされる。 |

`file_cache_path`の設定例：

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```
`path`はキャッシュが保存されるパスで、1つ以上のパスを設定できます。ディスクごとに1つのパスのみを設定することを推奨します。

`total_size`はキャッシュ容量サイズの上限で、バイト単位です。キャッシュ容量を超えた場合、LRU戦略を使用してキャッシュされたデータを削除します。

### FE Configuration

単一セッションでData Cacheを有効にする：

```sql
SET enable_file_cache = true;
```
Data Cacheをグローバルに有効化:

```sql
SET GLOBAL enable_file_cache = true;
```
`enable_file_cache`が有効でない場合、BEがキャッシュディレクトリで設定されていても、キャッシュは使用されないことに注意してください。同様に、BEがキャッシュディレクトリで設定されていない場合、`enable_file_cache`が有効であっても、キャッシュは使用されません。

## キャッシュの可観測性

### キャッシュヒット率の表示

`set enable_profile=true`を実行してセッション変数を有効にすると、FE webページの`Queries`タブでジョブのProfileを表示できます。データキャッシュ関連のメトリクスは以下の通りです：

```sql
-  FileCache:  0ns
    -  BytesScannedFromCache:  2.02  GB
    -  BytesScannedFromRemote:  0.00  
    -  BytesWriteIntoCache:  0.00  
    -  LocalIOUseTimer:  2s723ms
    -  NumLocalIOTotal:  444
    -  NumRemoteIOTotal:  0
    -  NumSkipCacheIOTotal:  0
    -  RemoteIOUseTimer:  0ns
    -  WriteCacheIOUseTimer:  0ns
```
* `BytesScannedFromCache`: ローカルキャッシュから読み取られたデータ量。

* `BytesScannedFromRemote`: リモートから読み取られたデータ量。

* `BytesWriteIntoCache`: キャッシュに書き込まれたデータ量。

* `LocalIOUseTimer`: ローカルキャッシュのIO時間。

* `RemoteIOUseTimer`: リモート読み取りのIO時間。

* `NumLocalIOTotal`: ローカルキャッシュでのIO操作数。

* `NumRemoteIOTotal`: リモートIO操作数。

* `WriteCacheIOUseTimer`: キャッシュへの書き込みのIO時間。

`BytesScannedFromRemote`が0の場合、キャッシュが完全にヒットしていることを意味します。

### 監視メトリクス

ユーザーは、システムテーブル[`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics)を通じて各Backendノードのキャッシュ統計を確認できます。

## Cache Query Limit

> この機能はバージョン4.0.3以降でサポートされています。

Cache Query Limit機能により、ユーザーは単一のクエリが使用できるファイルキャッシュの割合を制限できます。複数のユーザーや複雑なクエリがキャッシュリソースを共有するシナリオでは、単一の大きなクエリが過度にキャッシュ領域を占有し、他のクエリのホットデータが追い出される可能性があります。クエリ制限を設定することで、公正なリソース使用を確保し、キャッシュスラッシングを防ぐことができます。

クエリが占有するキャッシュ領域とは、キャッシュミスによりキャッシュに投入されたデータの総サイズを指します。クエリによって投入された総サイズがクォータ制限に達した場合、そのクエリによって後続に投入されるデータは、LRUアルゴリズムに基づいて以前に投入されたデータを置き換えます。

### 設定

この機能には、BEとFEでの設定、およびセッション変数の設定が含まれます。

**1. BE設定**

- `enable_file_cache_query_limit`:
  - タイプ: Boolean
  - デフォルト: `false`
  - 説明: BE側のファイルキャッシュクエリ制限機能のマスタースイッチ。有効にした場合のみ、BEはFEから渡されたクエリ制限パラメーターを処理します。

**2. FE設定**

- `file_cache_query_limit_max_percent`:
  - タイプ: Integer
  - デフォルト: `100`
  - 説明: セッション変数の上限を検証するために使用される最大クエリ制限制約。ユーザーが設定したクエリ制限がこの値を超えないことを保証します。

**3. セッション変数**

- `file_cache_query_limit_percent`:
  - タイプ: Integer (1-100)
  - 説明: ファイルキャッシュクエリ制限割合。クエリが使用できるキャッシュの最大割合を設定します。この値は`file_cache_query_limit_max_percent`によって制約されます。計算されたキャッシュクォータが256MB未満にならないことを推奨します。この値より低い場合、BEはログに警告を出力します。

**使用例**

```sql
-- Set session variable to limit a query to use at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute query
SELECT * FROM large_table;
```
**注意:**
1. 値は [0, `file_cache_query_limit_max_percent`] の範囲内である必要があります。

## Cache Warmup

Data Cacheは、外部データをBEノードのローカルキャッシュに事前ロードできるキャッシュ「warmup」機能を提供し、それによってキャッシュヒット率と後続の初回クエリのクエリパフォーマンスを向上させます。

> この機能はバージョン4.0.2以降でサポートされています。

### Syntax

```sql
WARM UP SELECT <select_expr_list>
FROM <table_reference>
[WHERE <boolean_expression>]
```
使用制限：

* サポート対象：

  * 単一テーブルクエリ（一つのtable_referenceのみ許可）
  * 指定されたカラムに対するシンプルなSELECT
  * WHERE フィルタリング（通常の述語をサポート）

* サポート対象外：

  * JOIN、UNION、サブクエリ、CTE
  * GROUP BY、HAVING、ORDER BY
  * LIMIT
  * INTO OUTFILE
  * マルチテーブル / 複雑なクエリプラン
  * その他の複雑な構文

### 例

1. テーブル全体をウォームアップする

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```
2. パーティションごとに部分列をウォームアップする

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```
3. フィルター条件による部分列のウォームアップ

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```
### 実行結果

`WARM UP SELECT`を実行すると、FEは各BEにタスクを送信します。BEはリモートデータをスキャンし、Data Cacheに書き込みます。

システムは各BEのスキャンおよびキャッシュ書き込み統計を直接返します（注意：統計は一般的に正確ですが、多少の誤差がある場合があります）。例：

```
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| BackendId     | ScanRows  | ScanBytes   | ScanBytesFromLocalStorage | ScanBytesFromRemoteStorage | BytesWriteIntoCache |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| 1755134092928 | 294744184 | 11821864798 | 538154009                 | 11283717130                | 11899799492         |
| 1755134092929 | 305293718 | 12244439301 | 560970435                 | 11683475207                | 12332861380         |
| TOTAL         | 600037902 | 24066304099 | 1099124444                | 22967192337                | 24232660872         |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
```
フィールドの説明：

* ScanRows: スキャンして読み取った行数。
* ScanBytes: スキャンして読み取ったデータ量。
* ScanBytesFromLocalStorage: ローカルキャッシュからスキャンして読み取ったデータ量。
* ScanBytesFromRemoteStorage: リモートストレージからスキャンして読み取ったデータ量。
* BytesWriteIntoCache: このウォームアップ中にData Cacheに書き込まれたデータ量。

## 付録

### 原理

データキャッシュは、アクセスされたリモートデータをローカルのBEノードにキャッシュします。元のデータファイルは、アクセスされたIOサイズに基づいてBlocksに分割され、Blocksはローカルファイル`cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset`に保存され、BlockメタデータはBEノードに保存されます。同じリモートファイルにアクセスする際、dorisはローカルキャッシュにファイルのキャッシュデータが存在するかをチェックし、Blockのoffsetとsizeに基づいて、どのデータをローカルBlockから読み取り、どのデータをリモートから取得するかを決定し、新しく取得したリモートデータをキャッシュします。BEノードが再起動すると、`cache_path`ディレクトリをスキャンしてBlockメタデータを復元します。キャッシュサイズが上限に達すると、LRU原則に従って長時間使用されていないBlocksをクリーンアップします。
