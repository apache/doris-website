---
{
    "title": "実行中のクエリの進捗とリソース使用量をリアルタイムで監視する",
    "language": "ja",
    "description": "SQL コマンドまたは REST API を使用して、Apache Doris で実行中のクエリの進捗と、CPU、メモリ、シャッフル、スピルなどのリソース指標をリアルタイムで確認する方法を説明します。",
    "keywords": ["クエリ監視", "実行中のクエリ", "クエリの進捗", "クエリのリソース", "SHOW PROC", "current_queries", "Trace ID", "ワークロード管理"],
    "sidebar_label": "クエリの進捗監視"
}
---

<!-- Knowledge type: Concept introduction + Operational steps -->

Apache Doris では、実行中のクエリとそのリソース消費量をリアルタイムで確認する方法として、**SQL コマンド**（`SHOW PROC`）と **REST API** の二つを提供しています。どちらの方法でも、タスク単位の実行進捗に加え、スキャン量、CPU、メモリ、シャッフル、スピル、キャッシュなどの主要な指標を取得できます。

## SQL コマンドで実行中のクエリを確認する

<!-- Knowledge type: Operational steps -->

`SHOW PROC` コマンドを使用すると、現在実行中のすべてのクエリとそのリアルタイム統計情報を一覧表示できます。

```sql
SHOW PROC "/current_queries";
```

`SHOW PROC "/current_query_stmts"` でも同じ統計情報が返されます。Doris 4.1.1 以降、両コマンドでは、拡張された統一形式の統計情報が使用されます。

### 出力例

```
*************************** 1. row ***************************
                       QueryId: e00b00b1155d4042-98862b60016a768a
                  ConnectionId: 394
                       Catalog: internal
                      Database: wzhtest
                          User: root
                      ExecTime: 20717
                       SqlHash: cf263b08302d8be436c97dd5e6f0d283
                     Statement: INSERT INTO test_query_progress_tb
                                  SELECT DISTINCT k, CONCAT(v, CAST(k AS STRING))
                                  FROM test_query_progress_tb
                                  WHERE k % 2 = 0
                      ScanRows: 45400000 Rows
                     ScanBytes: 2.70 GB
                   ProcessRows: 75598123 Rows
                         CpuMs: 178336
            MaxPeakMemoryBytes: 13.03 GB
        CurrentUsedMemoryBytes: 8.69 GB
               WorkloadGroupId: 1777125330381
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 31.48 MB
    ScanBytesFromRemoteStorage: 0.00
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 74
                 FinishedTasks: 51
                      Progress: 68%
*************************** 2. row ***************************
                       QueryId: e2b8c99658a94743-9ebbf0d036d83295
                  ConnectionId: 9
                       Catalog: hive_test
                      Database: tpch100_parquet
                          User: root
                      ExecTime: 10807
                       SqlHash: f8a30e4182d72cce3eff6cb385005b1f
                     Statement: select ... from supplier, lineitem l1, orders, nation ... limit 100
                      ScanRows: 1102562592 Rows
                     ScanBytes: 9.20 GB
                   ProcessRows: 112176670 Rows
                         CpuMs: 53808
            MaxPeakMemoryBytes: 3.13 GB
        CurrentUsedMemoryBytes: 2.50 GB
               WorkloadGroupId: 1777253545394
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 0.00
    ScanBytesFromRemoteStorage: 9.20 GB
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 138
                 FinishedTasks: 65
                      Progress: 47%
```

### フィールドの説明

<!-- Knowledge type: Reference table -->

