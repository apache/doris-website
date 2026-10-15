---
{
    "title": "データリネージ技術ガイド (4.x)",
    "sidebar_label": "データリネージ",
    "language": "ja",
    "description": "サポート対象の Doris DML 文からテーブル単位およびカラム単位のリネージを抽出し、外部の LineagePlugin を通じて送信します。",
    "keywords": ["Apache Doris", "データリネージ", "データガバナンス", "LineagePlugin", "カラム単位のリネージ"]
}
---

<!-- Knowledge type: Feature overview + technical design + user guide -->
<!-- Use cases: Data governance integration / impact analysis / compliance traceability -->

データリネージは、サポート対象の Doris DML 文からテーブル単位およびカラム単位の依存関係を抽出し、`LineagePlugin` を通じて外部のガバナンスシステムに送信します。Doris はリネージの生成側です。イベントを保持したり、リネージを照会する API や可視化機能を提供したりはしません。

> この機能は、Apache Doris 4.0.6 以降の 4.x 系で利用できます。

## 機能と制限

次のいずれかの文が成功した場合にのみ、フレームワークはイベントを生成します。

| サポート対象の文 | イベントの生成 |
| --- | --- |
| `INSERT INTO ... SELECT` | 挿入の成功後にイベントを一件生成します。 |
| `INSERT OVERWRITE TABLE ... SELECT` | 上書きの成功後にイベントを一件生成します。 |
| `CREATE TABLE AS SELECT` | 内部の挿入の成功後にイベントを一件生成します。 |

現在の実装では、`SELECT`、`UPDATE`、`DELETE`、ロードジョブ、`VALUES` のみを使用する挿入、および書き込み先が `__internal_schema` である操作ではイベントを生成しません。`UPDATE` と `DELETE` の一部の実行経路では内部的に Insert コマンドを再利用しますが、元のコマンド種別のチェックによって、リネージイベントの送信対象から除外されます。

:::caution 配信保証

リネージの配信は非同期のベストエフォート方式です。イベントの収集やプラグインへの配信に失敗しても、成功した DML 文はロールバックされません。キューが満杯になるとイベントが破棄されることがあり、Doris は再試行も永続化もしません。

:::

## 技術設計

### 収集の流れ

サポート対象の文では、Doris は `afterAnalyze` プランナーフックで解析済みの Nereids 論理プランを記録します。DML の成功後、そのプランからリネージを抽出し、イベントを FE ローカルのキューに投入します。単一のデーモンワーカーがロード済みの各プラグインを評価し、`eventFilter()` が `true` を返すプラグインにイベントを送信します。

![データリネージの収集アーキテクチャ: 成功したサポート対象の DML 文を Nereids で解析し、LineageInfo に抽出して FE のキューに入れ、プラグインを通じて外部のガバナンスシステムに配信します。](/images/data-lineage/lineage-architecture.svg)

抽出前に、Doris はロード済みのプラグインに対して `eventFilter()` を呼び出します。イベントを受け取るプラグインがなければ、抽出をスキップします。ワーカーは送信前にも `eventFilter()` を評価します。

### リネージの内容

各 `LineageInfo` イベントには、テーブルリネージ、直接カラムリネージ、二種類の間接リネージ、クエリコンテキストが含まれます。以下の完全な SQL 例で、以降の各節で使用する参照元テーブル、書き込み先テーブル、結果を示します。

#### SQL の例と結果

現在のユーザーには、データベースとテーブルの作成、データの書き込みと照会に必要な権限が必要です。また、FE がリネージプラグインをロードしている必要があります。この例では、二つの参照元テーブルを使用し、CTE、Join、フィルター、集約、ウィンドウ関数、条件式、並べ替えを通じて顧客の集計テーブルを作成します。

