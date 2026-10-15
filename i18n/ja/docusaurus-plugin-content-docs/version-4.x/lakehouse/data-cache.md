---
{
    "title": "Data Cache",
    "language": "ja",
    "description": "Apache Doris Data Cache は、HDFS やオブジェクトストレージのデータをローカルにキャッシュして Lakehouse クエリを高速化します。Hive、Iceberg、Hudi、Paimon テーブルに対するキャッシュのウォームアップ、クエリ単位のキャッシュ書き込み制御、アドミッション制御をサポートします。"
}
---

Data Cache は、リモートストレージシステム（HDFS またはオブジェクトストレージ）から最近アクセスしたデータファイルをローカルディスクにキャッシュし、同じデータに対する後続のクエリを高速化します。同じデータに頻繁にアクセスする場合、リモートデータへのアクセスを繰り返す負荷を回避し、ホットデータに対するクエリ分析の性能と安定性を向上できます。

## 適用シナリオ

Data Cache が機能するのは、Hive、Iceberg、Hudi、Paimon テーブルへのクエリのみです。内部テーブルや、ファイルに基づかない外部テーブル（JDBC、Elasticsearch など）へのクエリには効果がありません。

キャッシュによってクエリ効率が向上するかどうかは、複数の要因に左右されます。適したシナリオは次のとおりです。

* 高速なローカルディスク

  キャッシュディレクトリには、SSD や NVMe などの高速なローカルディスクを使用することを推奨します。機械式ハードディスクの使用は推奨しません。性能を明確に改善するには、ローカルディスクの I/O 帯域幅と IOPS が、ネットワークおよび元のストレージシステムの I/O 帯域幅と IOPS を大幅に上回る必要があります。

* 十分なキャッシュ容量

  Data Cache は LRU 方式でキャッシュを削除します。クエリ対象のデータにホットとコールドの明確な区別がない場合、キャッシュ内のデータが頻繁に更新・置換され、クエリ性能が低下する可能性があります。クエリパターンにホットとコールドの明確な区別があり（たとえば、ほとんどのクエリが当日のデータだけにアクセスし、履歴データにはほとんどアクセスしない場合）、ホットデータを保存するのに十分なキャッシュ容量がある場合に有効化することを推奨します。

* リモートストレージの I/O レイテンシーが不安定

  この状況は通常、HDFS ストレージで発生します。多くの企業では複数の事業部門が同じ HDFS を共有しており、ピーク時の I/O レイテンシーが非常に不安定になることがあります。安定した I/O レイテンシーが必要な場合は、Data Cache の有効化を推奨します。ただし、前述の両方の条件も考慮してください。

## Data Cache の有効化

Doris 4.2 以降、Data Cache はデフォルトで有効です。BE 設定の `enable_file_cache` とセッション変数の `enable_file_cache` は、どちらもデフォルトで `true` です。使用するには、`be.conf` でキャッシュディレクトリを設定します。セッションまたはグローバルでキャッシュを有効化・無効化するには、FE のパラメータを使用します。

### BE の設定

まず、`be.conf` にキャッシュパスを設定し、BE ノードを再起動して設定を反映します。

| パラメータ | 必須 | 説明 |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | いいえ | Data Cache を有効にするかどうか。Doris 4.2 以降はデフォルトで有効です。 |
| `file_cache_path` | はい | キャッシュディレクトリに関する JSON 形式の設定。 |
| `clear_file_cache` | いいえ | デフォルトは false。true の場合、BE ノードの再起動時にキャッシュディレクトリを消去します。 |

