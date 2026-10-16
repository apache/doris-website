---
title: データリネージプラグインの開発
language: ja
description: リネージイベントをログに記録する、または外部のデータガバナンスシステムに転送する Apache Doris データリネージプラグインのビルド、パッケージ化、デプロイ、検証方法を説明します。
keywords:
    - Apache Doris
    - データリネージ
    - LineagePlugin
    - LineagePluginFactory
    - ServiceLoader
    - プラグイン開発
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
<!-- Applicable scenario: Data governance integration / Kernel extension development -->

このドキュメントでは、Apache Doris 向けの外部データリネージプラグインの開発方法を説明します。プラグインは、サポート対象の DML 文が成功した後に `LineageInfo` イベントを受け取り、変換してログ、メッセージングシステム、または外部のメタデータガバナンスプラットフォームに書き込みます。

> 対象バージョン: Apache Doris コミュニティ版 4.0.6 以降。FE にデプロイされている Doris コミュニティ版と同じリリースまたはソースリビジョンを使ってプラグインをコンパイルしてください。

## 対象範囲とライフサイクル

リネージフレームワークは FE 側の SPI です。リネージデータの保存、クエリ API の提供、リネージグラフの描画は行いません。プラグインは、`LineageInfo` 内のメモリ上の Java オブジェクトを、送信先システムが必要とする形式と転送プロトコルに変換します。

現行の実装では、成功した `INSERT INTO ... SELECT`、`INSERT OVERWRITE TABLE ... SELECT`、`CREATE TABLE AS SELECT` 文についてのみイベントを生成します。`VALUES` だけを使用する書き込みと、書き込み先が `__internal_schema` の書き込みはスキップされます。`SELECT`、`UPDATE`、`DELETE`、ロードジョブは、このフレームワークの対象外です。一部の `UPDATE` と `DELETE` の実行経路では内部的に Insert コマンドを再利用しますが、元のコマンド種別のチェックによってリネージイベントの送信対象から除外されます。

![データリネージ収集の構成: 成功したサポート対象の DML 文を Nereids が解析し、LineageInfo に抽出して FE のキューに入れ、プラグインが外部のガバナンスシステムに送信します。](/images/data-lineage/lineage-architecture.svg)

`eventFilter()` は、DML クエリの実行経路でリネージを抽出する前と、ワーカーがイベントを配送する前に、それぞれ呼び出されます。プラグインがイベントを受け取らない場合は `false` を返します。このメソッドはクエリスレッドとワーカースレッドから並行して呼び出されるため、スレッドセーフである必要があります。`exec()` は単一のワーカースレッドから呼び出されますが、`eventFilter()` と並行して実行されることがあります。

FE の起動時に、まず ServiceLoader が各 `LineagePluginFactory` を検出します。次に FE は Factory の `create(context)` メソッドを呼び出し、返されたプラグインの `initialize(context)` を呼び出します。`LineagePluginFactory.create(context)` のデフォルト実装は引数なしの `create()` に処理を委譲するため、このガイドの最小構成の例では `create()` だけを実装します。`PluginContext` は `getProperties()` を通じて変更不可のプロパティマップを公開します。FE はプラグイン名とディレクトリを `plugin.name` と `plugin.path` のエントリに格納します。これらは `context.getProperties().get("plugin.name")` と `context.getProperties().get("plugin.path")` で取得できます。プラグインディレクトリ内の設定ファイルを読み込む本番用プラグインでは、`initialize(context)` をオーバーライドし、`plugin.path` エントリからファイルの場所を特定して、その中でリソースを初期化できます。

## リネージイベントモデル

`LineageInfo` には、書き込み先テーブル、書き込み先の出力カラム、ソーステーブル、直接リネージ、間接リネージ、`LineageContext` が含まれます。

| 要素 | 意味 |
| --- | --- |
| 書き込み先 | 書き込み先のテーブルと出力カラム。 |
| ソーステーブル | 解析済みの論理プランで参照されるテーブル。 |
| 直接リネージ | 各出力 Slot からソース式へのマップ。`IDENTITY`、`TRANSFORMATION`、`AGGREGATION` に分類されます。 |
| データセットの間接リネージ | 結果セット全体に影響する式: `JOIN`、`FILTER`、`GROUP_BY`、`SORT`。 |
| 出力の間接リネージ | 特定の出力カラムに影響する依存関係: `WINDOW` と `CONDITIONAL`。 |
| クエリコンテキスト | クエリ ID、SQL テキスト、ユーザー、クライアント IP、セッションのデータベースとカタログ、実行状態、タイムスタンプ、所要時間、サニタイズされた外部カタログのプロパティ。 |

