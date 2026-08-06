---
{
  "title": "データキャッシュ",
  "language": "ja",
  "description": "データキャッシュは、HDFSまたはオブジェクトストレージのデータをローカルにキャッシュしてLakehouseクエリを高速化し、ウォームアップ、クエリ単位のキャッシュ書き込み制限、およびキャッシュアドミッション制御をサポートします。"
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

Doris には、クエリ単位でData Cacheを制御する独立した2つの方式があります。

| 制御方式 | 主なパラメータ | 制限到達後の動作 |
|---|---|---|
| キャッシュ占有率による制限 | `file_cache_query_limit_percent` | キャッシュミス時の書き込みを継続しながら、BEはクエリ単位のLRU記録と他のキャッシュキューを使用して領域を解放します |
| リモートスキャンの書き込みをバイト閾値で停止 | `file_cache_query_limit_bytes` | 次のキャッシュブロックによって許可済みバイト数が閾値を超える場合、後続のキャッシュミスはリモートストレージから読み取られ、ローカルキャッシュには書き込まれません |

### キャッシュ占有率による制限

> この機能はバージョン4.0.3以降でサポートされています。

キャッシュ占有率による制限は、単一クエリが各File Cacheインスタンスで使用できる最大割合を制御します。複数のユーザーや複雑なクエリがキャッシュリソースを共有する場合に、1つの大規模クエリが過剰なキャッシュを保持して他のホットデータを削除するリスクを軽減します。

この機能には、BE設定、FE設定、およびセッション変数が関係します。

**1. BE設定**

- `enable_file_cache_query_limit`:
  - 型: Boolean
  - デフォルト値: `false`
  - 説明: BE側のFile Cacheクエリ制限のマスタースイッチです。有効な場合のみ、BEはFEから渡されたクエリ制限パラメータを処理します。

**2. FE設定**

- `file_cache_query_limit_max_percent`:
  - 型: Integer
  - デフォルト値: `100`
  - 説明: セッション変数の上限を検証するために使用されるクエリ制限の最大値です。

**3. セッション変数**

- `file_cache_query_limit_percent`:
  - 型: Integer (1-100)
  - デフォルト値: `-1`
  - 説明: クエリが使用できるキャッシュの最大割合です。この値は `file_cache_query_limit_max_percent` によって制約されます。算出されたキャッシュクォータは256 MB以上を推奨します。これより小さい場合、BEはログに警告を出力します。

**使用例**

```sql
-- 単一クエリが使用できるキャッシュを最大50%に制限する
SET file_cache_query_limit_percent = 50;

-- クエリを実行する
SELECT * FROM large_table;
```

**注意事項:**

1. 値は `[1, file_cache_query_limit_max_percent]` の範囲内である必要があります。
2. この制御を使用する前に、BEで `enable_file_cache` と `enable_file_cache_query_limit` の両方を有効にし、クエリセッションの `enable_file_cache` が `true` であることを確認してください。
3. キャッシュ占有率の上限に達した後も、キャッシュミスはData Cacheへ書き込むことができます。この制御によって、クエリが「以降はキャッシュへ書き込まない」モードに切り替わることはありません。

### リモートスキャンのキャッシュ書き込みをバイト閾値で停止する

> この機能は Doris 4.1.x でのみサポートされます。Doris 4.0.x ではサポートされません。

ストレージ・コンピューティング分離モードでは、セッション変数 `file_cache_query_limit_bytes` により、Hive、Iceberg、Hudi、またはPaimonのデータファイルのキャッシュミスによってData Cacheへの書き込みを許可された累積バイト数を、単一のSELECTクエリについて**各BE**で制限できます。この機能にはBEの `enable_file_cache=true` が必要ですが、`enable_file_cache_query_limit` または `file_cache_query_limit_max_percent` には依存しません。

| パラメータ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `file_cache_query_limit_bytes` | BigInt | `-1` | 単一クエリについて、各BEで許可するリモートスキャンのキャッシュ書き込み閾値です。単位はバイトです。`0`未満では無効、`0`ではクエリ開始時からキャッシュへ書き込まず、正の値ではキャッシュブロック単位で許可済みバイト数を累積します |

同一クエリの並列Scannerは、1つのBE上で同じ閾値を共有します。この閾値はクエリ全体またはクラスタ全体の合計値ではありません。次のキャッシュブロックによって許可済みバイト数が閾値を超える場合、そのBE上でクエリはremote-only-on-miss状態になります。要求範囲がローカルキャッシュで完全にカバーされている場合はローカルから読み取れます。完全にカバーされていない範囲はリモートストレージから直接読み取り、Data Cacheへ書き込みません。クエリ結果は変わりません。

次の例では、各BEのリモートスキャンキャッシュ書き込み閾値を1 GiBに設定します。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM hive_catalog.sales.orders;
```

一時的なスキャンで最初からData Cacheへ書き込みたくない場合は閾値を `0` に設定し、クエリ終了後にデフォルト値へ戻します。

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM hive_catalog.sales.orders;

SET file_cache_query_limit_bytes = -1;
```

Query Profileを有効にした後、Scannerの `FileCache` メトリックグループで `RemoteOnlyOnMissTriggered` と `RemoteOnlyOnMissThresholdBytes` を確認します。`RemoteOnlyOnMissTriggered=1` の場合、そのScannerがクエリのremote-only-on-miss状態への移行を確認したことを示します。`BytesWriteIntoCache` と `NumSkipCacheIOTotal` を使用して、実際の書き込みとキャッシュをスキップしたI/Oを確認できます。`NumSkipCacheIOTotal` には他のキャッシュポリシーによってスキップされたI/Oも含まれるため、この値だけでは閾値が発動したことを判断できません。

:::note

- この制御は、ストレージ・コンピューティング分離モードのSELECTクエリで、キャッシュミス後にData Cacheへ書き込む動作のみを制限します。リモート読み取り量を制限せず、明示的なキャッシュウォームアップにも影響しません。remote-only-on-miss状態では、リモートI/Oとクエリレイテンシが増加する可能性があります。
- 許可判定はキャッシュブロック単位で行われます。残りの容量が次のブロックより小さい場合、そのブロック全体がスキップされます。`RemoteOnlyOnMissTriggered` は、あるブロックによって閾値を超える場合にのみ `1` になります。
- BEパラメータ `enable_file_cache_query_limit_segment_meta` は、Doris内部テーブルのSegment footerとSegmentメタデータの書き込みを同じ閾値に含めるかどうかを制御します。Hive、Iceberg、Hudi、およびPaimonのデータファイルのキャッシュ書き込みは常に `file_cache_query_limit_bytes` の対象です。パラメータの完全な適用範囲と内部テーブルの動作については、[ファイルキャッシュの設定と使用ガイド](../compute-storage-decoupled/file-cache/file-cache.md)を参照してください。

:::

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