`file_cache_path` の設定例：

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```

`path` はキャッシュの保存先パスです。複数のパスを設定できます。各ディスクにはパスを一つだけ設定することを推奨します。

`total_size` はキャッシュ容量の上限で、単位はバイトです。キャッシュ容量を超えると、LRU 方式でキャッシュ済みデータを削除します。

### FE の設定

単一のセッションで Data Cache を有効にするには：

```sql
SET enable_file_cache = true;
```

グローバルに Data Cache を有効にするには：

```sql
SET GLOBAL enable_file_cache = true;
```

外部ファイルのスキャンでキャッシュを経由して読み込むには、BE 設定の `enable_file_cache`、セッション変数の `enable_file_cache`、キャッシュのアドミッション制御がすべて有効である必要があります。このセッション変数は内部テーブルには影響しません。

:::caution[Doris 4.2 以降、File Cache はデフォルトで有効です]

- `file_cache_path` を設定していないストレージ・コンピュート一体型 BE では、`${DORIS_HOME}/file_cache` にキャッシュが作成されます。`total_size` がない場合、ディスク使用率が 85%～88% になるまでキャッシュが増加する可能性があります。容量を制限するには、`file_cache_path` に `total_size` を指定します。以前の動作を維持するには、`enable_file_cache = false` を `be.conf` に設定します。
- BE の設定は永続化されないため、アップグレード後の BE は、`be.conf` にキーが設定されていなければバイナリに組み込まれたデフォルト値を使用します。セッション変数は FE イメージに永続化されるため、旧バージョンからアップグレードしたクラスタでは以前の値が保持されます。アップグレード後に外部テーブルをキャッシュするには、`SET GLOBAL enable_file_cache = true` を実行してください。

:::

## キャッシュの可観測性

### キャッシュヒット率の確認

`set enable_profile=true` を実行してセッション変数を有効にすると、FE の Web ページの `Queries` タブでジョブの Profile を確認できます。Data Cache に関連するメトリクスは次のとおりです。

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

* `BytesScannedFromCache`：ローカルキャッシュから読み込んだデータ量。

* `BytesScannedFromRemote`：リモートから読み込んだデータ量。

* `BytesWriteIntoCache`：キャッシュに書き込んだデータ量。

* `LocalIOUseTimer`：ローカルキャッシュの I/O 時間。

* `RemoteIOUseTimer`：リモート読み込みの I/O 時間。

* `NumLocalIOTotal`：ローカルキャッシュに対する I/O 操作回数。

* `NumRemoteIOTotal`：リモート I/O 操作回数。

* `WriteCacheIOUseTimer`：キャッシュへの書き込みにかかった I/O 時間。

`BytesScannedFromRemote` が 0 の場合、すべての読み込みがキャッシュにヒットしたことを意味します。

### 監視メトリクス

システムテーブル [`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics) を使用すると、各 Backend ノードのキャッシュ統計を確認できます。

## クエリ単位のキャッシュ制限

Doris には、独立した二種類のクエリ単位の Data Cache 制御があります。

| 制御 | 主なパラメータ | 制限に達した後の動作 |
|---|---|---|
| キャッシュ占有率による制限 | `file_cache_query_limit_percent` | キャッシュミス時の書き込みは引き続き許可されます。BE はクエリ単位の LRU レコードやほかのキャッシュキューを通じて領域を解放します。 |
| バイト数のしきい値によるリモートスキャン時のキャッシュ書き込み停止 | `file_cache_query_limit_bytes` | 次のキャッシュブロックの追加で許可済みバイト数がしきい値を超える場合、以降のキャッシュミスではローカルキャッシュに書き込まず、リモートストレージから読み込みます。 |

### キャッシュ占有率による制限

> この機能はバージョン 4.0.3 以降でサポートされます。

キャッシュ占有率の制限は、単一のクエリが各 File Cache インスタンスで使用できる最大割合を制御します。複数のユーザーや複雑なクエリがキャッシュリソースを共有する場合、単一の大規模なクエリがキャッシュを過度に占有し、ほかのホットデータを追い出すリスクを減らします。

この機能には、BE と FE の設定、およびセッション変数の設定が必要です。

**1. BE の設定**

- `enable_file_cache_query_limit`：
  - 型：Boolean
  - デフォルト：`false`
  - 説明：BE 側で File Cache のクエリ制限機能を有効にするマスタースイッチです。有効にした場合にのみ、BE は FE から渡されたクエリ制限パラメータを処理します。

**2. FE の設定**

- `file_cache_query_limit_max_percent`：
  - 型：Integer
  - デフォルト：`100`
  - 説明：セッション変数の上限を検証するために使用する、クエリ制限の最大値です。

**3. セッション変数**

