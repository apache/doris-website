---
{
  "title": "高並行性LOAD最適化（Group Commit）",
  "description": "高頻度で小さなバッチでの書き込みシナリオにおいて、従来のロード方法には以下の課題があります。",
  "language": "ja"
}
---
高頻度小バッチ書き込みシナリオにおいて、従来のローディング手法には以下の問題があります：

- 各ロードが独立したトランザクションを作成し、FEがSQLを解析して実行プランを生成する必要があるため、全体的なパフォーマンスに影響を与える
- 各ロードが新しいバージョンを生成し、バージョンの急速な増加を引き起こし、バックグラウンドcompactionの圧迫を増大させる

これらの問題を解決するため、DorisはGroup Commitメカニズムを導入しました。Group Commitは新しいローディング手法ではなく、既存のローディング手法の最適化拡張であり、主に以下を対象としています：

- `INSERT INTO tbl VALUES(...)`文
- Stream Load

複数の小バッチロードをバックグラウンドで1つの大きなトランザクションコミットにマージすることで、高同期小バッチ書き込みパフォーマンスを大幅に向上させます。さらに、Group CommitをPreparedStatementと併用することで、さらに高いパフォーマンス向上を実現できます。

## Group Commitモード

Group Commitには3つのモードがあります：

* Off Mode（`off_mode`）

    Group Commitが無効化されます。

* Synchronous Mode（`sync_mode`）

    Dorisはロードとtableの`group_commit_interval`プロパティに基づいて複数のロードを1つのトランザクションでコミットし、トランザクションコミット後に返します。これは、ローディング後に即座にデータの可視性が必要な高同期書き込みシナリオに適しています。

* Asynchronous Mode（`async_mode`）

    DorisはまずデータをWAL（Write Ahead ログ）に書き込み、その後すぐに返します。Dorisはロードとtableの`group_commit_interval`プロパティに基づいて非同期でデータをコミットし、コミット後にデータを可視化します。WALがディスク容量を過度に占有することを防ぐため、大きな単一ロードに対しては自動的に`sync_mode`に切り替わります。これは書き込みレイテンシに敏感で高頻度書き込みシナリオに適しています。

    WAL数は、こちらに示すようにFE httpインターフェースを通じて確認できます、またはBEメトリクスで`wal`キーワードを検索することで確認できます。

## Group Commitの使用方法

table構造が以下であると仮定します：

```sql
CREATE TABLE `dt` (
    `id` int(11) NOT NULL,
    `name` varchar(50) NULL,
    `score` int(11) NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```
### JDBCの使用

ユーザーがJDBCの`insert into values`メソッドを使用して書き込む際、SQLの解析と計画のオーバーヘッドを削減するため、FE側でMySQLプロトコルの`PreparedStatement`機能をサポートしています。`PreparedStatement`を使用する場合、SQLとその実行計画はセッションレベルのメモリキャッシュにキャッシュされ、後続の処理では直接キャッシュされたオブジェクトを使用することで、FEのCPU負荷を軽減します。以下は、JDBCで`PreparedStatement`を使用する例です：

**1. JDBC URLを設定し、サーバー側でPrepared Statementを有効にする**

```
url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=500
```
**2. `group_commit` セッション変数を次の2つの方法のいずれかで設定します:**

* JDBC URLで `sessionVariables=group_commit=async_mode` を追加することにより

```
url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=500&sessionVariables=group_commit=async_mode,enable_nereids_planner=false
```
* SQL実行を通じて

```
try (Statement statement = conn.createStatement()) {
    statement.execute("SET group_commit = async_mode;");
}
```
**3. `PreparedStatement`を使用する**

```java
private static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";
private static final String URL_PATTERN = "jdbc:mysql://%s:%d/%s?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=50&sessionVariables=group_commit=async_mode";
private static final String HOST = "127.0.0.1";
private static final int PORT = 9087;
private static final String DB = "db";
private static final String TBL = "dt";
private static final String USER = "root";
private static final String PASSWD = "";
private static final int INSERT_BATCH_SIZE = 10;

private static void groupCommitInsertBatch() throws Exception {
    Class.forName(JDBC_DRIVER);
    // add rewriteBatchedStatements=true and cachePrepStmts=true in JDBC url
    // set session variables by sessionVariables=group_commit=async_mode in JDBC url
    try (Connection conn = DriverManager.getConnection(
            String.format(URL_PATTERN, HOST, PORT, DB), USER, PASSWD)) {

        String query = "insert into " + TBL + " values(?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(query)) {
            for (int j = 0; j < 5; j++) {
                // 10 rows per insert
                for (int i = 0; i < INSERT_BATCH_SIZE; i++) {
                    stmt.setInt(1, i);
                    stmt.setString(2, "name" + i);
                    stmt.setInt(3, i + 10);
                    stmt.addBatch();
                }
                int[] result = stmt.executeBatch();
            }
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```
注意：高頻度のinsert into文は大量の監査ログを出力し、最終的なパフォーマンスに影響を与えるため、prepared statement監査ログの出力はデフォルトで無効になっています。セッション変数設定を通じて、prepared statement監査ログを出力するかどうかを制御できます。