直接リネージは、出力値がどのように生成されるかを表します。単純なソースカラム参照は `IDENTITY` で、例は `target.customer_id <- source.customer_id` です。集約関数を含まない計算、関数、ウィンドウ式、条件式は `TRANSFORMATION` で、例は `UPPER(source.region)` です。集約関数を含む式は `AGGREGATION` で、例は `SUM(source.amount)` です。間接リネージは、出力値には直接ならないものの出力に影響する式を記録します。これには Join キー、`WHERE` と `HAVING` の述語、グループ化キー、ソートキーが含まれます。`WINDOW` はウィンドウのパーティション分割と順序付けに使用される入力を記録します。`CONDITIONAL` は、特定の出力カラムに対する `CASE`、`IF`、`COALESCE` の影響を記録します。

### リネージイベントモデルの例 {#lineage-event-model-example}

次の例では、ソーステーブルと書き込み先テーブルをそれぞれ一つ使用して、三種類すべての直接リネージ、データセットの間接リネージ、出力の間接リネージを示します。実行ユーザーには、データベースとテーブルの作成、データの書き込み、データのクエリに必要な権限が必要です。

```sql
CREATE DATABASE IF NOT EXISTS lineage_demo;
USE lineage_demo;

CREATE TABLE lineage_source (
    region VARCHAR(32),
    amount DECIMAL(18, 2),
    status VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_target (
    region VARCHAR(32),
    total_amount DECIMAL(18, 2),
    region_seq BIGINT,
    region_group VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO lineage_source VALUES
    ('east', 100.00, 'PAID'),
    ('east', 30.00, 'CANCELLED'),
    ('west', 80.00, 'PAID');

INSERT INTO lineage_target
SELECT
    region,
    SUM(amount) AS total_amount,
    ROW_NUMBER() OVER (ORDER BY region) AS region_seq,
    CASE
        WHEN region = 'east' THEN 'CORE'
        ELSE 'OTHER'
    END AS region_group
FROM lineage_source
WHERE status = 'PAID'
GROUP BY region
ORDER BY SUM(amount) DESC;

SELECT region, total_amount, region_seq, region_group
FROM lineage_target
ORDER BY region;
```

クエリの結果は次のとおりです。

```text
+--------+--------------+------------+--------------+
| region | total_amount | region_seq | region_group |
+--------+--------------+------------+--------------+
| east   |       100.00 |          1 | CORE         |
| west   |        80.00 |          2 | OTHER        |
+--------+--------------+------------+--------------+
```

最初の `VALUES` だけを使用する Insert ではイベントは生成されません。`INSERT INTO lineage_target ... SELECT` が成功すると、そのイベントには次の主な関係が含まれます。

| リネージのレベル | この例の内容 |
| --- | --- |
| テーブルリネージ | `internal.lineage_demo.lineage_source` -> `internal.lineage_demo.lineage_target`。 |
| カラムの直接リネージ | `region` は `IDENTITY`、`total_amount` は `AGGREGATION`、`region_seq` と `region_group` は `TRANSFORMATION`。 |
| データセットの間接リネージ | `FILTER` は `status = 'PAID'`、`GROUP_BY` は `region`、`SORT` は `SUM(amount) DESC`。 |
| 出力の間接リネージ | `WINDOW` については `region_seq` の依存先が `region`、`CONDITIONAL` については `region_group` の依存先が `region = 'east'`。 |
| クエリコンテキスト | 実際のクエリ ID、上記の Insert SQL、実行ユーザー、クライアント IP が含まれます。セッションのデータベースは `lineage_demo`、Internal Catalog は `internal`、実行状態は `OK` です。 |

この例には Join がないため、データセットレベルの `JOIN` 依存関係もありません。Join を含むクエリでは、Join 条件がデータセットレベルの `JOIN` 依存関係として記録されます。

イベントがプラグインに届く前に、抽出器は CTE の生成側の式を解決し、`UNION` の分岐を展開します。それでもプラグインは `Expression`、`SlotReference`、`TableIf` を Doris 内部の Java オブジェクトとして扱い、FE の外部に送信する前に安定した名前または送信先のスキーマに変換する必要があります。

## プラグイン API リファレンス

