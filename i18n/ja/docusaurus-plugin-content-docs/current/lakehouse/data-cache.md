---
{
    "title": "Data Cache",
    "language": "ja",
    "description": "Apache Doris の Data Cache は、HDFS やオブジェクトストレージのデータをローカルにキャッシュし、Lakehouse クエリを高速化します。Hive、Iceberg、Hudi、Paimon のテーブルに対して、キャッシュのウォームアップ、クエリ単位のキャッシュ書き込み制御、キャッシュへの受け入れ制御をサポートします。"
}
---

Data Cache は、リモートストレージ（HDFS またはオブジェクトストレージ）にある、最近アクセスされたデータファイルをローカルディスクにキャッシュし、同じデータに対する後続のクエリを高速化します。同じデータに頻繁にアクセスする場合、リモートデータへの繰り返しのアクセスを避けられるため、頻繁に参照されるデータに対するクエリ分析の性能と安定性が向上します。

## 適用できる場面

Data Cache は、Hive、Iceberg、Hudi、Paimon のテーブルに対するクエリでのみ機能します。内部テーブルのクエリや、ファイルを使用しない外部テーブル（JDBC、Elasticsearch など）のクエリには効果がありません。

データキャッシュによってクエリ効率が向上するかどうかは、複数の要因によって決まります。適用に適した条件を以下に示します。

* 高速なローカルディスク

  キャッシュディレクトリには、SSD や NVME などの高速なローカルディスクを使用することを推奨します。機械式ハードディスクは推奨しません。性能が目に見えて向上するには、ローカルディスクの IO 帯域幅と IOPS が、ネットワーク帯域幅および元のストレージシステムの IO 帯域幅と IOPS を大幅に上回る必要があります。

* 十分なキャッシュ容量

  データキャッシュは、キャッシュの退避ポリシーとして LRU を使用します。クエリ対象のデータに明確なホット・コールドの区別がない場合、キャッシュデータが頻繁に入れ替わり、クエリ性能が低下することがあります。クエリパターンに明確なホット・コールドの区別があり（例えば、大半のクエリが当日のデータのみを参照し、過去のデータを参照することはまれ）、ホットデータを格納するのに十分なキャッシュ容量がある場合に、データキャッシュを有効にすることを推奨します。

* リモートストレージの IO レイテンシーが不安定

  この状況は通常、HDFS ストレージで発生します。多くの企業では、異なる事業部門が同じ HDFS を共有しており、ピーク時の IO レイテンシーが非常に不安定になることがあります。この場合、安定した IO レイテンシーが必要であれば、データキャッシュを有効にすることを推奨します。ただし、前述の二つの条件も考慮してください。

## Data Cache の有効化

Doris 4.2 以降、Data Cache はデフォルトで有効です。BE 設定の `enable_file_cache` とセッション変数の `enable_file_cache` は、どちらもデフォルトで `true` です。使用するには、`be.conf` でキャッシュディレクトリを設定します。セッション単位またはグローバルでキャッシュを有効・無効にするには、FE のパラメータを使用します。

### BE の設定

まず `be.conf` でキャッシュパスを設定し、設定を反映するために BE ノードを再起動します。

| パラメータ            | 必須 | 説明                              |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | いいえ   | Data Cache を有効にするかどうか。Doris 4.2 以降、デフォルトで有効です。               |
| `file_cache_path`   | はい   | キャッシュディレクトリに関する設定。JSON 形式で指定します。                      |
| `clear_file_cache`  | いいえ   | デフォルトは false です。true の場合、BE ノードの再起動時にキャッシュディレクトリが消去されます。 |

