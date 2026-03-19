---
{
  "title": "FluentBit",
  "language": "ja",
  "description": "Fluent Bitは、ストレージシステムにデータを書き込むためのカスタム出力プラグインをサポートする高速ログプロセッサおよびフォワーダーです。"
}
---
[Fluent Bit](https://fluentbit.io/)は、ストレージシステムにデータを書き込むためのカスタム出力プラグインをサポートする高速ログプロセッサおよびフォワーダーです。Fluent Bit DorisアウトプットプラグインはDorisへの出力を行うためのプラグインです。

[Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTPインターフェースを呼び出すことにより、Fluent Bit DorisアウトプットプラグインはリアルタイムでデータをDorisに書き込み、マルチスレッド並行処理、失敗時の再試行、カスタムStream Loadフォーマットとパラメータ、出力書き込み速度などの機能を提供します。

Fluent Bit Dorisアウトプットプラグインを使用するには、主に3つのステップがあります：
1. Dorisアウトプットプラグインを含むFluent Bitバイナリプログラムをダウンロードまたはコンパイルする。
2. Fluent Bitの出力アドレスとその他のパラメータを設定する。
3. Fluent Bitを起動してリアルタイムでデータをDorisに書き込む。

## インストール (alpha)

### ダウンロード

https://download.selectdb.com/integrations/fluent-bit-doris-3.1.9

### ソースコードからコンパイル

https://github.com/joker-star-l/fluent-bit のdevブランチをクローンし、build/ディレクトリで以下のコマンドを実行してください

```
cmake -DFLB_RELEASE=ON ..
make
```
ビルド出力は build/bin/fluent-bit です。

## 設定

Fluent Bit Doris output pluginの設定は以下のとおりです:

設定 | 説明
--- | ---
`host` | Stream Load HTTPホスト
`port` | Stream Load HTTPポート
`user` | Dorisユーザー名、このユーザーは対応するDorisデータベースとテーブルのインポート権限を持つ必要があります
`password` | Dorisユーザーのパスワード
`database` | 書き込み先のDorisデータベース名
`table` | 書き込み先のDorisテーブル名
`label_prefix` | Doris Stream Load Labelプレフィックス、最終的に生成されるLabelは *{label_prefix}\_{timestamp}\_{uuid}* 、デフォルト値はfluentbitです。falseに設定すると、Labelは追加されません
 `time_key` | データに追加するタイムスタンプ列の名前。デフォルト値はdateです。falseに設定すると、列は追加されません
`header` |  Doris Stream Load headersパラメータ、複数設定可能
`log_request` | トラブルシューティングのためにログでDoris Stream Loadリクエストとレスポンスメタデータを出力するかどうか、デフォルトはtrue
`log_progress_interval` | ログで速度を出力する時間間隔、単位は秒、デフォルトは10、0に設定するとこのタイプのログを無効にできます
`retry_limit` | Doris Stream Loadリクエスト失敗時のリトライ回数、デフォルト値は1、falseに設定するとリトライ回数を制限しません
`workers` | Doris Stream Loadを実行するワーカー数、デフォルト値は2

## 使用例

### TEXTログ収集例

この例では、Doris FEログを例としてTEXTログ収集を実演します。

**1. データ**

FEログファイルは通常、Dorisインストールディレクトリ配下のfe/log/fe.logファイルに配置されています。これらは典型的なJavaプログラムログで、タイムスタンプ、ログレベル、スレッド名、コードの場所、ログ内容などのフィールドを含んでいます。通常のログだけでなく、スタックトレースを含む例外ログも含まれており、これらは複数行にわたります。ログ収集と保存では、メインログとスタックトレースを単一のログエントリに結合する必要があります。

```
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```
**2. テーブル作成**

テーブル構造には、ログの作成時刻、収集時刻、ホスト名、ログファイルパス、ログタイプ、ログレベル、スレッド名、コード位置、ログ内容などのフィールドが含まれます。

```
CREATE TABLE `doris_log` (
  `log_time` datetime NULL COMMENT 'log content time',
  `collect_time` datetime NULL COMMENT 'log agent collect time',
  `host` text NULL COMMENT 'hostname or ip',
  `path` text NULL COMMENT 'log file path',
  `type` text NULL COMMENT 'log type',
  `level` text NULL COMMENT 'log level',
  `thread` text NULL COMMENT 'log thread',
  `position` text NULL COMMENT 'log code position',
  `message` text NULL COMMENT 'log message',
  INDEX idx_host (`host`) USING INVERTED COMMENT '',
  INDEX idx_path (`path`) USING INVERTED COMMENT '',
  INDEX idx_type (`type`) USING INVERTED COMMENT '',
  INDEX idx_level (`level`) USING INVERTED COMMENT '',
  INDEX idx_thread (`thread`) USING INVERTED COMMENT '',
  INDEX idx_position (`position`) USING INVERTED COMMENT '',
  INDEX idx_message (`message`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true") COMMENT ''
) ENGINE=OLAP
DUPLICATE KEY(`log_time`)
COMMENT 'OLAP'
PARTITION BY RANGE(`log_time`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
"replication_num" = "1",
"dynamic_partition.enable" = "true",
"dynamic_partition.time_unit" = "DAY",
"dynamic_partition.start" = "-7",
"dynamic_partition.end" = "1",
"dynamic_partition.prefix" = "p",
"dynamic_partition.buckets" = "10",
"dynamic_partition.create_history_partition" = "true",
"compaction_policy" = "time_series"
);
```
**3. 設定**

Fluent Bitログ収集の設定ファイルは以下の通りです。doris_log.confはETLコンポーネントの各部分を定義するために使用され、parsers.confは異なるログパーサーを定義するために使用されます。

doris_log.conf:

```
# config for Fluent Bit service
[SERVICE]
    log_level info
    # parsers file
    parsers_file parsers.conf

# use input tail
[INPUT]
    name tail
    path /path/to/your/log
    # add log file name to the record, key is 'path'
    path_key path
    # set multiline parser
    multiline.parser multiline_java 

# parse log
[FILTER]
    match *
    name parser
    key_name log
    parser fe_log
    reserve_data true

# add host info
[FILTER]
    name sysinfo
    match *
    # add hostname to the record, key is 'host'
    hostname_key host

# output to doris
[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    # add 'collect_time' to the record
    time_key collect_time
    # 'collect_time' is timestamp, change it to datatime
    header columns collect_time=from_unixtime(collect_time)
    log_request true
    log_progress_interval 10
```
parsers.conf:

```
[MULTILINE_PARSER]
    name          multiline_java
    type          regex
    flush_timeout 1000
    # Regex rules for multiline parsing
    # ---------------------------------
    #
    # configuration hints:
    #
    #  - first state always has the name: start_state
    #  - every field in the rule must be inside double quotes
    #
    # rules   |   state name   | regex pattern | next state name
    # --------|----------------|---------------|-----------------
    rule         "start_state"   "/(^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})(.*)/"  "cont"
    rule         "cont"          "/(^(?![0-9]{4}-[0-9]{2}-[0-9]{2}))(.*)/"     "cont"


[PARSER]
    name        fe_log
    format      regex
    # parse and add 'log_time', 'level', 'thread', 'position', 'message' to the record
    regex       ^(?<log_time>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) (?<level>[^ ]+) \((?<thread>[^\)]+)\) \[(?<position>[^\]]+)\] (?<message>(\n|.)*)\n$
```
**4. Fluent Bit の実行**

```
fluent-bit -c doris_log.conf

# log stream load response

[2024/10/31 18:39:55] [ info] [output:doris:doris.1] 127.0.0.1:8040, HTTP status=200
{
    "TxnId": 32155,
    "Label": "fluentbit_1730371195_91cca1aa-c15f-45d2-b503-fe7d2e839c2a",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 836,
    "LoadTimeMs": 298,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 268,
    "CommitAndPublishTimeMs": 25
}

# log speed info

[2024/10/31 18:40:13] [ info] [output:doris:doris.1] total 0 MB 2 ROWS, total speed 0 MB/s 0 R/s, last 10 seconds speed 0 MB/s 0 R/s
```
### JSON ログ収集の例

この例では、GitHub イベントアーカイブのデータを使用したJSONログ収集について説明します。

**1. データ**

GitHub イベントアーカイブには、GitHubユーザーアクションのアーカイブデータがJSON形式で含まれています。[ここ](https://data.gharchive.org/)からダウンロードできます。例えば、2024年1月1日午後3時のデータです。

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```
以下はデータのサンプルです。通常、各データは1行に記述されますが、表示を見やすくするため、ここではフォーマットされています。

```
{
  "id": "37066529221",
  "type": "PushEvent",
  "actor": {
    "id": 46139131,
    "login": "Bard89",
    "display_login": "Bard89",
    "gravatar_id": "",
    "url": "https://api.github.com/users/Bard89",
    "avatar_url": "https://avatars.githubusercontent.com/u/46139131?"
  },
  "repo": {
    "id": 780125623,
    "name": "Bard89/talk-to-me",
    "url": "https://api.github.com/repos/Bard89/talk-to-me"
  },
  "payload": {
    "repository_id": 780125623,
    "push_id": 17799451992,
    "size": 1,
    "distinct_size": 1,
    "ref": "refs/heads/add_mvcs",
    "head": "f03baa2de66f88f5f1754ce3fa30972667f87e81",
    "before": "85e6544ede4ae3f132fe2f5f1ce0ce35a3169d21"
  },
  "public": true,
  "created_at": "2024-04-01T23:00:00Z"
}
```
**2. テーブル作成**

```
CREATE DATABASE log_db;
USE log_db;


CREATE TABLE github_events
(
  `created_at` DATETIME,
  `id` BIGINT,
  `type` TEXT,
  `public` BOOLEAN,
  `actor` VARIANT,
  `repo` VARIANT,
  `payload` TEXT,
  INDEX `idx_id` (`id`) USING INVERTED,
  INDEX `idx_type` (`type`) USING INVERTED,
  INDEX `idx_actor` (`actor`) USING INVERTED,
  INDEX `idx_host` (`repo`) USING INVERTED,
  INDEX `idx_payload` (`payload`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`created_at`)
PARTITION BY RANGE(`created_at`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
"replication_num" = "1",
"compaction_policy" = "time_series",
"enable_single_replica_compaction" = "true",
"dynamic_partition.enable" = "true",
"dynamic_partition.create_history_partition" = "true",
"dynamic_partition.time_unit" = "DAY",
"dynamic_partition.start" = "-30",
"dynamic_partition.end" = "1",
"dynamic_partition.prefix" = "p",
"dynamic_partition.buckets" = "10",
"dynamic_partition.replication_num" = "1"
);
```
**3. 設定**

以前のTEXTログ収集とは対照的に、この設定では追加の処理変換が不要なためFILTERを使用しません。

github_events.conf:

```
[SERVICE]
    log_level info
    parsers_file github_parsers.conf

[INPUT]
    name tail
    parser github
    path /path/to/your/log

[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    time_key false
    log_request true
    log_progress_interval 10
```
github_parsers.conf:

```
[PARSER]
    name github
    format json
```
**4. Fluent Bit の実行**

```
fluent-bit -c github_events.conf
```