```sql
CREATE DATABASE IF NOT EXISTS lineage_demo;
USE lineage_demo;

CREATE TABLE lineage_orders (
    order_id BIGINT,
    customer_id BIGINT,
    region VARCHAR(16),
    amount DECIMAL(18, 2),
    status VARCHAR(16)
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_customers (
    customer_id BIGINT,
    customer_name VARCHAR(64),
    customer_level VARCHAR(16)
)
DUPLICATE KEY(customer_id)
DISTRIBUTED BY HASH(customer_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_customer_summary (
    customer_id BIGINT,
    region_label VARCHAR(16),
    total_amount DECIMAL(18, 2),
    customer_seq BIGINT,
    region_group VARCHAR(16)
)
DUPLICATE KEY(customer_id)
DISTRIBUTED BY HASH(customer_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO lineage_customers VALUES
    (1, 'Alice', 'VIP'),
    (2, 'Bob', 'VIP'),
    (3, 'Carol', 'REGULAR');

INSERT INTO lineage_orders VALUES
    (101, 1, 'east', 100.00, 'PAID'),
    (102, 1, 'east',  50.00, 'PAID'),
    (103, 2, 'west',  80.00, 'PAID'),
    (104, 2, 'west',  30.00, 'CANCELLED'),
    (105, 3, 'north', 200.00, 'PAID');

INSERT INTO lineage_customer_summary
WITH customer_totals AS (
    SELECT
        o.customer_id,
        UPPER(o.region) AS region_label,
        SUM(o.amount) AS total_amount
    FROM lineage_orders o
    JOIN lineage_customers c
        ON o.customer_id = c.customer_id
    WHERE o.status = 'PAID'
      AND c.customer_level = 'VIP'
    GROUP BY o.customer_id, UPPER(o.region)
    HAVING SUM(o.amount) >= 50
)
SELECT
    customer_id,
    region_label,
    total_amount,
    ROW_NUMBER() OVER (ORDER BY customer_id) AS customer_seq,
    CASE
        WHEN region_label = 'EAST' THEN 'CORE'
        ELSE 'OTHER'
    END AS region_group
FROM customer_totals
ORDER BY total_amount DESC;

SELECT customer_id, region_label, total_amount, customer_seq, region_group
FROM lineage_customer_summary
ORDER BY customer_id;
```

クエリは次の結果を返します。

```text
+-------------+--------------+--------------+--------------+--------------+
| customer_id | region_label | total_amount | customer_seq | region_group |
+-------------+--------------+--------------+--------------+--------------+
|           1 | EAST         |       150.00 |            1 | CORE         |
|           2 | WEST         |        80.00 |            2 | OTHER        |
+-------------+--------------+--------------+--------------+--------------+
```

`VALUES` のみを使用する二つの挿入では、リネージイベントは生成されません。`INSERT INTO lineage_customer_summary ... SELECT` 文では `LineageInfo` イベントが一件生成されます。その内容を以下で説明します。

#### テーブルリネージ

テーブルリネージは、一つの書き込み先テーブルと、解析済み論理プランがスキャンするすべての参照元テーブルを記録します。`lineage_customer_summary` に書き込むクエリは `lineage_orders` と `lineage_customers` の両方をスキャンするため、両テーブルとも書き込み先とテーブル単位の関係を持ちます。CTE はその基になるテーブルに解決され、`UNION` の各分岐は参照元テーブルの集合に含まれます。

この例では、次のテーブルリネージが生成されます。

| 参照元テーブル | 書き込み先テーブル |
| --- | --- |
| `lineage_orders` | `lineage_customer_summary` |
| `lineage_customers` | `lineage_customer_summary` |

#### 直接カラムリネージ

直接カラムリネージは、各書き込み先カラムの値を生成する参照元の式を示します。Doris はエイリアスと CTE を解決した後、次の順序で式を分類します。集約関数を含む式は `AGGREGATION`、参照元カラムをそのまま参照する式は `IDENTITY`、その他の式は `TRANSFORMATION` です。