`file_cache_path` の設定例：

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```

`path` はキャッシュの保存先パスです。一つ以上のパスを設定できます。ディスクごとに一つのパスのみを設定することを推奨します。

`total_size` はキャッシュ容量の上限で、単位はバイトです。キャッシュ容量を超えた場合は、LRU によってキャッシュデータが退避されます。

### FE の設定

単一セッションで Data Cache を有効にするには：

```sql
SET enable_file_cache = true;
```

グローバルに Data Cache を有効にするには：

```sql
SET GLOBAL enable_file_cache = true;
```

外部ファイルのスキャンでキャッシュ経由の読み取りが行われるのは、BE 設定の `enable_file_cache`、セッション変数の `enable_file_cache`、キャッシュへの受け入れ制御がすべて有効な場合だけです。セッション変数は内部テーブルには影響しません。

:::caution[Doris 4.2 以降、File Cache はデフォルトで有効]

- ストレージとコンピュートが結合された BE で `file_cache_path` を設定していない場合、キャッシュは `${DORIS_HOME}/file_cache` に作成されます。`total_size` が指定されていないと、ディスク使用率が 85%～88% になるまで増え続ける可能性があります。容量を制限するには `file_cache_path` で `total_size` を指定してください。以前の動作を維持するには、`enable_file_cache = false` を `be.conf` に設定してください。
- BE の設定は永続化されません。そのため、`be.conf` に設定項目がない場合、アップグレード後の BE はバイナリに組み込まれたデフォルト値を使用します。セッション変数は FE イメージに永続化されるため、旧バージョンからアップグレードしたクラスタでは以前の値が維持されます。アップグレード後に外部テーブルをキャッシュするには、`SET GLOBAL enable_file_cache = true` を実行してください。

:::

## キャッシュの状態を確認する

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

* `BytesScannedFromCache`：ローカルキャッシュから読み取ったデータ量。

* `BytesScannedFromRemote`：リモートから読み取ったデータ量。

* `BytesWriteIntoCache`：キャッシュに書き込んだデータ量。

* `LocalIOUseTimer`：ローカルキャッシュの IO 時間。

* `RemoteIOUseTimer`：リモート読み取りの IO 時間。

* `NumLocalIOTotal`：ローカルキャッシュに対する IO 操作の回数。

* `NumRemoteIOTotal`：リモート IO 操作の回数。

* `WriteCacheIOUseTimer`：キャッシュへの書き込みにかかった IO 時間。

`BytesScannedFromRemote` が 0 の場合、すべての読み取りがキャッシュにヒットしたことを意味します。

### 監視メトリクス

各 Backend ノードのキャッシュ統計は、システムテーブル [`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics) で確認できます。

## クエリ単位のキャッシュ制限

Doris には、クエリ単位で Data Cache を制御する独立した二つの方法があります。

| 制御方法 | 主なパラメータ | 制限到達後の動作 |
|---|---|---|
| キャッシュ占有率による制限 | `file_cache_query_limit_percent` | キャッシュミス時の書き込みは引き続き可能です。BE はクエリ単位の LRU 記録やその他のキャッシュキューを通じて空き領域を確保します |
| バイト数のしきい値によるリモートスキャンのキャッシュ書き込み停止 | `file_cache_query_limit_bytes` | 次のキャッシュブロックを追加すると受け入れ済みバイト数がしきい値を超える場合、それ以降のキャッシュミスではローカルキャッシュに書き込まずにリモートストレージから読み取ります |

### キャッシュ占有率による制限

> この機能はバージョン 4.0.3 以降でサポートされています。

キャッシュ占有率の制限により、単一のクエリが各 File Cache インスタンスで使用できるキャッシュの最大割合を制御します。複数のユーザーや複雑なクエリがキャッシュリソースを共有する場合に、単一の大きなクエリが過剰なキャッシュを保持して他のホットデータを退避させるリスクを減らします。

この機能には、BE と FE の設定、およびセッション変数の設定が必要です。

**1. BE の設定**

- `enable_file_cache_query_limit`：
  - 型：Boolean
  - デフォルト：`false`
  - 説明：BE 側で File Cache のクエリ制限機能を有効にするマスタースイッチです。有効な場合にのみ、BE は FE から渡されたクエリ制限パラメータを処理します。

**2. FE の設定**

- `file_cache_query_limit_max_percent`：
  - 型：Integer
  - デフォルト：`100`
  - 説明：セッション変数の上限を検証するために使用する、クエリ制限の最大値です。

**3. セッション変数**

- `file_cache_query_limit_percent`：
  - 型：Integer (1-100)
  - デフォルト：`-1`
  - 説明：クエリが使用できるキャッシュの最大割合です。この値は `file_cache_query_limit_max_percent` によって制限されます。算出されるキャッシュ割り当て量は 256 MB 以上である必要があり、満たさない場合、BE はログに警告を書き込みます。

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
3. 割合による割り当て量に達した後も、キャッシュミス時に Data Cache への書き込みが可能です。この制御によって、そのクエリの書き込みが停止するわけではありません。

### バイト数のしきい値によるリモートスキャンのキャッシュ書き込み停止