```sql
# Configure session variable to enable printing prepared statement audit log, default is false
set enable_prepared_stmt_audit_log=true;
```
**JDBC**の使用方法の詳細については、[Using Insert Method to Synchronize Data](./import-way/insert-into-manual.md)を参照してください。

### GolangでのGroup Commitの使用

Golangはprepared statementのサポートが限定的であるため、手動でクライアント側バッチ処理を行うことでGroup Commitのパフォーマンスを向上させることができます。以下にサンプルプログラムを示します：

```Golang
package main

import (
	"database/sql"
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const (
	host     = "127.0.0.1"
	port     = 9038
	db       = "test"
	user     = "root"
	password = ""
	table    = "async_lineitem"
)

var (
	threadCount = 20
	batchSize   = 100
)

var totalInsertedRows int64
var rowsInsertedLastSecond int64

func main() {
	dbDSN := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true", user, password, host, port, db)
	db, err := sql.Open("mysql", dbDSN)
	if err != nil {
		fmt.Printf("Error opening database: %s\n", err)
		return
	}
	defer db.Close()

	var wg sync.WaitGroup
	for i := 0; i < threadCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			groupCommitInsertBatch(db)
		}()
	}

	go logInsertStatistics()

	wg.Wait()
}

func groupCommitInsertBatch(db *sql.DB) {
	for {
		valueStrings := make([]string, 0, batchSize)
		valueArgs := make([]interface{}, 0, batchSize*16)
		for i := 0; i < batchSize; i++ {
		    valueStrings = append(valueStrings, "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, rand.Intn(1000))
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, sql.NullFloat64{Float64: 1.0, Valid: true})
			valueArgs = append(valueArgs, "N")
			valueArgs = append(valueArgs, "O")
			valueArgs = append(valueArgs, time.Now())
			valueArgs = append(valueArgs, time.Now())
			valueArgs = append(valueArgs, time.Now())
			valueArgs = append(valueArgs, "DELIVER IN PERSON")
			valueArgs = append(valueArgs, "SHIP")
			valueArgs = append(valueArgs, "N/A")
		}
		stmt := fmt.Sprintf("INSERT INTO %s VALUES %s",
			table, strings.Join(valueStrings, ","))
		_, err := db.Exec(stmt, valueArgs...)
		if err != nil {
			fmt.Printf("Error executing batch: %s\n", err)
			return
		}
		atomic.AddInt64(&rowsInsertedLastSecond, int64(batchSize))
		atomic.AddInt64(&totalInsertedRows, int64(batchSize))
	}
}

func logInsertStatistics() {
	for {
		time.Sleep(1 * time.Second)
		fmt.Printf("Total inserted rows: %d\n", totalInsertedRows)
		fmt.Printf("Rows inserted in the last second: %d\n", rowsInsertedLastSecond)
		rowsInsertedLastSecond = 0
	}
}

```
### INSERT INTO VALUES

* 非同期モード

```sql
# Configure session variable to enable group commit (default is off_mode), enable asynchronous mode
mysql> set group_commit = async_mode;

# The returned label is prefixed with group_commit, indicating whether group commit is used
mysql> insert into dt values(1, 'Bob', 90), (2, 'Alice', 99);
Query OK, 2 rows affected (0.05 sec)
{'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

# The label, txn_id, and previous one are the same, indicating that they are accumulated into the same import task
mysql> insert into dt(id, name) values(3, 'John');
Query OK, 1 row affected (0.01 sec)
{'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

# Cannot query immediately
mysql> select * from dt;
Empty set (0.01 sec)

# 10 seconds later, data can be queried, and data visibility delay can be controlled by table attribute group_commit_interval.
mysql> select * from dt;
+------+-------+-------+
| id   | name  | score |
+------+-------+-------+
|    1 | Bob   |    90 |
|    2 | Alice |    99 |
|    3 | John  |  NULL |
+------+-------+-------+
3 rows in set (0.02 sec)
```
* 同期モード