| 種類 | 意味 | 例 |
| --- | --- | --- |
| `IDENTITY` | 関数や演算を使わず、参照元カラムから書き込み先の値を直接取得します。 | `lineage_customer_summary.customer_id` は `lineage_orders.customer_id` から直接取得します。 |
| `TRANSFORMATION` | 算術演算、文字列関数、ウィンドウ関数、条件式など、集約を含まない式が書き込み先の値を変換します。 | `region_label` は `UPPER(lineage_orders.region)`、`customer_seq` は `ROW_NUMBER()` から生成されます。 |
| `AGGREGATION` | 集約関数を含む式が書き込み先の値を生成します。別の式が集約関数を包んでいても、この種類になります。 | `total_amount` は `SUM(lineage_orders.amount)` から生成されます。 |

この例では、次の直接カラムリネージが生成されます。

| 書き込み先カラム | 参照元の式 | 種類 |
| --- | --- | --- |
| `lineage_customer_summary.customer_id` | `lineage_orders.customer_id` | `IDENTITY` |
| `lineage_customer_summary.region_label` | `UPPER(lineage_orders.region)` | `TRANSFORMATION` |
| `lineage_customer_summary.total_amount` | `SUM(lineage_orders.amount)` | `AGGREGATION` |
| `lineage_customer_summary.customer_seq` | `ROW_NUMBER() OVER (ORDER BY lineage_orders.customer_id)` | `TRANSFORMATION` |
| `lineage_customer_summary.region_group` | `CASE WHEN UPPER(lineage_orders.region) = 'EAST' ... END` | `TRANSFORMATION` |

#### データセット単位の間接リネージ

データセット単位の間接リネージは、書き込み先カラムの値を直接生成せずに、結果セット全体に影響する式を記録します。これらの依存関係はイベント単位のマップに格納され、必要に応じてすべての書き込み先カラムに適用できます。

| 種類 | 意味 | 例 |
| --- | --- | --- |
| `JOIN` | 結合条件は、どの参照元行を結合できるかを決めます。 | `lineage_orders.customer_id = lineage_customers.customer_id`。 |
| `FILTER` | `WHERE` または `HAVING` 条件は、どの行やグループが結果に含まれるかを決めます。 | `status = 'PAID'`、`customer_level = 'VIP'`、`HAVING SUM(amount) >= 50`。 |
| `GROUP_BY` | グループ化の式は、集約結果の粒度を決めます。 | `customer_id` と `UPPER(region)` でグループ化します。 |
| `SORT` | `ORDER BY` または TopN の式は、結果の順序を決めます。 | `total_amount DESC` で並べ替えます。これは `SUM(amount)` に解決されます。 |

この例では、次のデータセット単位の間接リネージが生成されます。

| 種類 | イベント内の参照元の式の例 | 効果 |
| --- | --- | --- |
| `JOIN` | `lineage_orders.customer_id = lineage_customers.customer_id` | 注文と顧客の対応付け方を決めます。 |
| `FILTER` | `status = 'PAID'`、`customer_level = 'VIP'`、`SUM(amount) >= 50` | `WHERE` と `HAVING` の述語がともに、どの行やグループが結果に含まれるかを決めます。 |
| `GROUP_BY` | `lineage_orders.customer_id` と `UPPER(lineage_orders.region)` | 顧客と地域ごとの集約粒度を決めます。 |
| `SORT` | `total_amount DESC`。`SUM(lineage_orders.amount)` に解決されます。 | 挿入クエリの結果の順序を決めます。 |

#### 出力カラム単位の間接リネージ

出力カラム単位の間接リネージは、影響を受ける書き込み先カラムにのみ紐付き、ほかの出力カラムには適用されません。

| 種類 | 意味 | 例 |
| --- | --- | --- |
| `WINDOW` | ウィンドウ関数の `PARTITION BY` と `ORDER BY` の入力が、その出力カラムに影響します。 | `customer_seq` は `ROW_NUMBER() OVER (ORDER BY customer_id)` によって生成され、その `WINDOW` 依存関係は `customer_id` です。 |
| `CONDITIONAL` | `CASE` または `IF` の条件や、`COALESCE` の候補式が、その出力カラムに影響します。 | `region_group` は `CASE WHEN region_label = 'EAST' ...` によって決まり、その `CONDITIONAL` 依存関係はこの述語です。 |

