---
title: Trino Connector 統合開発者ガイド
language: ja
description: "Apache Doris と Trino Connector を統合する方法。コンパイル、設定、Kafka / Hive / MySQL / BigQuery の例を説明します。"
keywords:
    - Apache Doris Trino Connector
    - trino-connector Catalog
    - Trino プラグインのコンパイル
    - trino_connector_plugin_dir
    - Kafka Connector
    - Hive Connector
    - MySQL Connector
    - BigQuery Connector
    - データソース拡張
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

<!-- Knowledge type: Extension development -->
<!-- Applicable scenario: Data source extension / Catalog integration -->

# Trino Connector 統合開発者ガイド {#trino-connector-integration-developer-guide}

この文書は、Trino Connector プラグインを Apache Doris と統合する開発者向けです。Connector プラグインのコンパイル、FE / BE の設定、`trino-connector` Catalog の作成と使用について説明します。Kafka Connector を主な例として使用し、Hive、MySQL、BigQuery など、一般的なプラグインの設定例も示します。

## 目次 {#contents}

- [背景](#background): Trino Connector フレームワークを使用する場面
- [ステップ 1 - Connector プラグインのコンパイル](#step-1---compile-the-connector-plugin): Kafka を例に説明
- [ステップ 2 - FE / BE の設定](#step-2---configure-fe--be): プラグインディレクトリと遅延読み込みの動作
- [ステップ 3 - Catalog の作成と使用](#step-3---create-and-use-the-catalog): `CREATE CATALOG` とプロパティの対応関係
- [一般的な Connector の設定例](#common-connector-configuration-examples): Hive / MySQL / Kafka / BigQuery
- [FAQ とよくあるエラー](#faq-and-common-errors)

---

## 背景 {#background}

<!-- Knowledge type: Architecture decision -->

Doris はバージョン 3.0 以降、Trino Connector プラグインとの統合をサポートしています。Trino Connector プラグインの豊富なエコシステムと Doris の `trino-connector` Catalog 機能により、Doris はより多くのデータソースに接続できます。

| 利用場面 | 推奨する方法 |
|------|----------|
| Hive、Iceberg、Hudi、Paimon、JDBC などの主要なデータソース | パフォーマンス、安定性、互換性に優れる Doris の**組み込み Catalog**を優先して使用する |
| Doris がまだ統合していないその他のデータソース | **Trino Connector 互換フレームワーク**を使用して、より多くのデータソースにすばやく接続する |

> 注: Trino は Apache License 2.0 に基づくオープンソースソフトウェアで、[Trino Software Foundation](https://trino.io/foundation) が提供しています。詳しくは [Trino 公式サイト](https://trino.io/docs/current/)を参照してください。

---

## ステップ 1 - Connector プラグインのコンパイル {#step-1---compile-the-connector-plugin}

<!-- Knowledge type: Procedure -->

Trino はコンパイル済みの公式 Connector プラグインを提供していないため、必要な Connector プラグインを自分でコンパイルする必要があります。

> 注: Doris は現在バージョン 435 の `trino-main` パッケージを使用しているため、Connector プラグインもバージョン 435 をコンパイルすることを推奨します。別のバージョンの Connector プラグインでは、互換性の問題が発生する可能性があります。問題が発生した場合は、Apache Doris コミュニティに報告してください。

Kafka プラグインを例に説明します。

```bash
# 1. Clone the Trino source code
git clone https://github.com/trinodb/trino.git

# 2. Check out version 435
git checkout 435

# 3. Enter the Kafka plugin source directory
cd trino/plugin/trino-kafka

# 4. Compile the Kafka plugin
mvn clean install -DskipTests
```

コンパイル後、`target/trino-kafka-435` ディレクトリが `trino/plugin/trino-kafka/` の下に生成されます。

> 注: 各 Connector プラグインは単一の jar ファイルではなく、**サブディレクトリ**です。

---

## ステップ 2 - FE / BE の設定 {#step-2---configure-fe--be}

<!-- Knowledge type: Configuration parameters -->

Kafka Connector プラグインを用意したら、Doris がプラグインを見つけられるように、`fe.conf` と `be.conf` でプラグインディレクトリを設定する必要があります。

前のステップで用意した `trino-kafka-435` ディレクトリを `/path/to/connectors` の下に配置した場合は、次のように設定します。

| ファイル | 設定項目 | デフォルト値 |
|------|--------|--------|
| `fe.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/fe/connectors` |
| `be.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/be/connectors` |

> **遅延読み込みの動作**: Doris は Trino Connector プラグインを遅延読み込みします。`trino-connector` Catalog 機能を初めて使用するときに、FE / BE ノードを再起動する必要は**ありません**。Doris がプラグインを自動的に読み込みます。ただし、プラグインの読み込みは一度だけ行われるため、**プラグインディレクトリの内容を変更した後は、その変更を反映するために FE / BE ノードを再起動する必要があります**。

---

## ステップ 3 - Catalog の作成と使用 {#step-3---create-and-use-the-catalog}

<!-- Knowledge type: Procedure -->

### 3.1 Trino-Connector Catalog の作成 {#31-create-a-trino-connector-catalog}

```sql
create catalog kafka_tpch properties (
    "type"="trino-connector",
    -- The following four properties come from Trino and match the properties in Trino's etc/catalog/kafka.properties, but each must be prefixed with "trino."
    "trino.connector.name"="kafka",
    "trino.kafka.table-names"="tpch.customer,tpch.orders,tpch.lineitem,tpch.part,tpch.partsupp,tpch.supplier,tpch.nation,tpch.region",
    "trino.kafka.nodes"="localhost:9092",
    "trino.kafka.table-description-dir" = "/mnt/datadisk1/fangtiewei"
);
```

プロパティの説明:

| プロパティ | 説明 |
|------|------|
| `type` | Catalog の種類。`trino-connector` に設定する必要があります |
| `trino.connector.name` | Trino Connector の名前。例: `kafka` |
| `trino.kafka.table-names` など | これらのプロパティは Trino 由来で、すべてに `trino.` プレフィックスを付けます。[Kafka Connector](https://trino.io/docs/current/connector/kafka.html#configuration)を参照してください |

必要なプロパティは Connector プラグインによって異なります。Trino の公式ドキュメント「[コネクタ一覧](https://trino.io/docs/current/connector.html#connector--page-root)」を参照してください。

### 3.2 Catalog の使用 {#32-use-the-catalog}

Trino-Connector Catalog を作成した後は、ほかの Catalog と同じように使用できます。`switch kafka_tpch` で Catalog を切り替え、対応するデータソースのデータをクエリします。

```sql
switch kafka_tpch;
show databases;
select * from tpch.customer limit 10;
```

---

## 一般的な Connector の設定例 {#common-connector-configuration-examples}

### Hive {#hive}

```sql
create catalog emr_hive properties (
    "type"="trino-connector",
    "trino.connector.name"="hive",
    "trino.hive.metastore.uri"="thrift://ip:port",
    "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
);
```

> Hive プラグインに関する注意事項:
> - JVM パラメータに Hadoop ユーザー `-DHADOOP_USER_NAME=user` を追加する必要があります。これは `JAVA_OPTS_FOR_JDK_17` パラメータに追加できます。たとえば、`fe.conf` / `be.conf` で `JAVA_OPTS_FOR_JDK_17="...-DHADOOP_USER_NAME=user"` と設定します。

### MySQL {#mysql}

```sql
create catalog trino_mysql properties (
    "type"="trino-connector",
    "trino.connector.name"="mysql",
    "trino.connection-url" = "jdbc:mysql://ip:port",
    "trino.connection-user" = "user",
    "trino.connection-password" = "password"
);
```

> MySQL プラグインに関する注意事項:
> - `Unknown or incorrect time zone: 'Asia/Shanghai'` というエラーが表示された場合は、JVM 起動パラメータに `-Duser.timezone=Etc/GMT-8` を追加します。`JAVA_OPTS_FOR_JDK_17` パラメータ（`fe.conf` / `be.conf` 内）の末尾に追加できます。

### Kafka {#kafka}

```sql
create catalog kafka properties (
    "type"="trino-connector",
    "trino.connector.name"="kafka",
    "trino.kafka.nodes"="localhost:9092",
    "trino.kafka.table-description-supplier"="CONFLUENT",
    "trino.kafka.confluent-schema-registry-url"="http://localhost:8081",
    "trino.kafka.hide-internal-columns" = "false"
);
```

### BigQuery {#bigquery}

```sql
create catalog bigquery_catalog properties (
    "type"="trino-connector",
    "trino.connector.name"="bigquery",
    "trino.bigquery.project-id"="steam-circlet-388406",
    "trino.bigquery.credentials-file"="/path/to/application_default_credentials.json"
);
```

---

## FAQ とよくあるエラー {#faq-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

**Q: `/path/to/connectors` の下のプラグインを変更しましたが、Doris に変更が反映されないのはなぜですか？**

A: Doris は遅延読み込みを使用しますが、プラグインの読み込みは一度だけ行われます。プラグインを変更した後は、FE / BE ノードを再起動する必要があります。

**Q: 起動時にプラグインのバージョンに互換性がないというエラーが報告される場合は？**

A: コンパイル時に Trino の `435` ブランチをチェックアウトしたか確認してください。Doris は現在バージョン 435 の `trino-main` を使用しており、ほかのバージョンでは互換性の問題が発生する可能性があります。

**Q: Hive プラグインでのクエリ時に権限エラーが報告される、または HDFS にアクセスできない場合は？**

A: `JAVA_OPTS_FOR_JDK_17` に `-DHADOOP_USER_NAME=user` が設定されているか、`core-site.xml` / `hdfs-site.xml` ファイル（`trino.hive.config.resources` で参照）が読み取れるか確認してください。

**Q: MySQL プラグインで `Unknown or incorrect time zone: 'Asia/Shanghai'` が報告される場合は？**

A: `-Duser.timezone=Etc/GMT-8` を `JAVA_OPTS_FOR_JDK_17` に追加してください。

**Q: Hive、Iceberg、Hudi などのデータソースには Trino Connector を使用すべきですか？**

A: 推奨しません。これらのデータソースには、Doris の組み込み Catalog の方がパフォーマンス、安定性、互換性に優れています。Trino Connector フレームワークは、Doris がまだ統合していないデータソースを補うためのものです。