- `file_cache_query_limit_percent`：
  - 型：Integer（1-100）
  - デフォルト：`-1`
  - 説明：クエリが使用できるキャッシュの最大割合です。`file_cache_query_limit_max_percent` によって制限されます。計算されたキャッシュ割り当ては 256 MB 以上である必要があり、それ未満の場合は BE がログに警告を書き込みます。

**使用例**

```sql
-- Set the session variable to limit a query to at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute the query
SELECT * FROM large_table;
```

**注意事項：**

1. 値は `[1, file_cache_query_limit_max_percent]` の範囲内である必要があります。
2. この制御を使用する前に、BE で `enable_file_cache` と `enable_file_cache_query_limit` の両方を有効にし、クエリセッションで `enable_file_cache` が `true` であることを確認してください。
3. 割合による割り当て量に達した後も、キャッシュミス時に Data Cache への書き込みは可能です。この制御によって、クエリが以降の書き込みを停止するモードに切り替わることはありません。

### バイト数のしきい値によるリモートスキャン時のキャッシュ書き込み停止

> この機能は Doris 4.1.x でのみサポートされます。Doris 4.0.x ではサポートされません。

ストレージ・コンピュート分離モードでは、セッション変数 `file_cache_query_limit_bytes` により、Hive、Iceberg、Hudi、Paimon のデータファイルでキャッシュミスが発生した際、単一の SELECT クエリについて **各 BE** の Data Cache への書き込みが許可される累積バイト数を制限します。BE で `enable_file_cache=true` が必要ですが、`enable_file_cache_query_limit` や `file_cache_query_limit_max_percent` には依存しません。

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `file_cache_query_limit_bytes` | BigInt | `-1` | 各 BE で単一のクエリに適用する、リモートスキャン時のキャッシュ書き込みしきい値（バイト単位）。`0` 未満の値では制御が無効になり、`0` ではクエリ開始時からキャッシュへの書き込みが無効になります。正の値では、キャッシュブロック単位で許可済みバイト数を累積します。 |

同じクエリの並列スキャナーは、BE 上で単一のしきい値を共有します。このしきい値は、クエリ全体やクラスタ全体の合計値ではありません。次のキャッシュブロックを追加すると許可済みバイト数がしきい値を超える場合、その BE 上でクエリはキャッシュミス時にリモートからのみ読み込むモードに切り替わります。要求範囲がローカルキャッシュで完全にカバーされている場合は、引き続きローカルから読み込めます。完全にカバーされていない範囲は、Data Cache に書き込まずにリモートストレージから直接読み込みます。クエリ結果は変わりません。

次の例では、各 BE でリモートスキャン時のキャッシュ書き込みしきい値を 1 GiB に設定します。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM hive_catalog.sales.orders;
```

一度限りのスキャンでクエリ開始時から Data Cache への書き込みを防ぐには、しきい値を `0` に設定し、クエリ後にデフォルト値に戻します。

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM hive_catalog.sales.orders;

SET file_cache_query_limit_bytes = -1;
```

Query Profile を有効にした後、`RemoteOnlyOnMissTriggered` と `RemoteOnlyOnMissThresholdBytes` を Scanner の `FileCache` メトリクスグループで確認します。`RemoteOnlyOnMissTriggered=1` の場合、その Scanner は、クエリがキャッシュミス時にリモートからのみ読み込むモードへ切り替わったことを検知しています。実際の書き込みとキャッシュをスキップした I/O を確認するには、`BytesWriteIntoCache` と `NumSkipCacheIOTotal` を使用します。`NumSkipCacheIOTotal` にはほかのキャッシュポリシーによってスキップされた I/O も含まれるため、この値だけではしきい値に達したことの証明にはなりません。

:::note