| フィールド | 説明 |
|---|---|
| QueryId | クエリの一意の識別子 |
| ConnectionId | MySQL 接続 ID |
| Catalog | クエリが属するカタログの名前（`internal` や `hive_test` など） |
| Database | データベースまたはスキーマの名前 |
| User | クエリを送信したユーザー |
| ExecTime | 実行開始からの経過時間（ミリ秒） |
| SqlHash | SQL 文の MD5 ハッシュ。同一のクエリを識別する際に役立ちます |
| Statement | SQL 文のテキスト（長すぎる場合は切り詰められます） |
| ScanRows | ストレージ層からスキャンした行の総数 |
| ScanBytes | ストレージ層からスキャンしたバイト数の合計 |
| ProcessRows | 実行パイプラインで処理した行数。演算子の実際の処理量を表します |
| CpuMs | 消費した CPU 時間（ミリ秒） |
| MaxPeakMemoryBytes | クエリ実行中のメモリ使用量のピーク値 |
| CurrentUsedMemoryBytes | クエリが現在使用しているメモリ量 |
| WorkloadGroupId | クエリが属するワークロードグループの ID |
| ShuffleSendBytes | ノード間のデータシャッフルで送信したバイト数の合計 |
| ShuffleSendRows | ノード間のデータシャッフルで送信した行数の合計 |
| ScanBytesFromLocalStorage | ローカルディスクからスキャンしたバイト数 |
| ScanBytesFromRemoteStorage | リモートストレージ（HDFS や S3 など）からスキャンしたバイト数 |
| SpillWriteBytesToLocalStorage | メモリ不足によりローカルディスクにスピルしたバイト数 |
| SpillReadBytesFromLocalStorage | ローカルディスク上のスピルデータから読み戻したバイト数 |
| BytesWriteIntoCache | データキャッシュに書き込んだバイト数 |
| TotalTasks | クエリ内のパイプラインタスクの総数 |
| FinishedTasks | 完了したパイプラインタスクの数 |
| Progress | クエリの実行進捗率。`FinishedTasks / TotalTasks` で計算されます |

## REST API で実行中のクエリを確認する

<!-- Knowledge type: Operational steps -->

**目的**：実行中のクエリのリアルタイム統計情報をプログラムから取得します。

**コマンド**：

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/current_queries
```

**説明**：このエンドポイントは `SHOW PROC` と同じ列データを JSON 形式で返します。各フィールドの意味も同じです。

### クエリパラメータ

| パラメータ | 型 | 説明 |
|---|---|---|
| is_all_node | Boolean（省略可能） | `true` に設定すると、すべての FE ノードで実行中のクエリを返します。デフォルトは `true` です。 |

### レスポンス例

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "columnNames": [
            "Frontend", "QueryId", "ConnectionId", "Catalog", "Database",
            "User", "ExecTime", "SqlHash", "Statement",
            "ScanRows", "ScanBytes", "ProcessRows", "CpuMs",
            "MaxPeakMemoryBytes", "CurrentUsedMemoryBytes", "WorkloadGroupId",
            "ShuffleSendBytes", "ShuffleSendRows",
            "ScanBytesFromLocalStorage", "ScanBytesFromRemoteStorage",
            "SpillWriteBytesToLocalStorage", "SpillReadBytesFromLocalStorage",
            "BytesWriteIntoCache",
            "TotalTasks", "FinishedTasks", "Progress"
        ],
        "rows": [
            [
                "172.19.0.3", "108e47ab438a4560-ab1651d16c036491", "2", "internal",
                "testdb", "root", "6074",
                "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)",
                "0", "0.00", "0", "0",
                "0.00", "0.00", "0",
                "0.00", "0",
                "0.00", "0.00",
                "0.00", "0.00",
                "0.00",
                "1", "1", "100%"
            ]
        ]
    },
    "count": 0
}
```

## Trace ID で単一クエリの進捗をリアルタイムに追跡する

<!-- Knowledge type: Operational steps -->

特定のクエリの実行進捗を継続的に追跡するには、そのクエリに Trace ID を設定し、別のセッションから統計情報のエンドポイントを定期的に呼び出して、リアルタイムの状態を取得します。

**ステップ 1：クエリの実行前に Trace ID を設定する**

```sql
SET session_context="trace_id:my_trace_id";
SELECT ...;
```

**ステップ 2：別のセッションから統計情報を定期的に取得する**

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/statistics/my_trace_id
```

**説明**：クエリが完了するまで、このエンドポイントを定期的に呼び出して最新の進捗を取得します。

### レスポンス例

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1102562592,
        "scanBytes": 9878424780,
        "returnedRows": 12345,
        "processRows": 112176670,
        "cpuMs": 53808,
        "maxPeakMemoryBytes": 3355443200,
        "currentUsedMemoryBytes": 2684354560,
        "shuffleSendBytes": 0,
        "shuffleSendRows": 0,
        "scanBytesFromLocalStorage": 0,
        "scanBytesFromRemoteStorage": 9878424780,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0,
        "bytesWriteIntoCache": 0,
        "totalTasksNum": 138,
        "finishedTasksNum": 65,
        "progress": "47%"
    },
    "count": 0
}
```