リネージ SPI は、FE 起動時に検出される Factory、その Factory が作成するプラグインインスタンス、変更不可の実行時コンテキスト、プラグインに渡される `LineageInfo` イベントで構成されます。次の表に、プラグイン実装が直接使用する拡張メソッドを示します。

### API の概要

| メソッド | 入力 | 戻り値の型 | 用途 |
| --- | --- | --- | --- |
| `LineagePluginFactory.name()` | なし | `String` | `activate_lineage_plugin` で使用する一意の Factory 名を返します。 |
| `LineagePluginFactory.create()` | なし | `LineagePlugin` | Factory で実行時コンテキストを読み込まずにプラグインインスタンスを作成します。 |
| `LineagePluginFactory.create(PluginContext)` | `PluginContext` | `LineagePlugin` | 実行時コンテキストを参照してプラグインインスタンスを作成します。デフォルト実装は `create()` に処理を委譲します。 |
| `LineagePlugin.name()` | なし | `String` | プラグイン名を返します。Factory 名と一致させる必要があります。 |
| `LineagePlugin.eventFilter()` | なし | `boolean` | プラグインが現在リネージイベントを受け取るかどうかを示します。 |
| `LineagePlugin.exec(LineageInfo)` | `LineageInfo` | `boolean` | 単一のリネージイベントを処理します。 |
| `Plugin.initialize(PluginContext)` | `PluginContext` | `void` | Factory によるプラグインの作成後にリソースを初期化します。デフォルト実装は何もしません。 |
| `Plugin.close()` | なし | `void` | プラグインのリソース解放を目的とするライフサイクルフックです。デフォルト実装は何もしません。 |
| `PluginContext.getProperties()` | なし | `Map<String, String>` | 変更不可の実行時プロパティマップを返します。 |

### `LineagePluginFactory`

`LineagePluginFactory` は ServiceLoader のエントリーポイントです。FE は Factory を検出し、`name()` の戻り値で選択してから、プラグインインスタンスを一つ作成します。

```java
String name();
LineagePlugin create();
default LineagePlugin create(PluginContext context);
```

#### `name()`

- **入力:** なし。
- **戻り値:** 大文字と小文字を区別する一意の Factory 識別子である `String`。
- **動作:** 戻り値が `activate_lineage_plugin` の各項目と照合されます。この例では `example-lineage` を返します。

#### `create()`

- **入力:** なし。
- **戻り値:** 新しい `LineagePlugin` インスタンス。
- **動作:** プラグインの作成に実行時コンテキストが不要な場合に、このメソッドを実装します。デフォルトの `create(PluginContext)` メソッドはこのメソッドに処理を委譲します。

#### `create(PluginContext context)`

- **入力:** このプラグインディレクトリ用に用意された変更不可の実行時コンテキスト `PluginContext context`。
- **戻り値:** 新しい `LineagePlugin` インスタンス。
- **動作:** Factory 自体がプラグインの作成時に実行時プロパティを必要とする場合にのみ、このメソッドをオーバーライドします。作成後、FE は返されたプラグインの `initialize(context)` を呼び出します。

作成時に `null` を返すか例外をスローすると、そのプラグインはロードされません。プラグインの検出は FE の起動時に行われるため、Factory メソッド内で時間のかかる送信先への呼び出しを行わないでください。

### `LineagePlugin`

`LineagePlugin` はリネージイベントを受け取り、ライフサイクルメソッド `initialize()` と `close()` を `Plugin` から継承します。

```java
String name();
boolean eventFilter();
boolean exec(LineageInfo lineageInfo);
default void initialize(PluginContext context);
default void close();
```

#### `name()`

- **入力:** なし。
- **戻り値:** プラグイン識別子である `String`。
- **動作:** 有効化、ログ、運用設定で同じ名前を使用できるよう、`LineagePluginFactory.name()` と同じ安定した識別子を返します。

#### `eventFilter()`

- **入力:** なし。
- **戻り値:** `boolean`。`true` はプラグインがリネージイベントを受け取ることを、`false` は FE がそのプラグインをスキップすることを意味します。
- **動作:** FE はクエリスレッド上でのリネージ抽出前と、リネージワーカースレッド上での配送前に、このメソッドを呼び出します。スレッドセーフであり、すぐに戻る必要があります。抽出前にロード済みのすべてのプラグインが `false` を返した場合、FE はその文のリネージ抽出をスキップします。

#### `exec(LineageInfo lineageInfo)`