ウィンドウ式や条件式そのものは、直接カラムリネージにも現れます。たとえば、`customer_seq` の直接リネージの種類は `TRANSFORMATION` であり、さらに `WINDOW` の間接リネージもあります。`region_group` の直接リネージの種類も `TRANSFORMATION` であり、さらに `CONDITIONAL` の間接リネージもあります。

この例では、次の出力カラム単位の間接リネージが生成されます。

| 書き込み先カラム | 種類 | イベント内の参照元の式 | 効果 |
| --- | --- | --- | --- |
| `customer_seq` | `WINDOW` | `lineage_orders.customer_id` | `ROW_NUMBER()` のウィンドウ内での並べ替えの入力となり、`customer_seq` のみに影響します。 |
| `region_group` | `CONDITIONAL` | `UPPER(lineage_orders.region) = 'EAST'` | `CASE WHEN` の条件となり、`region_group` のみに影響します。 |

ほかの三つの書き込み先カラムには、出力カラム単位の間接リネージはありません。データセット単位の `JOIN`、`FILTER`、`GROUP_BY`、`SORT` の依存関係は、引き続き結果セット全体に影響します。

#### クエリコンテキスト

クエリコンテキストは、誰が、どのセッションで、どの DML 文を通じてリネージイベントを生成したかを示します。

| フィールド | 例または意味 |
| --- | --- |
| 元のコマンド | `InsertIntoTableCommand`。イベントが挿入から生成されたことを示します。 |
| クエリ ID と元の SQL | クエリ ID と、`INSERT INTO lineage_customer_summary ...` の完全なテキスト。 |
| ユーザーとクライアント IP | たとえば `lineage_user` と `192.0.2.10`。 |
| セッションのデータベースとカタログ | この例では `lineage_demo` と `internal`。セッションのコンテキストを表し、書き込み先テーブルの場所を必ずしも示すものではありません。 |
| 実行状態 | 成功した DML 文では通常 `OK` が記録されます。 |
| タイムスタンプと所要時間 | イベント作成時刻と、クエリ開始からイベント作成までのミリ秒数。取得できない場合は `-1` です。 |
| 外部カタログのプロパティ | クエリが参照した外部カタログの機密でないプロパティ。パスワード、キー、非表示のプロパティは除外されます。`internal` カタログのみを使用した場合、マップは空です。 |

この例では、元の SQL は上記の複雑な挿入文で、元のコマンドは `InsertIntoTableCommand`、セッションのデータベースは `lineage_demo`、セッションのカタログは `internal`、成功時の状態は `OK` です。クエリ ID、ユーザー、クライアント IP、タイムスタンプ、所要時間には、実際の実行コンテキストの値が使用されます。この例では Internal Catalog のみを使用するため、外部カタログのプロパティのマップは空です。

プラグインの送信先システムで、イベントを受信したことを確認してください。初回デプロイ時には、`fe.log` で `Loaded lineage plugin`、プラグイン固有のエラー、キュー満杯の警告も確認してください。

![LineageInfo のイベントモデル: 書き込み先テーブルと参照元テーブルから直接リネージと間接リネージを得て、クエリコンテキストと組み合わせ、プラグインが下流システム向けの形式に変換します。](/images/data-lineage/lineage-event-model.svg)

イベントの配信前に、抽出処理は CTE の定義側の式を解決し、`UNION` の各分岐を展開します。下流向けのプラグインは、`TableIf`、`SlotReference`、`Expression` などの Doris の Java オブジェクトを、安定した識別子または独自のイベントスキーマに変換する必要があります。

### イベント処理の動作

