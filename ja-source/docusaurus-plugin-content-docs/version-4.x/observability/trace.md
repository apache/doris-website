---
{
  "title": "トレース",
  "language": "ja",
  "description": "この記事では、コア観測可能性データの一つであるTraceのストレージと解析プラクティスについて紹介します。"
}
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Trace

この記事では、可観測性の中核データの一つであるTraceのストレージと分析プラクティスについて紹介します。完全な可観測性ソリューションの概要については、[概要](./overview.mdx)を参照してください。リソース評価、クラスターのデプロイメント、および最適化については、[Log](./log.md)を参照してください。

## 1. テーブル作成

Traceデータは、書き込みとクエリパターンの観点で明確な特性があります。テーブル作成時の対象となる設定により、パフォーマンスを大幅に向上させることができます。以下の主要ガイドラインに基づいてテーブルを作成してください：

**パーティショニングとソート**
- 時刻フィールドでRANGEパーティショニングを使用し、動的パーティショニングを有効にして日単位でパーティションを自動管理します。
- `service_name`とDATETIME型の時刻フィールドをキーとして使用します。これにより、特定のサービスについて特定期間のトレースをクエリする際に数倍の高速化が実現されます。

**バケッティング**
- バケット数は、クラスター内の総ディスク数の約3倍にする必要があります。
- RANDOMバケッティング戦略を使用します。書き込み時の単一タブレット取り込みと組み合わせることで、バッチ書き込み効率が向上します。

**コンパクション**
- time_seriesコンパクション戦略を使用して書き込み増幅を削減します。これは高スループット取り込み下でのリソース最適化にとって重要です。

**VARIANT データ型**
- `span_attributes`や`resource_attributes`などの拡張Traceフィールドには、半構造化VARIANT データ型を使用します。これによりJSONデータが自動的にサブカラムに分割されて格納され、圧縮率が向上し、ストレージ容量が削減されると同時に、フィルタリングとサブカラム分析のパフォーマンスも向上します。

**インデックス**
- 頻繁にクエリされるフィールドにインデックスを構築します。
- 全文検索が必要なフィールドについては、parserパラメータを指定します。Unicode tokenizationは一般的にほとんどのニーズを満たします。フレーズクエリをサポートするには`support_phrase`オプションを有効にします。必要ない場合は、ストレージ使用量を削減するためにfalseに設定します。

**ストレージ**
- ホットデータについては、クラウドディスクを使用している場合は1レプリカ、物理ディスクを使用している場合は最低2レプリカを設定します。
- `log_s3`オブジェクトストレージと`log_policy_3day`ポリシーを使用したホット・コールド階層ストレージ設定を使用して、3日を経過したデータをS3に移動します。

```sql
CREATE DATABASE log_db;
USE log_db;

-- Not required for compute-storage separation mode
CREATE RESOURCE "log_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "your_endpoint_url",
    "s3.region" = "your_region",
    "s3.bucket" = "your_bucket",
    "s3.root.path" = "your_path",
    "s3.access_key" = "your_ak",
    "s3.secret_key" = "your_sk"
);

-- Not required for compute-storage separation mode
CREATE STORAGE POLICY log_policy_3day
PROPERTIES(
    "storage_resource" = "log_s3",
    "cooldown_ttl" = "259200"
);

CREATE TABLE trace_table
(        
    service_name          VARCHAR(200),        
    timestamp             DATETIME(6),
    service_instance_id   VARCHAR(200),
    trace_id              VARCHAR(200),        
    span_id               STRING,        
    trace_state           STRING,        
    parent_span_id        STRING,        
    span_name             STRING,        
    span_kind             STRING,        
    end_time              DATETIME(6),        
    duration              BIGINT,        
    span_attributes       VARIANT,        
    events                ARRAY<STRUCT<timestamp:DATETIME(6), name:STRING, attributes:MAP<STRING, STRING>>>,        
    links                 ARRAY<STRUCT<trace_id:STRING, span_id:STRING, trace_state:STRING, attributes:MAP<STRING, STRING>>>,        
    status_message        STRING,        
    status_code           STRING,        
    resource_attributes   VARIANT,        
    scope_name            STRING,        
    scope_version         STRING,
    INDEX idx_timestamp(timestamp) USING INVERTED,
    INDEX idx_service_instance_id(service_instance_id) USING INVERTED,
    INDEX idx_trace_id(trace_id) USING INVERTED,        
    INDEX idx_span_id(span_id) USING INVERTED,        
    INDEX idx_trace_state(trace_state) USING INVERTED,        
    INDEX idx_parent_span_id(parent_span_id) USING INVERTED,        
    INDEX idx_span_name(span_name) USING INVERTED,        
    INDEX idx_span_kind(span_kind) USING INVERTED,        
    INDEX idx_end_time(end_time) USING INVERTED,        
    INDEX idx_duration(duration) USING INVERTED,        
    INDEX idx_span_attributes(span_attributes) USING INVERTED,        
    INDEX idx_status_message(status_message) USING INVERTED,        
    INDEX idx_status_code(status_code) USING INVERTED,        
    INDEX idx_resource_attributes(resource_attributes) USING INVERTED,        
    INDEX idx_scope_name(scope_name) USING INVERTED,        
    INDEX idx_scope_version(scope_version) USING INVERTED        
)        
ENGINE = OLAP        
DUPLICATE KEY(service_name, timestamp)        
PARTITION BY RANGE(timestamp) ()        
DISTRIBUTED BY RANDOM BUCKETS 250
PROPERTIES (
"compression" = "zstd",
"compaction_policy" = "time_series",
"inverted_index_storage_format" = "V2",
"dynamic_partition.enable" = "true",
"dynamic_partition.create_history_partition" = "true",
"dynamic_partition.time_unit" = "DAY",
"dynamic_partition.start" = "-30",
"dynamic_partition.end" = "1",
"dynamic_partition.prefix" = "p",
"dynamic_partition.buckets" = "250",
"dynamic_partition.replication_num" = "2", -- Not required for compute-storage separation
"replication_num" = "2", -- Not required for compute-storage separation
"storage_policy" = "log_policy_3day" -- Not required for compute-storage separation
);
```
## 2. Trace収集