コンピュートとストレージを分離したモードでは、セッション変数 `file_cache_query_limit_bytes` により、**各 BE** で単一の SELECT クエリが Hive、Iceberg、Hudi、Paimon のデータファイルを読み取る際に発生したキャッシュミスについて、Data Cache に書き込む累積バイト数を制限します。BE で `enable_file_cache=true` を設定する必要がありますが、`enable_file_cache_query_limit` や `file_cache_query_limit_max_percent` には依存しません。

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `file_cache_query_limit_bytes` | BigInt | `-1` | 各 BE で単一のクエリに適用する、リモートスキャンのキャッシュ書き込みしきい値（バイト）。`0` 未満の値ではこの制御が無効になり、`0` ではクエリ開始時からキャッシュへの書き込みが無効になります。正の値では、受け入れたバイト数をキャッシュブロック単位で積算します |

同じクエリの並列スキャナーは、単一の BE 上で共通のしきい値を使用します。このしきい値は、クエリ全体やクラスタ全体の合計値ではありません。次のキャッシュブロックを追加すると受け入れ済みバイト数がしきい値を超える場合、その BE 上のクエリはキャッシュミス時にリモートからのみ読み取るモードに移行します。要求範囲全体がローカルキャッシュに存在する場合は引き続きローカルから読み取れますが、範囲全体が存在しない場合は Data Cache に書き込まずにリモートストレージから直接読み取ります。クエリ結果は変わりません。

次の例では、各 BE に 1 GiB のリモートスキャンのキャッシュ書き込みしきい値を設定します。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM hive_catalog.sales.orders;
```

一回限りのスキャンで最初から Data Cache への書き込みを防ぐには、しきい値を `0` に設定し、クエリ後にデフォルト値に戻します。

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM hive_catalog.sales.orders;

SET file_cache_query_limit_bytes = -1;
```

Query Profile を有効にした後、`RemoteOnlyOnMissTriggered` と `RemoteOnlyOnMissThresholdBytes` を Scanner の `FileCache` メトリクスグループで確認します。`RemoteOnlyOnMissTriggered=1` は、その Scanner がクエリのキャッシュミス時にリモートからのみ読み取るモードへの移行を観測したことを示します。実際の書き込み量とキャッシュをスキップした IO は、`BytesWriteIntoCache` と `NumSkipCacheIOTotal` で確認します。`NumSkipCacheIOTotal` には他のキャッシュポリシーによってスキップされた IO も含まれるため、この値だけではしきい値への到達を証明できません。

:::note

- この制御が適用されるのは、コンピュートとストレージを分離したモードで、SELECT クエリのキャッシュミス後に行われる Data Cache への書き込みだけです。リモートから読み取るバイト数を制限したり、明示的なキャッシュウォームアップに影響したりすることはありません。キャッシュミス時にリモートからのみ読み取るモードでは、リモート IO やクエリレイテンシーが増える可能性があります。
- 受け入れの判定はキャッシュブロック単位です。残りの割り当て量が次のブロックより小さい場合、そのブロック全体がスキップされます。`RemoteOnlyOnMissTriggered` が `1` になるのは、ブロックの追加によってしきい値を超える場合だけです。
- BE パラメータ `enable_file_cache_query_limit_segment_meta` は、Doris の内部テーブルの Segment フッターと Segment メタデータの書き込みを同じしきい値に算入するかどうかを制御します。Hive、Iceberg、Hudi、Paimon のデータファイルへのキャッシュ書き込みには、常に `file_cache_query_limit_bytes` が適用されます。パラメータの適用範囲全体と内部テーブルでの動作については、[File Cache の設定と使用ガイド](../compute-storage-decoupled/file-cache/file-cache.md)を参照してください。

:::

## キャッシュのウォームアップ

Data Cache には、外部データを BE ノードのローカルキャッシュに事前に読み込む「ウォームアップ」機能があります。これにより、後続の初回クエリにおけるキャッシュヒット率とクエリ性能を向上できます。

> この機能はバージョン 4.0.2 以降でサポートされています。

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
  * WHERE によるフィルタリング（通常の述語をサポート）

* サポート対象外：

  * JOIN、UNION、サブクエリ、CTE
  * GROUP BY、HAVING、ORDER BY
  * LIMIT
  * INTO OUTFILE
  * 複数テーブル／複雑なクエリプラン
  * その他の複雑な構文

### 例

1. テーブル全体をウォームアップする

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```

2. パーティションを指定して一部の列をウォームアップする

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```