`lineage_event_queue_size` は、各 FE ローカルのキューで待機できるリネージイベントの最大数を設定します。単位はバイトではなくイベント件数です。キューが満杯になると新しいイベントは破棄されますが、DML は通常どおり続行します。ワーカーはプラグインを順番に呼び出すため、遅いプラグインは後続イベントの処理を遅らせ、高負荷が続くとイベントの破棄につながる可能性があります。プラグインが投げた例外はログに記録されますが、ワーカーは停止せず、DML にも影響しません。

プラグインの検出と初期化は、FE の起動時にのみ行われます。動的な再読み込みとアンロードには対応していません。

## 設定と使用方法

### 前提条件

1. 外部リネージプラグインを用意します。Doris には組み込みの送信先はありません。SPI の契約、JAR のパッケージ化、完全に動作する最小限のプラグインについては、[データリネージプラグインの開発](/community/developer-guide/data-lineage-plugin-development)を参照してください。
2. プラグインの JAR と、必要なサードパーティーの依存 JAR をすべての FE にコピーします。
3. プラグインが外部のガバナンスサービスにイベントを送信する場合は、DML を実行できるすべての FE からそのサービスに接続できることを確認します。

### プラグインのデプロイ

`FE_HOME` は、`bin/`、`conf/`、`lib/` を含む単一の FE インストールディレクトリを指します。すべての FE で次のディレクトリ構成を使用してください。ローダーがスキャンするのは、`lineage/` 直下の子ディレクトリと、各プラグインディレクトリおよびその `lib/` ディレクトリ内の JAR のみです。

```text
$FE_HOME/plugins/
└── lineage/
    └── example-lineage/
        ├── example-lineage.jar
        └── lib/
            └── downstream-client.jar
```

すべての FE の `fe.conf` を設定します。`example-lineage` はプラグインファクトリーの `name()` メソッドが返す値に置き換えてください。

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| 設定項目 | 型とデフォルト値 | 必須か | 説明 |
| --- | --- | --- | --- |
| `plugin_dir` | 文字列。`$FE_HOME/plugins` | いいえ | プラグインのルートディレクトリ。リネージローダーは、その `lineage/` 直下の子ディレクトリをスキャンします。デフォルトのディレクトリを使用する場合、この設定は省略できます。 |
| `activate_lineage_plugin` | 文字列の配列。空 | 明示的な設定を推奨 | インスタンス化するファクトリー名をカンマで区切って指定します。空の場合は名前によるフィルタリングが無効になり、検出されたすべてのファクトリーがインスタンス化されます。 |
| `lineage_event_queue_size` | 正の整数。`50000` | いいえ | 現在の FE で待機できるリネージイベントの最大数。キューが満杯になると新しいイベントは破棄されます。 |

三つの設定項目は、各 FE の `$FE_HOME/conf/fe.conf` で設定し、その FE プロセスにのみ適用されます。設定は FE の起動時にのみ読み込まれるため、変更後は該当する FE を再起動してください。

#### プラグインの有効化

`activate_lineage_plugin` を、すべての FE の `$FE_HOME/conf/fe.conf` に設定します。この設定は、検出されたファクトリーのうち、どれをインスタンス化するかを制御します。JAR の検出やキュー容量は制御しません。各名前では大文字と小文字が区別され、`LineagePluginFactory.name()` と完全に一致する必要があります。`LineagePlugin.name()` の実装も同じ名前を返すようにしてください。プラグインディレクトリの名前は照合に使用されません。複数のプラグイン名はカンマで区切ります。FE の設定パーサーはカンマで区切られた各項目の前後の空白を除去しますが、名前の照合では引き続き大文字と小文字が区別されます。

```text
activate_lineage_plugin = example-lineage,governance-lineage
```

FE は起動時に組み込みファクトリーと外部ファクトリーを検出し、設定された名前のインスタンスのみを作成します。各 FE は自身の設定を読み込むため、DML を実行できるすべての FE で同じプラグインの組み合わせを使用する必要があります。変更後は FE を再起動してください。この設定は `ADMIN SET FRONTEND CONFIG` で動的に変更できません。

:::caution 空の値の動作