- この制御が適用されるのは、ストレージ・コンピュート分離モードで SELECT クエリのキャッシュミス後に Data Cache へ書き込む場合だけです。リモートから読み込むバイト数を制限したり、明示的なキャッシュのウォームアップに影響したりすることはありません。キャッシュミス時にリモートからのみ読み込むモードでは、リモート I/O とクエリのレイテンシーが増加する可能性があります。
- 書き込みの許可はキャッシュブロック単位で評価されます。残りの許容量が次のブロックより小さい場合、そのブロック全体がスキップされます。`RemoteOnlyOnMissTriggered` が `1` に変わるのは、ブロックによってしきい値を超える場合だけです。
- BE パラメータ `enable_file_cache_query_limit_segment_meta` は、Doris の内部テーブルの Segment フッターと Segment メタデータの書き込みを同じしきい値に算入するかどうかを制御します。Hive、Iceberg、Hudi、Paimon のデータファイルに対するキャッシュ書き込みには、常に `file_cache_query_limit_bytes` が適用されます。パラメータの適用範囲と内部テーブルでの動作については、[File Cache の設定と使用ガイド](../compute-storage-decoupled/file-cache/file-cache.md)を参照してください。

:::

## キャッシュのウォームアップ

Data Cache には、外部データを BE ノードのローカルキャッシュへ事前に読み込む「ウォームアップ」機能があります。これにより、その後に初めて実行するクエリのキャッシュヒット率と性能を向上できます。

> この機能はバージョン 4.0.2 以降でサポートされます。

### 構文

```sql
WARM UP SELECT <select_expr_list>
FROM <table_reference>
[WHERE <boolean_expression>]
```

使用上の制限：

* サポート対象：

  * 単一テーブルのクエリ（指定できる table_reference は一つのみ）
  * 指定した列に対する単純な SELECT
  * WHERE による絞り込み（通常の述語をサポート）

* サポート対象外：

  * JOIN、UNION、サブクエリ、CTE
  * GROUP BY、HAVING、ORDER BY
  * LIMIT
  * INTO OUTFILE
  * 複数テーブルや複雑なクエリプラン
  * その他の複雑な構文

### 例

1. テーブル全体をウォームアップする

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```

2. パーティションで絞り込み、一部の列をウォームアップする

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```