DorisはOpenTelemetryのようなTrace収集システムと統合できる、オープンで汎用的なStream HTTP APIを提供します。

### OpenTelemetry統合

1. **アプリケーション側でのOpenTelemetry SDK統合**

ここではOpenTelemetry Java SDKと統合されたSpring Bootサンプルアプリケーションを使用します。サンプルアプリケーションは公式の[demo](https://docs.spring.io/spring-boot/tutorial/first-application/index.html)から取得したもので、パス"/"へのリクエストに対してシンプルな"Hello World!"文字列を返します。  
[OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases)をダウンロードします。Java Agentを使用する利点は、既存のアプリケーションに変更を加える必要がないことです。他の言語や統合方法については、OpenTelemetry公式サイトの[Language APIs & SDKs](https://opentelemetry.io/docs/languages/)または[Zero-code Instrumentation](https://opentelemetry.io/docs/zero-code/)を参照してください。

1. **OpenTelemetry Collectorのデプロイと設定**

[OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector-releases/releases)をダウンロードして展開します。Doris Exporterを含む"otelcol-contrib"で始まるパッケージをダウンロードする必要があります。

以下のように`otel_demo.yaml`設定ファイルを作成します。詳細については、Doris Exporter[documentation](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter)を参照してください。

```yaml
receivers:
  otlp: # OTLP protocol, receiving data sent by the OpenTelemetry Java Agent
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    send_batch_size: 100000 # Number of records per batch; recommended batch size between 100MB-1GB
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      traces: doris_table_name
    create_schema: true # Whether to auto-create schema; manual table creation is needed if set to false
    mysql_endpoint: localhost:9030  # FE MySQL address
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # Timeout for HTTP stream load client
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"
```
1. **OpenTelemetry Collectorを実行する**

```bash
./otelcol-contrib --config otel_demo.yaml
```
4. **Spring Boot サンプルアプリケーションの開始**

アプリケーションを開始する前に、コードを変更することなく、いくつかの環境変数を追加するだけです。

```bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # Path to OpenTelemetry Java Agent
export OTEL_JAVAAGENT_LOGGING="none" # Disable Otel logs to prevent interference with application logs
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # Send trace data using OTLP protocol
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # Address of the OpenTelemetry Collector

java -jar myproject-0.0.1-SNAPSHOT.jar
```
5. **Spring Boot Example Service にアクセスしてTrace データを生成する**

`curl localhost:8080` を実行すると、`hello` サービスへの呼び出しがトリガーされます。OpenTelemetry Java Agent は自動的にTrace データを生成し、OpenTelemetry Collector に送信します。Collector は設定されたDoris Exporter を通じてTrace データをDoris テーブル（デフォルトは `otel.otel_traces`）に書き込みます。

## 3. Trace クエリ

Trace クエリは通常、Grafana などの視覚的クエリインターフェースを使用します。

- 時間範囲とサービス名でフィルタリングし、レイテンシ分布チャートや詳細な個別Trace を含むTrace サマリーを表示します。

  ![Trace List](/images/observability/trace-list.png)

- リンクをクリックしてTrace の詳細を表示します。

  ![Trace Detail](/images/observability/trace-detail.png)