```sql
# Configure session variable to enable group commit (default is off_mode), enable synchronous mode
mysql> set group_commit = sync_mode;

# The returned label is prefixed with group_commit, indicating whether group commit is used, and import time is at least table attribute group_commit_interval.
mysql> insert into dt values(4, 'Bob', 90), (5, 'Alice', 99);
Query OK, 2 rows affected (10.06 sec)
{'label':'group_commit_d84ab96c09b60587_ec455a33cb0e9e87', 'status':'PREPARE', 'txnId':'3007', 'query_id':'fc6b94085d704a94-a69bfc9a202e66e2'}

# Data can be read immediately
mysql> select * from dt;
+------+-------+-------+
| id   | name  | score |
+------+-------+-------+
|    1 | Bob   |    90 |
|    2 | Alice |    99 |
|    3 | John  |  NULL |
|    4 | Bob   |    90 |
|    5 | Alice |    99 |
+------+-------+-------+
5 rows in set (0.03 sec)
```
* Offモード

```sql
mysql> set group_commit = off_mode;
```
### Stream Load

`data.csv` に以下が含まれていると仮定します：

```sql
6,Amy,60
7,Ross,98
```
* 非同期モード

```sql
# Import with "group_commit:async_mode" configuration in header

curl --location-trusted -u {user}:{passwd} -T data.csv -H "group_commit:async_mode"  -H "column_separator:,"  http://{fe_host}:{http_port}/api/db/dt/_stream_load
{
    "TxnId": 7009,
    "Label": "group_commit_c84d2099208436ab_96e33fda01eddba8",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 35,
    "StreamLoadPutTimeMs": 5,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 26
}

# The returned GroupCommit is true, indicating that the group commit process is entered
# The returned Label is prefixed with group_commit, indicating the label associated with the import that truly consumes data
```
* 同期モード

```sql
# Import with "group_commit:sync_mode" configuration in header

curl --location-trusted -u {user}:{passwd} -T data.csv -H "group_commit:sync_mode"  -H "column_separator:,"  http://{fe_host}:{http_port}/api/db/dt/_stream_load
{
    "TxnId": 3009,
    "Label": "group_commit_d941bf17f6efcc80_ccf4afdde9881293",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 10044,
    "StreamLoadPutTimeMs": 4,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 10038
}

# The returned GroupCommit is true, indicating that the group commit process is entered
# The returned Label is prefixed with group_commit, indicating the label associated with the import that truly consumes data
```
Stream Loadの使用方法については、[Stream Load](./import-way/stream-load-manual)を参照してください。


時間間隔（デフォルト10秒）またはデータ量（デフォルト64 MB）の条件のいずれかが満たされると、データは自動的にコミットされます。これらのパラメータは一緒に使用し、実際のシナリオに基づいて調整する必要があります。

### コミット間隔の変更

デフォルトのコミット間隔は10秒です。ユーザーはTable設定を通じて調整できます：

```sql
# Modify commit interval to 2 seconds
ALTER TABLE dt SET ("group_commit_interval_ms" = "2000");
```
**パラメータ調整の推奨事項**：
- より短い間隔（例：2秒）：
  - 利点：データ可視性のレイテンシが低く、高いリアルタイム性能が求められるシナリオに適している
  - 欠点：より多くのコミット、より速いバージョン増加、より高いバックグラウンド圧縮圧力

- より長い間隔（例：30秒）：
  - 利点：より大きなコミットバッチ、より遅いバージョン増加、より低いシステムオーバーヘッド
  - 欠点：より高いデータ可視性のレイテンシ

ビジネスのデータ可視性遅延に対する許容度に基づいて設定することを推奨します。システム圧力が高い場合は、間隔を増やすことを検討してください。

### Commitデータ量の変更

Group Commitのデフォルトコミットデータ量は64 MBです。ユーザーはTable設定を通じて調整できます：

```sql
# Modify commit data volume to 128MB
ALTER TABLE dt SET ("group_commit_data_bytes" = "134217728");
```
**パラメータ調整の推奨事項**:
- より小さな閾値（例：32MB）:
  - 長所：メモリ使用量が少ない、リソース制約のある環境に適している
  - 短所：コミットバッチが小さい、スループットが制限される可能性がある