- **入力:** 成功したサポート対象の DML 文から抽出された単一のリネージイベント `LineageInfo lineageInfo`。
- **戻り値:** `boolean`。`true` は成功、`false` は失敗を呼び出し元に報告します。
- **動作:** `exec()` は単一のリネージワーカースレッドから呼び出されますが、クエリスレッド上の `eventFilter()` の呼び出しと並行して実行されることがあります。現行のフレームワークは、`exec()` が `false` を返しても再試行や再キューイングを行わず、DML の状態も変更しません。例外はログに記録され、その後のプラグインまたはイベントの処理が続行されます。

#### `initialize(PluginContext context)`

- **入力:** Factory に渡されたものと同じ実行時コンテキスト `PluginContext context`。
- **戻り値:** `void`。
- **動作:** FE はプラグイン作成後にこのメソッドを呼び出します。`plugin.path` から設定を読み込み、クライアントを作成し、その他のリソースを確保する場合はオーバーライドします。例外をスローするとプラグインはロードされません。

#### `close()`

- **入力:** なし。
- **戻り値:** `void`。
- **動作:** 継承されたこのライフサイクルフックはリソースのクリーンアップを目的とします。現行のリネージプロセッサには動的なアンロードまたはリロードの経路がないため、JAR の置き換え時に `close()` が呼び出されることを前提にしないでください。JAR を置き換えた場合は FE の再起動が必要です。

### `PluginContext`

```java
Map<String, String> getProperties();
```

`getProperties()` は引数を取らず、変更不可の `Map<String, String>` を返します。リネージローダーは次のエントリを設定します。

| プロパティ | 型 | 意味 |
| --- | --- | --- |
| `plugin.name` | `String` | 検出された Factory が返す名前。 |
| `plugin.path` | `String` | 外部プラグインディレクトリの絶対パス。 |

これらは `context.getProperties().get("plugin.name")` と `context.getProperties().get("plugin.path")` で取得します。このマップは変更できません。プラグインは `plugin.path` を使って自身の設定ファイルを探せますが、ディレクトリ名が Factory 名と同じであると仮定してはいけません。

### `LineageInfo`

`LineageInfo` は `exec()` の入力型です。プラグインは次のメソッドで内容を読み取り、Doris のオブジェクトを送信先のイベントスキーマに変換します。

| メソッド | 戻り値の型 | 意味 |
| --- | --- | --- |
| `getTargetTable()` | `TableIf` | 書き込み先のテーブル。 |
| `getTargetColumns()` | `List<Slot>` | 書き込み順に並んだ書き込み先の出力カラム。 |
| `getTableLineageSet()` | `Set<TableIf>` | 解析済みプランで参照されるソーステーブル。 |
| `getDirectLineageMap()` | `Map<SlotReference, SetMultimap<DirectLineageType, Expression>>` | 各出力 Slot に対応する直接のソース式。 |
| `getDatasetIndirectLineageMap()` | `Multimap<IndirectLineageType, Expression>` | データセットレベルの `JOIN`、`FILTER`、`GROUP_BY`、`SORT` 依存関係。 |
| `getInDirectLineageMapByDataset()` | `Map<SlotReference, SetMultimap<IndirectLineageType, Expression>>` | データセットレベルの依存関係をすべての出力 Slot に適用した派生ビュー。`WINDOW` と `CONDITIONAL` は含みません。 |
| `getOutputIndirectLineageMap()` | `Map<SlotReference, SetMultimap<IndirectLineageType, Expression>>` | 出力ごとの `WINDOW` と `CONDITIONAL` 依存関係。 |
| `getContext()` | `LineageContext` | このイベントのクエリと実行のメタデータ。 |

`LineageInfo` は、FE の抽出器が使用する setter と `add*` メソッドも公開しています。通常、送信先プラグインは上記の getter でオブジェクトを読み取り、イベントを変更しないようにします。返される `TableIf`、`Slot`、`SlotReference`、`Expression` の値は Doris の実行時オブジェクトであり、安定した転送形式の識別子ではありません。

### `LineageContext`

`LineageContext` は `LineageInfo.getContext()` から返されます。各 getter は引数を取りません。

