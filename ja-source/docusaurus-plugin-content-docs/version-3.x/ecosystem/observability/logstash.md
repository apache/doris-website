---
{
  "title": "Logstash",
  "language": "ja",
  "description": "Logstashは、ログETLフレームワーク（収集、前処理、ストレージシステムへの送信）であり、ストレージシステムにデータを書き込むためのカスタム出力プラグインをサポートします。"
}
---
# Logstash Doris output plugin

## はじめに

Logstashは、ログETLフレームワーク（収集、前処理、ストレージシステムへの送信）であり、ストレージシステムにデータを書き込むためのカスタムoutputプラグインをサポートしています。Logstash Doris output pluginは、Dorisにデータを出力するためのプラグインです。

Logstash Doris output pluginは[Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTPインターフェースを呼び出して、リアルタイムでDorisにデータを書き込み、マルチスレッド並行処理、障害再試行、カスタムStream Load形式およびパラメータ、出力書き込み速度などの機能を提供します。

Logstash Doris output pluginの使用には主に3つのステップがあります：
1. プラグインをLogstashにインストール
2. Doris出力アドレスおよびその他のパラメータを設定
3. Logstashを開始してリアルタイムでDorisにデータを書き込み

## インストール

### プラグインの取得

公式ウェブサイトからプラグインをダウンロードするか、ソースコードから自分でコンパイルできます。

- 公式ウェブサイトからダウンロード

```shell
# Installation package with dependencies
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/logstash-output-doris-1.2.0-java.gem
```
- ソースコードからコンパイルする

```
cd extension/logstash/

gem build logstash-output-doris.gemspec
```
### プラグインのインストール

- 標準インストール

`${LOGSTASH_HOME}` は Logstash のインストールディレクトリです。その下にある `bin/logstash-plugin` コマンドを実行してプラグインをインストールします。

```
${LOGSTASH_HOME}/bin/logstash-plugin install logstash-output-doris-1.2.0.gem

Validating logstash-output-doris-1.2.0.gem
Installing logstash-output-doris
Installation successful
```
標準インストールモードでは、プラグインが依存するrubyモジュールが自動的にインストールされます。ネットワークが利用できない場合、処理が停止し、完了できなくなります。このような場合は、依存関係を含むzipインストールパッケージをダウンロードして完全にオフラインでインストールできます。ローカルファイルシステムを指定するには`file://`を使用する必要があることに注意してください。

- オフラインインストール

```shell

export JARS_SKIP="true"

${LOGSTASH_HOME}/bin/logstash-plugin install logstash-output-doris-1.2.0.gem

```
## 設定

Logstash Doris outputプラグインの設定は以下の通りです：

設定 | 説明
--- | ---
`http_hosts` | Stream Load HTTPアドレス、文字列配列として書式設定され、1つまたは複数の要素を持つことができ、各要素はhost:portです。例：["http://fe1:8030", "http://fe2:8030"]
`user` | Dorisユーザー名、このユーザーは対応するDorisデータベースとテーブルに対するインポート権限が必要です
`password` | Dorisユーザーのパスワード
`db` | 書き込み先のDorisデータベース名
`table` | 書き込み先のDorisテーブル名
`label_prefix` | Doris Stream Labelプレフィックス、最終的に生成されるLabelは *{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}* で、デフォルト値はlogstashです
`headers` | Doris Stream Loadヘッダーパラメーター、構文形式はruby mapです。例：headers => { "format" => "json", "read_json_by_line" => "true" }
`mapping` | LogstashフィールドからDorisテーブルフィールドへのマッピング、後続のセクションの使用例を参照してください
`message_only` | マッピングの特別な形式で、Logstash @messageフィールドのみをDorisに出力します。デフォルトはfalseです
`max_retries` | 失敗時のDoris Stream Load要求のリトライ回数、データの信頼性を確保するためデフォルトは-1で無限リトライです
`log_request` | トラブルシューティングのためにログ内でDoris Stream Load要求と応答メタデータを出力するかどうか、デフォルトはfalseです
`log_speed_interval` | ログ内で速度を出力する時間間隔、単位は秒、デフォルトは10、0に設定するとこのタイプのログを無効にできます


## 使用例

### TEXTログ収集例

この例では、Doris FEログを例にTEXTログ収集を実演します。

**1. データ**

FEログファイルは通常、Dorisインストールディレクトリ下のfe/log/fe.logファイルに配置されています。これらは典型的なJavaプログラムログで、タイムスタンプ、ログレベル、スレッド名、コード位置、ログ内容などのフィールドを含みます。通常のログだけでなく、スタックトレースを含む例外ログも含まれ、これらは複数行にわたります。ログの収集と保存では、メインログとスタックトレースを単一のログエントリに結合する必要があります。

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
**3. Logstash設定**

Logstashには主に2種類の設定ファイルがあります。1つはLogstashシステム全体用で、もう1つは特定のログ収集用です。

Logstashシステム全体の設定ファイルは通常config/logstash.ymlに配置されます。Dorisへの書き込み時のパフォーマンスを向上させるには、バッチサイズとバッチ遅延を変更する必要があります。1行あたり数百バイトの平均サイズのログの場合、バッチサイズ1,000,000行、バッチ遅延10秒が推奨されます。

``` 
pipeline.batch.size: 1000000
pipeline.batch.delay: 10000
```
特定のログ収集用の設定ファイル（logstash_doris_log.confなど）は、主にETLの各段階に対応する3つの部分で構成されています：
1. Inputは生データの読み取りを担当します。
2. Filterはデータ変換を担当します。
3. Outputは出力先へのデータ送信を担当します。

```
# 1. input is responsible for reading raw data
# File input is an input plugin that can be configured to read the log file of the configured path. It uses the multiline codec to concatenate lines that do not start with a timestamp to the end of the previous line, achieving the effect of merging stacktraces with the main log. File input saves the log content in the @message field, and there are also some metadata fields such as host, log.file.path. Here, we manually add a field named type through add_field, with its value set to fe.log.
input {
    file {
        path => "/mnt/disk2/xiaokang/opt/doris_master/fe/log/fe.log"
        add_field => {"type" => "fe.log"}
        codec => multiline {
            # valid line starts with timestamp
            pattern => "^%{TIMESTAMP_ISO8601} "
            # any line not starting with a timestamp should be merged with the previous line
            negate => true
            what => "previous"
        }
    }
}

# 2. filter section is responsible for data transformation
# grok is a commonly used data transformation plugin that has some built-in patterns, such as TIMESTAMP_ISO8601 for parsing timestamps, and also supports writing regular expressions to extract fields.
filter {
    grok {
        match => {
            # parse log_time, level, thread, position fields from message
            "message" => "%{TIMESTAMP_ISO8601:log_time} (?<level>[A-Z]+) \((?<thread>[^\[]*)\) \[(?<position>[^\]]*)\]"
        }
    }
}

# 3. output section is responsible for data output
# Doris output sends data to Doris using the Stream Load HTTP interface. The data format for Stream Load is specified as JSON through the headers parameter, and the mapping parameter specifies the mapping from Logstash fields to JSON fields. Since headers specify "format" => "json", Stream Load will automatically parse the JSON fields and write them into the corresponding fields of the Doris table.
output {
    doris {
        http_hosts => ["http://localhost:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "doris_log"
        headers => {
          "format" => "json"
          "read_json_by_line" => "true"
          "load_to_single_tablet" => "true"
        }
        mapping => {
          "log_time" => "%{log_time}"
          "collect_time" => "%{@timestamp}"
          "host" => "%{[host][name]}"
          "path" => "%{[log][file][path]}"
          "type" => "%{type}"
          "level" => "%{level}"
          "thread" => "%{thread}"
          "position" => "%{position}"
          "message" => "%{message}"
        }
        log_request => true
    }
}

```
**4. Logstashの実行**

```

${LOGSTASH_HOME}/bin/logstash -f config/logstash_doris_log.conf

# When log_request is set to true, the log will output the request parameters and response results of each Stream Load.
[2024-07-08T22:35:34,772][INFO ][logstash.outputs.doris   ][main][e44d2a24f17d764647ce56f5fed24b9bbf08d3020c7fddcc3298800daface80a] doris stream load response:
{
    "TxnId": 45464,
    "Label": "logstash_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 452,
    "NumberLoadedRows": 452,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 277230,
    "LoadTimeMs": 1797,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 18,
    "ReadDataTimeMs": 9,
    "WriteDataTimeMs": 1758,
    "CommitAndPublishTimeMs": 18
}

# By default, speed information is logged every 10 seconds, including the amount of data since startup (in MB and ROWS), the total speed (in MB/s and R/s), and the speed in the last 10 seconds.

[2024-07-08T22:35:38,285][INFO ][logstash.outputs.doris   ][main] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```
### JSON ログ収集の例

この例では、GitHubイベントアーカイブのデータを使用したJSONログ収集を実演します。

**1. データ**

GitHubイベントアーカイブには、JSONとしてフォーマットされたGitHubユーザーアクションのアーカイブされたデータが含まれています。[ここ](https://data.gharchive.org/)からダウンロードできます。例えば、2024年1月1日午後3時のデータなどです。

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
  `actor.id` BIGINT,
  `actor.login` TEXT,
  `actor.display_login` TEXT,
  `actor.gravatar_id` TEXT,
  `actor.url` TEXT,
  `actor.avatar_url` TEXT,
  `repo.id` BIGINT,
  `repo.name` TEXT,
  `repo.url` TEXT,
  `payload` TEXT,
  `host` TEXT,
  `path` TEXT,
  INDEX `idx_id` (`id`) USING INVERTED,
  INDEX `idx_type` (`type`) USING INVERTED,
  INDEX `idx_actor.id` (`actor.id`) USING INVERTED,
  INDEX `idx_actor.login` (`actor.login`) USING INVERTED,
  INDEX `idx_repo.id` (`repo.id`) USING INVERTED,
  INDEX `idx_repo.name` (`repo.name`) USING INVERTED,
  INDEX `idx_host` (`host`) USING INVERTED,
  INDEX `idx_path` (`path`) USING INVERTED,
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
**3. Logstash設定**

設定ファイルは、以前のTEXTログ収集と以下の点で異なります：

1. fileインプットのcodecパラメータはjsonです。Logstashは各行のテキストをJSON形式として解析し、解析されたフィールドを後続の処理に使用します。
2. 追加の処理や変換が不要なため、filterプラグインは使用されません。

```
input {
    file {
        path => "/tmp/github_events/2024-04-01-23.json"
        codec => json
    }
}

output {
    doris {
        http_hosts => ["http://fe1:8630", "http://fe2:8630", "http://fe3:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "github_events"
        headers => {
          "format" => "json"
          "read_json_by_line" => "true"
          "load_to_single_tablet" => "true"
        }
        mapping => {
          "created_at" => "%{created_at}"
          "id" => "%{id}"
          "type" => "%{type}"
          "public" => "%{public}"
          "actor.id" => "%{[actor][id]}"
          "actor.login" => "%{[actor][login]}"
          "actor.display_login" => "%{[actor][display_login]}"
          "actor.gravatar_id" => "%{[actor][gravatar_id]}"
          "actor.url" => "%{[actor][url]}"
          "actor.avatar_url" => "%{[actor][avatar_url]}"
          "repo.id" => "%{[repo][id]}"
          "repo.name" => "%{[repo][name]}"
          "repo.url" => "%{[repo][url]}"
          "payload" => "%{[payload]}"
          "host" => "%{[host][name]}"
          "path" => "%{[log][file][path]}"
        }
        log_request => true
    }
}

```
**4. Logstashの実行**

```
${LOGSTASH_HOME}/bin/logstash -f logstash_github_events.conf
```