3. フィルター条件で絞り込み、一部の列をウォームアップする

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```

### 実行結果

`WARM UP SELECT` を実行すると、FE は各 BE にタスクを割り当てます。BE はリモートデータをスキャンして Data Cache に書き込みます。

システムは各 BE のスキャンとキャッシュ書き込みの統計を直接返します（注：統計は通常は正確ですが、多少の誤差が生じる場合があります）。例：

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

* `ScanRows`：スキャンして読み込んだ行数。
* `ScanBytes`：スキャンして読み込んだデータ量。
* `ScanBytesFromLocalStorage`：ローカルキャッシュからスキャンして読み込んだデータ量。
* `ScanBytesFromRemoteStorage`：リモートストレージからスキャンして読み込んだデータ量。
* `BytesWriteIntoCache`：このウォームアップ中に Data Cache へ書き込んだデータ量。

## キャッシュのアドミッション制御

> これは実験的な機能であり、バージョン 4.1.0 以降でサポートされます。

キャッシュのアドミッション制御を使用すると、ユーザー、Catalog、Database、Table などの条件に基づいて、クエリが読み込んだデータを File Cache（Data Cache）に入れることを許可するかどうかを制御できます。
大量のコールドデータを読み込む場合（大規模な ETL ジョブや負荷の高いアドホッククエリなど）、読み込んだすべてのデータをキャッシュに入れると、既存のホットデータが頻繁に追い出される「キャッシュ汚染」が起こり、キャッシュヒット率や全体的なクエリ性能が低下する可能性があります。この機能を有効にすると、キャッシュへの取り込みが拒否されたデータは、基盤となるリモートストレージ（HDFS、S3 など）から直接取得され、重要なホットデータがキャッシュから追い出されるのを防ぎます。

キャッシュのアドミッション制御はデフォルトで無効です。使用するには、FE で関連パラメータを設定して有効にする必要があります。

### FE の設定

`fe.conf` でこの機能を有効にし、ルール設定ファイルのパスを指定してから、FE ノードを再起動して反映します。ルールファイル自体への変更は動的に読み込まれます。

| パラメータ | 必須 | 説明 |
| ----------------------------------------------- | -------- |-------------------------------------------|
| `enable_file_cache_admission_control` | はい | キャッシュのアドミッション制御を有効にするかどうか。デフォルトは `false` です。 |
| `file_cache_admission_control_json_dir` | はい | アドミッションルールの JSON ファイルを保存するディレクトリのパス。このディレクトリ内のすべての `.json` ファイルが自動的に読み込まれ、ルールの追加、削除、変更は**動的に反映されます**。 |

### アドミッションルールの設定形式

ルール設定は、`.json` ファイルとして `file_cache_admission_control_json_dir` ディレクトリに配置します。ファイルの内容は JSON 配列形式である必要があります。

#### フィールドの説明

| フィールド名 | 型 | 説明 | 例 |
|--------|------|-------------------------------|-----------------------|
| `id` | Long | ルール ID。 | `1` |
| `user_identity` | String | ユーザー ID（形式：`user@host`。たとえば `%` はすべての IP に一致）。**空欄または省略した場合は、すべてのユーザーに一致します。** | `"root@%"` |
| `catalog_name` | String | Catalog 名。**空欄または省略した場合は、すべての Catalog に一致します。** | `"hive_cat"` |
| `database_name` | String | Database 名。**空欄または省略した場合は、すべての Database に一致します。** | `"db1"` |
| `table_name` | String | Table 名。**空欄または省略した場合は、すべての Table に一致します。** | `"tbl1"` |
| `partition_pattern` | String | （未実装）パーティションの正規表現。空欄の場合はすべてのパーティションに一致します。 | `""` |
| `rule_type` | Integer | ルール種別：`0` はキャッシュ拒否（ブラックリスト）、`1` はキャッシュ許可（ホワイトリスト）。 | `0` |
| `enabled` | Integer | 現在のルールが有効かどうか：`0` は無効、`1` は有効。 | `1` |
| `created_time` | Long | 作成時刻（UNIX タイムスタンプ、秒）。 | `1766557246` |
| `updated_time` | Long | 更新時刻（UNIX タイムスタンプ、秒）。 | `1766557246` |

#### JSON ファイルの例

```json
[
  {
    "id": 1,
    "user_identity": "root@%",
    "catalog_name": "hive_cat",
    "database_name": "db1",
    "table_name": "table1",
    "partition_pattern": "",
    "rule_type": 0,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  },
  {
    "id": 2,
    "user_identity": "",
    "catalog_name": "hive_cat",
    "database_name": "",
    "table_name": "",
    "partition_pattern": "",
    "rule_type": 1,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  }
]
```

#### MySQL からルールをインポートする

システム連携の自動化が必要なユーザー向けに、Doris のソースコードリポジトリには補助スクリプト `tools/export_mysql_rule_to_json.sh` が用意されています。このスクリプトを使用すると、MySQL データベースのテーブルに事前保存されたキャッシュのアドミッションルールを、上記の形式に従った JSON 設定ファイルにエクスポートできます。

### ルールのマッチング原則

#### ルールの適用範囲

各フィールド（`user_identity`、`catalog_name`、`database_name`、`table_name`）に空値または特定の値を組み合わせることで、システムは 7 種類の有効なルールの適用範囲をサポートします。**階層間の依存関係に従わないルール設定（たとえば、Database を指定せずに Table だけを指定する設定）は無効とみなされます。**

| user_identity | catalog_name | database_name | table_name | レベルと適用範囲 |
|---------------|--------------|---------------|------------|------------------|
| **指定あり** | **指定あり** | **指定あり** | **指定あり** | 指定ユーザーに対するテーブル単位のルール |
| 空欄または省略 | **指定あり** | **指定あり** | **指定あり** | 全ユーザーに対するテーブル単位のルール |
| **指定あり** | **指定あり** | **指定あり** | 空欄または省略 | 指定ユーザーに対する Database 単位のルール |
| 空欄または省略 | **指定あり** | **指定あり** | 空欄または省略 | 全ユーザーに対する Database 単位のルール |
| **指定あり** | **指定あり** | 空欄または省略 | 空欄または省略 | 指定ユーザーに対する Catalog 単位のルール |
| 空欄または省略 | **指定あり** | 空欄または省略 | 空欄または省略 | 全ユーザーに対する Catalog 単位のルール |
| **指定あり** | 空欄または省略 | 空欄または省略 | 空欄または省略 | 指定ユーザーに対するグローバルルール |

#### マッチングの優先順位と順序

クエリがテーブルのデータにアクセスすると、システムはすべてのルールを総合的に評価し、キャッシュへの取り込みを判断します。判定は次の原則に従います。

1. **具体的なルールを優先**：Table → Database → Catalog → Global の順に、具体的な階層から広い階層へマッチングします。最も具体的な階層（Table 単位など）で一致すると、そこで判定を終了します。
2. **ブラックリストを優先（安全性の原則）**：同じ階層では、**キャッシュ拒否ルールがキャッシュ許可ルールより常に優先されます**。ブラックリストとホワイトリストが同時に一致した場合は、ブラックリストが優先され、同じ階層での拒否が先に適用されます。

判定の全体的な順序は次のとおりです。

```text
1. Table-level rule matching
   a) Hit Blacklist (rule_type=0) -> Deny
   b) Hit Whitelist (rule_type=1) -> Allow