| メソッド | 戻り値の型 | 意味 |
| --- | --- | --- |
| `getSourceCommand()` | `Class<? extends Command>` | イベントを生成したコマンドのクラス。例: `InsertIntoTableCommand`。 |
| `getQueryId()` | `String` | クエリ ID。 |
| `getQueryText()` | `String` | 元の DML テキスト。 |
| `getUser()` | `String` | 実行ユーザー。 |
| `getClientIp()` | `String` | クライアント IP アドレス。 |
| `getState()` | `String` | クエリの実行状態。 |
| `getDatabase()` | `String` | セッションのデータベース。必ずしも書き込み先テーブルのデータベースではありません。 |
| `getCatalog()` | `String` | セッションの Catalog。必ずしも書き込み先テーブルの Catalog ではありません。 |
| `getTimestampMs()` | `long` | イベントのタイムスタンプ（ミリ秒）。取得できない場合は `-1`。 |
| `getDurationMs()` | `long` | クエリの所要時間（ミリ秒）。取得できない場合は `-1`。 |
| `getExternalCatalogProperties()` | `Map<String, Map<String, String>>` | クエリで参照される外部 Catalog のサニタイズ済みプロパティ。 |

元の SQL、ユーザー、クライアント IP、式、外部 Catalog のプロパティには機密情報が含まれる可能性があります。本番用プラグインでは、これらを外部に送信する前に、独自のアクセス制御、マスキング、サイズ制限、保持ポリシーを適用してください。

## プラグインの開発

このセクションでは、公式コミュニティリポジトリの公開タグ `4.0.6`（`github.com/apache/doris`）を使用し、ソースツリー内に `example-lineage` Maven サブモジュールを追加します。プラグインは各イベントを FE ログにのみ書き込みます。HTTP サービスを起動せず、外部のガバナンスプラットフォームにも依存しません。この実装では、プラグインの開発からロードまでの一連の流れを示します。本番用プラグインでは、`LineageInfo` をサードパーティのスキーマに変換したり、OpenMetadata のようなメタデータプラットフォームが公開する API を呼び出したり、OpenLineage 仕様に準拠したリネージイベントを送出したりできます。以下のソースパスはすべて、同じ Doris ソースルートからの相対パスです。

### ステップ 1: Doris ソースの準備

対象の FE と完全に一致する公開リリースをチェックアウトし、ソースルートを `DORIS_SOURCE` に設定します。

```shell
git clone https://github.com/apache/doris.git
export DORIS_SOURCE="$(pwd)/doris"
cd "${DORIS_SOURCE}"
git checkout 4.0.6
```

以降の `$DORIS_SOURCE/fe_plugins/...` パスはすべて、このソースディレクトリを指します。FE のインストールディレクトリと取り違えたり、別のバージョンの FE JAR を使ってコンパイルしたりしないでください。

### ステップ 2: Maven モジュールの作成

Doris ソースルートで次のコマンドを実行します。

```shell
cd "${DORIS_SOURCE}"
mkdir -p fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example
mkdir -p fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services
```

このセクションを終えると、新しいファイルは次のように配置されます。

```text
$DORIS_SOURCE/
└── fe_plugins/
    ├── pom.xml                                      # Existing file; add the lineage module
    └── lineage/
        ├── pom.xml
        └── example-lineage/
            ├── pom.xml
            └── src/main/
                ├── java/org/apache/doris/plugin/lineage/example/
                │   ├── ExampleLineagePluginFactory.java
                │   └── LoggingLineagePlugin.java
                └── resources/META-INF/services/
                    └── org.apache.doris.nereids.lineage.LineagePluginFactory
```

既存の `$DORIS_SOURCE/fe_plugins/pom.xml` を編集し、`lineage` を `<modules>` に追加します。既存のモジュールはすべて残してください。この断片でファイル全体を置き換えないでください。

```xml
<modules>
    <!-- Keep the modules already present in fe_plugins/pom.xml -->
    <module>lineage</module>
</modules>
```

`$DORIS_SOURCE/fe_plugins/lineage/pom.xml` を作成します。

```xml
<?xml version="1.0" encoding="UTF-8"?>
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
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>fe-plugins</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>lineage</artifactId>
    <packaging>pom</packaging>
    <modules>
        <module>example-lineage</module>
    </modules>
</project>
```

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/pom.xml` を作成します。

```xml
<?xml version="1.0" encoding="UTF-8"?>
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
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>lineage</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>example-lineage</artifactId>
    <packaging>jar</packaging>
    <dependencies>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-core</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-extension-spi</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <build>
        <finalName>example-lineage</finalName>
    </build>
</project>
```

これらの API は FE が提供するため、依存関係にはすべて `provided` を使用します。プラグイン JAR に Doris や Log4j のクラスを含めないでください。

### ステップ 3: Factory の実装

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/ExampleLineagePluginFactory.java` を作成します。

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.doris.nereids.lineage.LineagePluginFactory;