3. フィルター条件を指定して一部の列をウォームアップする

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```

### 実行結果

`WARM UP SELECT` を実行すると、FE は各 BE にタスクを割り当てます。BE はリモートデータをスキャンし、Data Cache に書き込みます。

システムは、BE ごとのスキャンとキャッシュ書き込みの統計を直接返します（注：統計は通常おおむね正確ですが、多少の誤差が生じる場合があります）。例：

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

* `ScanRows`：スキャンして読み取った行数。
* `ScanBytes`：スキャンして読み取ったデータ量。
* `ScanBytesFromLocalStorage`：ローカルキャッシュからスキャンして読み取ったデータ量。
* `ScanBytesFromRemoteStorage`：リモートストレージからスキャンして読み取ったデータ量。
* `BytesWriteIntoCache`：このウォームアップ中に Data Cache に書き込んだデータ量。

## キャッシュへの受け入れ制御

> これは実験的な機能で、バージョン 4.1.0 以降でサポートされています。

キャッシュへの受け入れ制御を使用すると、User、Catalog、Database、Table などの条件に基づき、クエリが読み取ったデータを File Cache（Data Cache）に受け入れるかどうかを制御できます。
大規模な ETL ジョブや重いアドホッククエリなど、大量のコールドデータを読み取る場合、すべての読み取りデータをキャッシュに受け入れると、既存のホットデータが頻繁に退避される「キャッシュ汚染」が起こり、キャッシュヒット率とクエリ全体の性能が低下する可能性があります。受け入れを拒否されたデータは、基盤となるリモートストレージ（HDFS、S3 など）から直接取得されるため、主要なホットデータが入れ替わるのを防げます。

キャッシュへの受け入れ制御はデフォルトで無効です。有効にするには、FE で関連パラメータを設定する必要があります。

### FE の設定

`fe.conf` でこの機能を有効にし、ルール設定ファイルのパスを指定してから、設定を反映するために FE ノードを再起動します。ルールファイル自体の変更は動的に読み込めます。

| パラメータ                                       | 必須 | 説明                               |
| ----------------------------------------------- | -------- |-------------------------------------------|
| `enable_file_cache_admission_control`           | はい      | キャッシュへの受け入れ制御を有効にするかどうか。デフォルトは `false` です。 |
| `file_cache_admission_control_json_dir`         | はい      | 受け入れルールの JSON ファイルを保存するディレクトリのパスです。このディレクトリ内のすべての `.json` ファイルが自動的に読み込まれ、ルールの追加、削除、変更は**動的に反映**されます。 |

### 受け入れルールの設定形式

ルール設定は、`.json` ファイルとして `file_cache_admission_control_json_dir` ディレクトリ内に配置します。ファイルの内容は JSON 配列形式である必要があります。

#### フィールドの説明

| フィールド名 | 型 | 説明 | 例 |
|--------|------|-------------------------------|-----------------------|
| `id` | Long | ルール ID。 | `1` |
| `user_identity` | String | ユーザー ID（形式：`user@host`。例えば `%` はすべての IP に一致）。**空欄にするか省略すると、すべてのユーザーに一致します。** | `"root@%"` |
| `catalog_name` | String | カタログ名。**空欄にするか省略すると、すべてのカタログに一致します。** | `"hive_cat"` |
| `database_name` | String | データベース名。**空欄にするか省略すると、すべてのデータベースに一致します。** | `"db1"` |
| `table_name` | String | テーブル名。**空欄にするか省略すると、すべてのテーブルに一致します。** | `"tbl1"` |
| `partition_pattern` | String | （未実装）パーティションの正規表現。空欄の場合、すべてのパーティションに一致します。 | `""` |
| `rule_type` | Integer | ルールの種類：`0` はキャッシュを拒否（ブラックリスト）、`1` はキャッシュを許可（ホワイトリスト）。 | `0` |
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

システムとの自動連携が必要な場合は、Doris のソースコードリポジトリにある補助スクリプト `tools/export_mysql_rule_to_json.sh` を使用できます。このスクリプトは、MySQL のデータベーステーブルに事前保存されたキャッシュ受け入れルールを、上記の形式に従う JSON 設定ファイルにエクスポートします。

### ルールの照合原則

#### ルールの適用範囲

各フィールド（`user_identity`、`catalog_name`、`database_name`、`table_name`）を空欄または具体的な値にする組み合わせにより、7 種類の有効なルール適用範囲がサポートされます。**階層間の依存関係に従わないルール設定（例えば、Database を指定せずに Table を直接指定する）は無効とみなされます。**

| user_identity | catalog_name | database_name | table_name | レベルと適用範囲             |
|---------------|--------------|---------------|------------|------------------|
| **指定あり**      | **指定あり**     | **指定あり**      | **指定あり**   | 指定ユーザーに対するテーブル単位のルール |
| 空欄または省略       | **指定あり**     | **指定あり**      | **指定あり**   | 全ユーザーに対するテーブル単位のルール |
| **指定あり**      | **指定あり**     | **指定あり**      | 空欄または省略   | 指定ユーザーに対するデータベース単位のルール |
| 空欄または省略       | **指定あり**     | **指定あり**      | 空欄または省略   | 全ユーザーに対するデータベース単位のルール |
| **指定あり**      | **指定あり**     | 空欄または省略      | 空欄または省略   | 指定ユーザーに対するカタログ単位のルール |
| 空欄または省略       | **指定あり**     | 空欄または省略      | 空欄または省略   | 全ユーザーに対するカタログ単位のルール |
| **指定あり**      | 空欄または省略      | 空欄または省略      | 空欄または省略   | 指定ユーザーに対するグローバルルール |

#### 照合の優先順位と順序

クエリがテーブルのデータにアクセスすると、システムはすべてのルールを総合的に評価して受け入れ可否を決めます。判定は次の原則に従います。

1. **具体的なルールを優先**：テーブル → データベース → カタログ → グローバルの順に、具体的な階層から広い階層へ照合します。最も具体的な階層（例えばテーブル単位）で一致した時点で判定を終了します。
2. **ブラックリストを優先（安全上の原則）**：同じルール階層では、**キャッシュを拒否するルールが常に許可するルールより優先されます**。ブラックリストとホワイトリストの両方に一致した場合、まずブラックリストの処理が実行され、同じ階層での拒否判定が優先されます。

判定の順序は次のとおりです。

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

> **ヒント**：どのルールにも一致しない場合はデフォルトで拒否されるため、この機能を導入する際は、広い範囲を許可するルール（例えば全ユーザーや重要な業務用 Catalog に対するホワイトリスト）を設定し、オフラインの全テーブルスキャンが行われることがわかっている大きなテーブルに対して、対象を絞ったテーブル単位のブラックリストを設定することを推奨します。これにより、コールドデータとホットデータを細かく分離できます。

### キャッシュ判定の確認

設定が正常に有効化・適用された後は、`EXPLAIN` コマンドを使用して、単一テーブルに対するファイルデータ単位のキャッシュ受け入れ判定の詳細を確認できます（以下の `file cache request` の出力を参照）。

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

主なフィールドと判定結果の説明：
- **ADMITTED** / **DENIED**：要求されたデータのキャッシュへの受け入れを許可（ADMITTED）するか、拒否（DENIED）するかを示します。
- **user_identity**：このクエリの実行時に確認されたユーザー ID です。
- **reason**：判定を引き起こした具体的な理由（一致したルール）です。主な出力には、`user table-level whitelist rule`（この例：指定ユーザーに対するテーブル単位のホワイトリスト）、`common table-level blacklist rule`（全ユーザーに対するテーブル単位のブラックリスト）があります。形式は一般に `[Scope] [Rule Level] [Rule Type] rule` です。
- **cost**：受け入れルールの照合全体にかかった時間（ミリ秒）です。負荷が大きすぎる場合は、ルール階層の数を調整することで改善できます。

## 付録

### 仕組み

Data Cache は、アクセスしたリモートデータをローカルの BE ノードにキャッシュします。元のデータファイルはアクセス時の IO サイズに基づいて Block に分割され、Block はローカルファイル `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset` に保存されます。Block のメタデータは BE ノードに保存されます。同じリモートファイルにアクセスするとき、Doris はそのファイルのキャッシュデータがローカルキャッシュに存在するか確認します。そのうえで、Block のオフセットとサイズに基づいて、ローカルの Block から読み取るデータとリモートから取得するデータを判断し、新たに取得したリモートデータをキャッシュします。BE ノードの再起動時には、`cache_path` ディレクトリをスキャンして Block のメタデータを復元します。キャッシュサイズが上限に達すると、LRU に従って長期間使われていない Block を削除します。