現在の実装では、`activate_lineage_plugin` を空にしてもリネージプラグインは無効になりません。名前によるフィルタリングをスキップし、検出されたすべてのファクトリーをインスタンス化します。有効にするプラグインを明示的に列挙してください。無効化の手段として空の値を使用しないでください。プラグインのロード後も、`eventFilter()` は抽出前と送信前に、そのプラグインがイベントを受け取るかどうかを決定します。

:::

#### イベントキューの設定

`lineage_event_queue_size` を、すべての FE の `$FE_HOME/conf/fe.conf` に設定します。値は正の整数でなければなりません。DML を実行できる FE にはそれぞれ独立したキューがあり、個別に設定する必要があります。

これは FE の起動時に読み込まれる設定で、`ADMIN SET FRONTEND CONFIG` では動的に変更できません。変更後は該当する FE を再起動してください。値を増やすと、待機できるイベント数と FE のメモリ使用量が増えます。コンシューマースレッド数やプラグインの処理スループットは増えません。イベントが見つからない場合は、まず `fe.log` で `the lineage event queue is full` を検索し、プラグインの `exec()` メソッドのレイテンシーを減らしてください。その後、ピーク時の滞留件数と利用可能な FE メモリに応じてキューのサイズを決めます。

その他のプラグイン設定を変更した場合やプラグインの JAR を置き換えた場合も、すべての FE を再起動してください。プラグインの設定とディレクトリは FE の起動時にのみ読み込まれます。

## 運用とトラブルシューティング

### 書き込み後にイベントが生成されない

よくある原因は、サポート対象外の文、失敗した DML 文、現在の FE にプラグインがロードされていないこと、または `eventFilter()` が `false` を返すことです。

次の順番で確認してください。

1. 文が成功した `INSERT INTO ... SELECT`、`INSERT OVERWRITE TABLE ... SELECT`、`CREATE TABLE AS SELECT` のいずれかであることを確認します。`VALUES` のみを使用する挿入ではイベントは生成されません。
2. DML を実行した FE にプラグインが設定され、ロードされていることを確認します。`fe.log` で `Loaded lineage plugin` を検索してください。
3. プラグインの `eventFilter()` が、クエリスレッドとワーカースレッドの両方で `true` を返すことを確認します。
4. プラグインのログと送信先サービスを確認し、FE の外部で処理が失敗していないことを確かめます。

### プラグインがロードされない

プラグインディレクトリに JAR があり、その JAR に `META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory` が含まれていることを確認します。各プラグインディレクトリから公開できるファクトリーは一つだけです。ファクトリー名は全体で一意であり、`activate_lineage_plugin` と一致する必要があります。ディレクトリ、JAR、設定を修正した後は、該当する FE を再起動してください。

### 高負荷時にイベントが欠落する

`fe.log` で `the lineage event queue is full` とプラグインの例外を検索します。キューが満杯の場合は、まず `exec()` 内の同期的なブロックを減らし、送信先への配信に上限付きの再試行を設けて冪等にします。その後、`lineage_event_queue_size` を増やすべきか評価してください。SQL 文によってイベントのサイズが異なるため、値を増やす前に FE のメモリ使用量を考慮します。

DML を実行できるすべての FE に、同じプラグインと設定があることも確認します。各 FE は独立したローカルキューを使用し、プラグインやキューの状態は FE 間で同期されません。

### プラグインの更新が反映されない

プラグインディレクトリは FE の起動時にのみスキャンされます。動的な再読み込みとアンロードには対応していません。プラグインの JAR、依存関係、設定を変更した後は、関連するすべての FE を再起動し、`Loaded lineage plugin` を再度確認してください。

クエリ ID と書き込み先テーブルを使用して、送信先のイベント識別子を構成してください。これにより、プラグインがフレームワーク外で再試行を実装していても、ガバナンスシステムがイベントの重複を排除できます。

## 関連資料

- [データリネージプラグインの開発](/community/developer-guide/data-lineage-plugin-development)