/** Factory discovered by ServiceLoader at FE startup. */
public class ExampleLineagePluginFactory implements LineagePluginFactory {
    @Override
    public String name() {
        return "example-lineage";
    }

    @Override
    public LineagePlugin create() {
        return new LoggingLineagePlugin();
    }
}
```

`example-lineage` は `name()` が返す一意のプラグイン識別子です。後で設定する `activate_lineage_plugin` には、これと完全に同じ値を指定する必要があります。

### ステップ 4: ログ記録プラグインの実装

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/LoggingLineagePlugin.java` を作成します。

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.catalog.TableIf;
import org.apache.doris.nereids.lineage.LineageContext;
import org.apache.doris.nereids.lineage.LineageInfo;
import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Objects;
import java.util.stream.Collectors;

/** Minimal lineage plugin that writes one summary line for each event. */
public class LoggingLineagePlugin implements LineagePlugin {
    private static final Logger LOG = LogManager.getLogger(LoggingLineagePlugin.class);
    private static final String PLUGIN_NAME = "example-lineage";

    @Override
    public String name() {
        return PLUGIN_NAME;
    }

    @Override
    public boolean eventFilter() {
        return true;
    }

    @Override
    public boolean exec(LineageInfo lineageInfo) {
        if (lineageInfo == null) {
            return false;
        }

        LineageContext context = lineageInfo.getContext();
        LOG.info("LINEAGE_EVENT queryId={} command={} user={} clientIp={} "
                        + "catalog={} database={} state={} durationMs={} target={} sources={} "
                        + "direct={} datasetIndirect={} outputIndirect={}",
                value(context == null ? null : context.getQueryId()),
                command(context),
                value(context == null ? null : context.getUser()),
                value(context == null ? null : context.getClientIp()),
                value(context == null ? null : context.getCatalog()),
                value(context == null ? null : context.getDatabase()),
                value(context == null ? null : context.getState()),
                context == null ? -1L : context.getDurationMs(),
                tableName(lineageInfo.getTargetTable()),
                sourceTables(lineageInfo),
                lineageInfo.getDirectLineageMap(),
                lineageInfo.getDatasetIndirectLineageMap(),
                lineageInfo.getOutputIndirectLineageMap());
        return true;
    }

    private String sourceTables(LineageInfo lineageInfo) {
        if (lineageInfo.getTableLineageSet() == null) {
            return "[]";
        }
        return lineageInfo.getTableLineageSet().stream()
                .filter(Objects::nonNull)
                .map(TableIf::getNameWithFullQualifiers)
                .sorted()
                .collect(Collectors.joining(",", "[", "]"));
    }

    private String tableName(TableIf table) {
        return table == null ? "" : table.getNameWithFullQualifiers();
    }