- より大きな閾値（例：256MB）:
  - 長所：バッチコミット効率が高い、システムスループットが向上する
  - 短所：より多くのメモリを使用する

システムメモリリソースとデータ信頼性要件に基づいてバランスを取ることを推奨します。メモリが十分にあり、より高いスループットが望ましい場合は、128MB以上への増加を検討してください。


### BE設定

1. `group_commit_wal_path`

   * 説明：group commit WALファイルを格納するディレクトリ

   * デフォルト：設定された各`storage_root_path`の下に`wal`ディレクトリを作成します。設定例：

   ```
   group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
   ```
## 使用制限

* **Group Commit制限**

  * `INSERT INTO VALUES`文は以下の場合にnon-Group Commitモードに劣化します：
    - トランザクション書き込み（`Begin; INSERT INTO VALUES; COMMIT`）
    - ラベル指定（`INSERT INTO dt WITH LABEL {label} VALUES`）
    - 式を含むVALUES（`INSERT INTO dt VALUES (1 + 100)`）
    - カラム更新書き込み
    - Tableがlightweightモード変更をサポートしていない

  * `Stream Load`は以下の場合にnon-Group Commitモードに劣化します：
    - 2フェーズコミットの使用
    - ラベル指定（`-H "label:my_label"`）
    - カラム更新書き込み
    - Tableがlightweightモード変更をサポートしていない

* **Unique Model**
  - Group Commitはコミット順序を保証しないため、データ一貫性を確保するためにSequenceカラムの使用を推奨します。

* **WAL制限**
  - `async_mode`はデータをWALに書き込み、成功後に削除し、失敗時にWALから復旧します。
  - WALファイルは1つのBE上に単一レプリカで保存され、ディスク損傷や誤ったファイル削除によりデータ損失が発生する可能性があります。
  - BEノードをオフライン化する際は、データ損失を防ぐため`DECOMMISSION`コマンドを使用してください。
  - `async_mode`は以下の場合に`sync_mode`に切り替わります：
    - ロードデータ量が大きすぎる（WAL単一ディレクトリ容量の80%を超過）
    - データ量不明なチャンクストリームロード
    - ディスク容量不足
  - 重量級Schema Change中、Group Commit書き込みは拒否され、クライアントの再試行が必要です。

## パフォーマンス

小データ量の高並行シナリオにおいて、`Stream Load`と`JDBC`（`async mode`）を使用してgroup commitの書き込みパフォーマンスを個別にテストしました。

### Stream Load

#### 環境

* 1台のFront End（FE）サーバー：Alibaba Cloud、8コアCPU、16GB RAM、100GB ESSD PL1 SSD 1台。

* 3台のBackend（BE）サーバー：Alibaba Cloud、16コアCPU、64GB RAM、1TB ESSD PL1 SSD 1台。

* 1台のテストクライアント：Alibaba Cloud、16コアCPU、64GB RAM、100GB ESSD PL1 SSD 1台。

* テストバージョンはDoris-3.0.1。

#### データセット

* `httplogs`、31 GB、247249096（2億4700万）行

#### テストツール

* doris-streamloader

#### テストメソッド

* `non group_commit`と`group_commit=async mode`モード間で、リクエストあたりの異なるデータサイズと並行レベルでテストを実施。

#### テスト結果

| Load Way           | Single-concurrency Data Size | Concurrency | Cost Seconds | Rows / Seconds | MB / Seconds |
|------------------|-------------|--------|-------------|--------------------|-------------------|
| `group_commit` | 10 KB   | 10   | 2204      | 112,181   | 14.8 |
| `group_commit` | 10 KB   | 30   | 2176      | 113,625   | 15.0 |
| `group_commit` | 100 KB  | 10   | 283       | 873,671  | 115.1 |
| `group_commit` | 100 KB  | 30   | 244       | 1,013,315  | 133.5 |
| `group_commit` | 500 KB  | 10   | 125       | 1,977,992  | 260.6 |
| `group_commit` | 500 KB  | 30   | 122       | 2,026,631  | 267.1 |
| `group_commit` | 1 MB    | 10   | 119       | 2,077,723  | 273.8 |
| `group_commit` | 1 MB    | 30   | 119       | 2,077,723  | 273.8 |
| `group_commit` | 10 MB   | 10   | 118       | 2,095,331  | 276.1 |
| `non group_commit` | 1 MB    | 10   | 1883  | 131,305 | 17.3|
| `non group_commit` | 10 MB   | 10   | 294       | 840,983  | 105.4 |
| `non group_commit` | 10 MB   | 30   | 118  | 2,095,331 | 276.1|