2. Database-level rule matching
   ...
3. Catalog-level rule matching
   ...
4. Global rule matching (only user_identity matched)
   ...
5. Default fallback decision: If no rules at any level above match, caching is [Denied] by default (equivalent to a global blacklist).
```

> **ヒント**：システムのフォールバックではデフォルトでキャッシュを拒否します。そのため、この機能を導入する際は、通常、広い範囲に適用する許可ルール（全ユーザーや重要な業務用 Catalog に対するホワイトリストなど）を設定したうえで、オフラインの全表スキャンが行われる大規模なテーブルに対し、限定的なテーブル単位のブラックリストを設定することを推奨します。これにより、コールドデータとホットデータを細かく区別できます。

### キャッシュ判定の確認

設定を有効化して適用した後は、`EXPLAIN` コマンドを使用して、単一テーブルのファイルデータ単位でキャッシュへの取り込み判定の詳細を確認できます（以下の `file cache request` 出力を参照）。

```text
|   0:VHIVE_SCAN_NODE(74)                                                                                          |
|      table: test_file_cache_features.tpch1_parquet.lineitem                                                      |
|      inputSplitNum=10, totalFileSize=205792918, scanRanges=10                                                    |
|      partition=1/1                                                                                               |
|      cardinality=1469949, numNodes=1                                                                             |
|      pushdown agg=NONE                                                                                           |
|      file cache request ADMITTED: user_identity:root@%, reason:user table-level whitelist rule, cost:0.058 ms    |
|      limit: 1                                                                                                    |
```

主なフィールドと判定内容：
- **ADMITTED** / **DENIED**：リクエストのデータをキャッシュに入れることを許可（ADMITTED）するか、拒否（DENIED）するかを示します。
- **user_identity**：クエリ実行時に検証されたユーザー ID。
- **reason**：判定の理由となった一致ルール。一般的な出力には、`user table-level whitelist rule`（この例では、指定ユーザーに対するテーブル単位のホワイトリスト）や `common table-level blacklist rule`（全ユーザーに対するテーブル単位のブラックリスト）があります。形式は通常、`[Scope] [Rule Level] [Rule Type] rule` です。
- **cost**：アドミッションルールのマッチング判定全体にかかった時間（ミリ秒）。負荷が大きすぎる場合は、ルールの階層数を調整して最適化できます。

## 付録

### 仕組み

Data Cache は、アクセスしたリモートデータをローカルの BE ノードにキャッシュします。元のデータファイルはアクセス時の I/O サイズに基づいて Block に分割され、各 Block はローカルファイル `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset` に保存されます。Block のメタデータは BE ノードに保存されます。同じリモートファイルにアクセスすると、Doris はファイルのキャッシュデータがローカルに存在するかどうかを確認します。Block のオフセットとサイズに基づいて、ローカルの Block から読み込むデータとリモートから取得するデータを判断し、新たに取得したリモートデータをキャッシュします。BE ノードが再起動すると、`cache_path` ディレクトリをスキャンして Block のメタデータを復元します。キャッシュ容量が上限に達すると、LRU 方式に従って長期間使用されていない Block を削除します。