    private String command(LineageContext context) {
        return context == null || context.getSourceCommand() == null
                ? "" : context.getSourceCommand().getSimpleName();
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
```

この例では、元の SQL、外部カタログのプロパティ、認証情報はログに記録しません。ただし、直接リネージと間接リネージの式には SQL リテラルが含まれることがあるため、この実装は開発時の検証にのみ使用してください。本番用プラグインでは、セキュリティポリシーに従って式をサニタイズし、各ログエントリの長さを制限し、ユーザーとクライアント IP の値を記録するかどうかを判断してください。

### ステップ 5: Factory の登録

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory` を作成します。このファイルには、Factory クラスの完全修飾名だけを記述します。

```text
org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory
```

各外部プラグインディレクトリで公開できる `LineagePluginFactory` は一つだけです。また、Factory 名はロードされるすべてのプラグイン間で一意である必要があります。

### ステップ 6: プラグインのビルド

このソースディレクトリで初めてプラグインをビルドする前に、[Linux](/community/source-install/compilation-linux) または [macOS](/community/source-install/compilation-mac) 向けの Doris ソースビルド環境を準備し、FE を一度ビルドします。次の環境変数は、リネージプラグインのビルドには不要な UI、Hive UDF、BE Java 拡張だけを無効にします。FE のビルドはスキップしません。

```shell
cd "${DORIS_SOURCE}"
DISABLE_BUILD_UI=ON \
DISABLE_BE_JAVA_EXTENSIONS=ON \
DISABLE_BUILD_HIVE_UDF=ON \
./build.sh --fe
```

この手順では Thrift と Protobuf のソースを生成し、FE をビルドします。新しくチェックアウトしたソースツリーでこの手順を省略して以下の Maven コマンドを直接実行すると、`org.apache.doris.thrift` などの生成クラスがないためコンパイルに失敗します。同じソースバージョンで `./build.sh --fe` がすでに成功している場合は、繰り返す必要はありません。

次に、プラグインに必要な FE モジュールをローカル Maven リポジトリにインストールし、プラグインのサブモジュールをビルドします。

```shell
cd "${DORIS_SOURCE}"
mvn -f fe/pom.xml install \
  -pl fe-common,fe-extension-spi,fe-extension-loader,fe-core \
  -DskipTests -Dcheckstyle.skip=true
mvn -f fe_plugins/pom.xml -pl lineage/example-lineage -am clean package \
  -DskipTests -Dcheckstyle.skip=true
```

ビルドが成功すると、次のファイルが生成されます。

```text
$DORIS_SOURCE/fe_plugins/lineage/example-lineage/target/example-lineage.jar
```

SPI ファイルと JAR の内容を確認します。

```shell
PLUGIN_JAR="${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar"
unzip -p "${PLUGIN_JAR}" \
  META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory
if jar tf "${PLUGIN_JAR}" | grep -qE '^org/apache/doris/(nereids|extension)/'; then
  echo "ERROR: Doris API classes must not be packaged in the plugin JAR" >&2
  exit 1
fi
```

最初のコマンドでは `org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory` が出力される必要があります。続くチェックでは、JAR に Doris API クラスが含まれていなければ何も出力されず、終了コードはゼロになります。

### ステップ 7: プラグインのデプロイと有効化

このセクションの `FE_HOME` は、`bin/`、`conf/`、`lib/` を含む単一の FE のインストールディレクトリを指し、Doris のソースディレクトリではありません。`start_fe.sh` はこのディレクトリを FE プロセスの `DORIS_HOME` に設定します。すべての FE に JAR をコピーします。

```shell
export FE_HOME=/opt/apache-doris/fe
mkdir -p "${FE_HOME}/plugins/lineage/example-lineage"
cp "${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar" \
  "${FE_HOME}/plugins/lineage/example-lineage/"
```

FE を実行する OS ユーザーには、プラグインディレクトリと JAR の読み取り権限が必要です。

デプロイ後のディレクトリ構成は次のとおりです。

```text
$FE_HOME/
└── plugins/
    └── lineage/
        └── example-lineage/
            └── example-lineage.jar
```

すべての FE の `$FE_HOME/conf/fe.conf` を編集します。

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| 設定項目 | 型とデフォルト値 | 必須かどうか | 動作 |
| --- | --- | --- | --- |
| `plugin_dir` | 文字列。`$FE_HOME/plugins` | いいえ | プラグインのルートディレクトリ。リネージローダーは `lineage/` 直下の子ディレクトリを走査します。デフォルトのディレクトリを使う場合は、この設定を省略します。 |
| `activate_lineage_plugin` | 文字列配列。空 | 明示的な設定を推奨 | インスタンス化する Factory 名をカンマで区切って指定します。空の場合は、検出されたすべての Factory がインスタンス化されます。 |
| `lineage_event_queue_size` | 正の整数。`50000` | いいえ | 現在の FE でワーカーの処理を待つイベントの最大数。キューが満杯になると、新しいイベントは破棄されます。 |

これらの設定は現在の FE プロセスに適用され、起動時にのみ読み込まれます。DML を実行できるすべての FE にプラグインをデプロイして設定してください。設定の変更または JAR の置き換え後は、該当する FE を再起動します。`ADMIN SET FRONTEND CONFIG` で設定を動的に変更することはできません。

## プラグインの検証

FE を再起動したら、まずプラグインがロードされたことを確認します。FE のログディレクトリを変更している場合は、`FE_LOG` を実際の `fe.log` のパスに置き換えてください。

```shell
export FE_LOG="${FE_HOME}/log/fe.log"
grep 'Loaded lineage plugin: example-lineage' "${FE_LOG}" | tail -1
```

前述の[リネージイベントモデルの例](#lineage-event-model-example)を実行し、最新のイベントを確認します。

```shell
grep 'LINEAGE_EVENT' "${FE_LOG}" | tail -1
```

ログには、実際のクエリ ID、`InsertIntoTableCommand`、書き込み先テーブル `lineage_target`、ソーステーブル `lineage_source`、および `direct`、`datasetIndirect`、`outputIndirect` の各項目が含まれる必要があります。例:

```text
LINEAGE_EVENT queryId=<query-id> command=InsertIntoTableCommand ...
target=internal.lineage_demo.lineage_target
sources=[internal.lineage_demo.lineage_source] direct={...}
datasetIndirect={...} outputIndirect={...}
```

実際のログは一行ですが、上では読みやすいように改行しています。`INSERT INTO lineage_source VALUES ...` はイベントを生成しません。このログエントリを生成するのは `INSERT INTO lineage_target ... SELECT` だけです。

検証が完了し、サンプルデータが不要になったら、次を実行します。

```sql
DROP DATABASE lineage_demo;
```

## 信頼性とトラブルシューティング

| 状況 | フレームワークの動作 | プラグイン側の推奨対応 |
| --- | --- | --- |
| キューが満杯 | 新しいイベントが破棄され、警告がログに記録されます。DML の結果には影響しません。 | `exec()` の処理を短く保ち、送信先への書き込みは FE のクリティカルパスの外でバッチ化またはバッファリングします。 |
| `exec()` が例外をスローする | ワーカーは例外をログに記録し、次のプラグインまたはイベントの処理を続けます。 | 想定される送信先の障害を捕捉し、回数を制限した再試行を追加し、メトリクスを公開します。 |
| `exec()` が `false` を返す | 現行のフレームワークは戻り値を無視します。再試行やイベントの再キューイングは行わず、DML の状態も変更しません。 | 失敗を記録し、プラグイン内で回数を制限した再試行を実装します。復旧を戻り値に依存させないでください。 |
| プラグインの処理が遅い | 単一のワーカーがイベントを順次配送するため、遅いプラグインは後続のすべてのイベントを遅延させます。 | 遅い送信先システムには、容量に上限を設けた内部キューと別の送信ワーカープールを使用します。 |
| Factory 名が重複している | 最初に検出された Factory が保持され、重複する Factory はスキップされます。 | 全体で一意の名前を使用します。 |
| 起動後に JAR が変更された | ローダーはプラグインディレクトリの監視、リロード、アンロードを行いません。 | JAR や依存関係を置き換えた後は FE を再起動します。 |

### FE ログによる問題の診断

| ログのキーワード | 主な原因 | 対処方法 |
| --- | --- | --- |
| `Skip lineage plugin directory due to load failure` | プラグインディレクトリに JAR がない、SPI ファイルがない、ディレクトリから複数の Factory が公開されている、または依存関係のロードに失敗した。 | ディレクトリと JAR を確認し、SPI ファイルに Factory クラス名が一つだけ記載されていること、および例外の `stage` と `message` を確認します。 |
| `Skip lineage plugin not in activate_lineage_plugin` | Factory は検出されたが、その `name()` が有効化リストに含まれていない。 | Factory 名を `activate_lineage_plugin` と比較します。名前では大文字と小文字が区別されます。 |
| `Failed to create/initialize lineage plugin` | `create(context)` または `initialize(context)` が例外をスローした。 | スタックトレース、初期化ロジック、設定ファイル、ディレクトリの権限を確認します。 |
| `the lineage event queue is full` | イベントの生成速度がプラグインの処理速度を上回り、現在の FE のキューが満杯になった。 | まず `exec()` の処理時間を短縮し、送信先でのブロックを調査します。そのうえで `lineage_event_queue_size` を増やすか検討します。 |

### プラグインの無効化とロールバック

プラグインを無効にするには、該当する FE を停止し、プラグインディレクトリを `plugin_dir/lineage/` の外に移動し、`example-lineage` を `activate_lineage_plugin` から削除してから FE を起動します。JAR をそのまま残して `activate_lineage_plugin` を空にするだけでは無効になりません。空のリストは、検出されたすべてのリネージプラグインを有効にするためです。

```shell
mkdir -p "${FE_HOME}/plugins-disabled"
mv "${FE_HOME}/plugins/lineage/example-lineage" \
  "${FE_HOME}/plugins-disabled/"
```

FE の起動後、新しい `Loaded lineage plugin: example-lineage` エントリが出力されないことを確認します。プラグインを復元するには、ディレクトリを `${FE_HOME}/plugins/lineage/` の下に戻し、`activate_lineage_plugin` の設定を復元して、FE を再び再起動します。

リネージの配送はベストエフォートであり、DML と同一のトランザクションではありません。DML が成功しても、外部のガバナンスシステムへの配送は保証されません。クエリ ID と書き込み先テーブルを使用して、送信先での冪等なイベント識別子を構成してください。