上記のテストにおいて、BEのCPU使用率は10-40%の間で変動しています。

`group_commit`はロードパフォーマンスを効果的に向上させると同時に、バージョン数を削減し、compactionの負荷を軽減します。

### JDBC

#### 環境

1台のFront End（FE）サーバー：Alibaba Cloud、8コアCPU、16GB RAM、100GB ESSD PL1 SSD 1台。

1台のBackend（BE）サーバー：Alibaba Cloud、16コアCPU、64GB RAM、500GB ESSD PL1 SSD 1台。

1台のテストクライアント：Alibaba Cloud、16コアCPU、64GB RAM、100GB ESSD PL1 SSD 1台。

テストバージョンはDoris-2.1.5。

パフォーマンス向上のため、prepared statement監査ログの出力を無効化。

#### データセット

* tpch sf10 `lineitem`Tableのデータ、20ファイル、14 GB、1億2000万行

#### テストメソッド

* [DataX](https://github.com/alibaba/DataX)

#### テストメソッド

* `txtfilereader`を使用してデータを`mysqlwriter`に書き込み、`INSERT` SQLあたりの異なる並行数と行数を設定。

#### テスト結果

| Rows per insert | Concurrency | Rows / Second | MB / Second |
|-------------------|--------|--------------------|--------------------|
| 100 | 10  | 160,758    | 17.21 |
| 100 | 20  | 210,476    | 22.19 |
| 100 | 30  | 214,323    | 22.92 |

上記のテストにおいて、BEのCPU使用率は10-20%の間で変動し、FEは60-70%の間で変動しています。


### Insert into Sync Modeスモールバッチデータ

**マシン構成**

* 1台のFront-End（FE）：Alibaba Cloud、16コアCPU、64GB RAM、500GB ESSD PL1クラウドディスク 1台
* 5台のBack-End（BE）ノード：Alibaba Cloud、16コアCPU、64GB RAM、1TB ESSD PL1クラウドディスク 1台。
* 1台のテストクライアント：Alibaba Cloud、16コアCPU、64GB RAM、100GB ESSD PL1クラウドディスク 1台
* テストバージョン：Doris-2.1.5

**データセット**

* tpch sf10 `lineitem`Tableのデータ。

* create table文は

```sql
CREATE TABLE IF NOT EXISTS lineitem (
  L_ORDERKEY    INTEGER NOT NULL,
  L_PARTKEY     INTEGER NOT NULL,
  L_SUPPKEY     INTEGER NOT NULL,
  L_LINENUMBER  INTEGER NOT NULL,
  L_QUANTITY    DECIMAL(15,2) NOT NULL,
  L_EXTENDEDPRICE  DECIMAL(15,2) NOT NULL,
  L_DISCOUNT    DECIMAL(15,2) NOT NULL,
  L_TAX         DECIMAL(15,2) NOT NULL,
  L_RETURNFLAG  CHAR(1) NOT NULL,
  L_LINESTATUS  CHAR(1) NOT NULL,
  L_SHIPDATE    DATE NOT NULL,
  L_COMMITDATE  DATE NOT NULL,
  L_RECEIPTDATE DATE NOT NULL,
  L_SHIPINSTRUCT CHAR(25) NOT NULL,
  L_SHIPMODE     CHAR(10) NOT NULL,
  L_COMMENT      VARCHAR(44) NOT NULL
)
DUPLICATE KEY(L_ORDERKEY, L_PARTKEY, L_SUPPKEY, L_LINENUMBER)
DISTRIBUTED BY HASH(L_ORDERKEY) BUCKETS 32
PROPERTIES (
  "replication_num" = "3"
);
```
**Testing Tool**

* [Jmeter](https://jmeter.apache.org/)

画像に示すJMeterパラメータ設定

![jmeter1](/images/group-commit/jmeter1.jpg)
![jmeter2](/images/group-commit/jmeter2.jpg)

1. テスト前にInit Statementを設定する：

    ```
    set group_commit=async_mode;
    set enable_nereids_planner=false;
    ```
2. JDBC Prepared Statementを有効にする:

    完全なURL:

    ```
    jdbc:mysql://127.0.0.1:9030?useServerPrepStmts=true&useLocalSessionState=true&rewriteBatchedStatements=true&cachePrepStmts=true&prepStmtCacheSqlLimit=99999&prepStmtCacheSize=50&sessionVariables=group_commit=async_mode,enable_nereids_planner=false.
    ```
3. Import TypeをPrepared アップデート Statementに設定します。

4. Import Statementを設定します。

5. インポートする値を設定します：

    インポートする値がデータ型と一対一で一致していることを確認してください。

**テスト手法**

* JMeterを使用してDorisにデータを書き込みます。各スレッドはinsert into文を使用して実行ごとに1行のデータを書き込みます。

**テスト結果**

* データ単位：1秒あたりの行数。

* 以下のテストは30、100、500の同時実行数に分けられています。

    **Syncモード、5 BE、3レプリカでの30同時実行ユーザーのパフォーマンステスト**
    
    | Group commit interval | 10ms | 20ms | 50ms | 100ms |
    |-----------------------|---------------|---------------|---------------|---------------|
    |enable_nereids_planner=true| 891.8      | 701.1      | 400.0     | 237.5    |
    |enable_nereids_planner=false| 885.8      | 688.1      | 398.7      | 232.9     |
    
    **Syncモード、5 BE、3レプリカでの100同時実行ユーザーのパフォーマンステスト**
    
    | Group commit interval | 10ms | 20ms | 50ms | 100ms |
    |-----------------------|---------------|---------------|---------------|---------------|
    |enable_nereids_planner=true| 2427.8     | 2068.9     | 1259.4     | 764.9  |
    |enable_nereids_planner=false| 2320.4      | 1899.3    | 1206.2     |749.7|
    
    **Syncモード、5 BE、3レプリカでの500同時実行ユーザーのパフォーマンステスト**
    
    | Group commit interval | 10ms | 20ms | 50ms | 100ms |
    |-----------------------|---------------|---------------|---------------|---------------|
    |enable_nereids_planner=true| 5567.5     | 5713.2      | 4681.0    | 3131.2   |
    |enable_nereids_planner=false| 4471.6      | 5042.5     | 4932.2     | 3641.1 |

### Insert into Syncモード大容量バッチデータ

**マシン構成**

* 1 Front-End (FE)：Alibaba Cloud、16コアCPU、64GB RAM、1 x 500GB ESSD PL1クラウドディスク

* 5 Back-End (BE)ノード：Alibaba Cloud、16コアCPU、64GB RAM、1 x 1TB ESSD PL1クラウドディスク

* 1テストクライアント：Alibaba Cloud、16コアCPU、64GB RAM、1 x 100GB ESSD PL1クラウドディスク

* テストバージョン：Doris-3.0.1

**データセット**

* 1000行のInsert into文：`insert into tbl values(1,1)...`（1000行省略）

**テストツール**

* [Jmeter](https://jmeter.apache.org/)

**テスト手法**

* JMeterを使用してDorisにデータを書き込みます。各スレッドはinsert into文を使用して実行ごとに1000行のデータを書き込みます。

**テスト結果**

* データ単位：1秒あたりの行数。

* 以下のテストは30、100、500の同時実行数に分けられています。

**Syncモード、5 BE、3レプリカでの30同時実行ユーザーのパフォーマンステスト**

| Group commit interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|enable_nereids_planner=true| 9.1K     | 11.1K     | 11.4K     | 11.1K     |
|enable_nereids_planner=false| 157.8K      | 159.9K     | 154.1K     | 120.4K     |

**Syncモード、5 BE、3レプリカでの100同時実行ユーザーのパフォーマンステスト**

| Group commit interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|enable_nereids_planner=true| 10.0K     |9.2K     | 8.9K      | 8.9K    |
|enable_nereids_planner=false| 130.4k     | 131.0K     | 130.4K      | 124.1K     |

**Syncモード、5 BE、3レプリカでの500同時実行ユーザーのパフォーマンステスト**

| Group commit interval | 10ms | 20ms | 50ms | 100ms |
|-----------------------|---------------|---------------|---------------|---------------|
|enable_nereids_planner=true| 2.5K      | 2.5K     | 2.3K      | 2.1K      |
|enable_nereids_planner=false| 94.2K     | 95.1K    | 94.4K     | 94.8K     |
