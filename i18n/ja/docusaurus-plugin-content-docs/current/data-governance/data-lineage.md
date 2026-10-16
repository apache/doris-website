---
{
    "title": "データリネージ技術ガイド",
    "sidebar_label": "データリネージ",
    "language": "ja",
    "description": "外部の LineagePlugin を通じて、対応する Doris DML 文からテーブルレベルおよびカラムレベルのリネージを収集します。",
    "keywords": ["Apache Doris", "データリネージ", "データガバナンス", "LineagePlugin", "カラムレベルのリネージ"]
}
---

<!-- Knowledge type: Feature overview + technical design + user guide -->
<!-- Use cases: Data governance integration / impact analysis / compliance traceability -->

データリネージは、対応する Doris DML 文からテーブルレベルおよびカラムレベルの依存関係を抽出し、`LineagePlugin` を通じて外部のガバナンスシステムに送信します。Doris はリネージの生成元です。イベントの保持、リネージ照会 API の提供、リネージの可視化は行いません。

> この機能は Dev バージョンで利用できます。Apache Doris 4.0.6 で初めてリリースされました。

## 機能と制限

フレームワークは、次のいずれかの文が成功した後にのみイベントを生成します。

| 対応する文 | イベントの動作 |
| --- | --- |
| `INSERT INTO ... SELECT` | Insert が成功した後にイベントを一件生成します。 |
| `INSERT OVERWRITE TABLE ... SELECT` | Overwrite が成功した後にイベントを一件生成します。 |
| `CREATE TABLE AS SELECT` | 内部の Insert が成功した後にイベントを一件生成します。 |

現在の実装では、`SELECT`、`UPDATE`、`DELETE`、ロードジョブ、`VALUES` のみを使用する Insert、または書き込み先が `__internal_schema` の書き込みについて、イベントを生成しません。一部の `UPDATE` と `DELETE` の実行経路では内部的に Insert コマンドを再利用しますが、元のコマンド種別のチェックにより、リネージイベントの送信対象から除外されます。

:::caution 配信保証

リネージの配信は非同期で、ベストエフォート方式です。イベントの収集やプラグインへの配信が失敗しても、成功した DML 文はロールバックされません。キューが満杯の場合、イベントは破棄されることがあります。Doris はイベントの再試行も永続化も行いません。

:::

## 技術設計

### 収集フロー

対応する文について、Doris は `afterAnalyze` プランナーフックで解析済みの Nereids 論理プランを記録します。DML が成功すると、そのプランからリネージを抽出し、FE ごとのローカルキューにイベントを送信します。単一のデーモンワーカーが読み込まれた各プラグインを評価し、`eventFilter()` が `true` を返した各プラグインにイベントを配信します。

![データリネージの収集アーキテクチャ。成功した対応 DML 文を Nereids が解析し、LineageInfo に抽出して FE のキューに入れ、プラグインが外部ガバナンスシステムへ配信します。](/images/data-lineage/lineage-architecture.svg)

抽出前に、Doris は読み込まれたプラグインの `eventFilter()` を呼び出します。イベントを受け取るプラグインがなければ、抽出をスキップします。ワーカーは配信前に `eventFilter()` を再度評価します。

### リネージの内容

各 `LineageInfo` イベントには、テーブルリネージ、直接的なカラムリネージ、二種類の間接リネージ、およびクエリのコンテキストが含まれます。以下の SQL 例では、後続のセクションで使用するソーステーブル、ターゲットテーブル、結果を用意します。

#### SQL の例と結果

現在のユーザーには、データベースとテーブルの作成、データの書き込み、およびデータの照会に必要な権限が必要です。また、FE にリネージプラグインが読み込まれている必要があります。この例では、二つのソーステーブルを使用し、CTE、Join、フィルター、集計、ウィンドウ関数、条件式、並べ替えを使って顧客の集計テーブルを作成します。

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

クエリの結果は次のとおりです。

```text
+-------------+--------------+--------------+--------------+--------------+
| customer_id | region_label | total_amount | customer_seq | region_group |
+-------------+--------------+--------------+--------------+--------------+
|           1 | EAST         |       150.00 |            1 | CORE         |
|           2 | WEST         |        80.00 |            2 | OTHER        |
+-------------+--------------+--------------+--------------+--------------+
```

`VALUES` のみを使用する二つの Insert は、リネージイベントを生成しません。`INSERT INTO lineage_customer_summary ... SELECT` 文は `LineageInfo` イベントを一件生成します。その内容を以下で説明します。

#### テーブルリネージ

テーブルリネージは、一つのターゲットテーブルと、解析済み論理プランがスキャンするすべてのソーステーブルを記録します。`lineage_customer_summary` に書き込むクエリは、`lineage_orders` と `lineage_customers` の両方をスキャンするため、両ソーステーブルとターゲットとの間にテーブルレベルの関係があります。CTE は基になるテーブルに解決され、`UNION` の各分岐がソーステーブルの集合に加わります。

この例では、次のテーブルリネージが生成されます。

| ソーステーブル | ターゲットテーブル |
| --- | --- |
| `lineage_orders` | `lineage_customer_summary` |
| `lineage_customers` | `lineage_customer_summary` |

#### 直接的なカラムリネージ

直接的なカラムリネージは、各ターゲットカラムの値を生成するソース式を示します。エイリアスと CTE を解決した後、Doris は次の順序で式を分類します。集約関数を含む式は `AGGREGATION`、ソースカラムへの単純な参照は `IDENTITY`、その他の式はすべて `TRANSFORMATION` です。

| 種別 | 意味 | 例 |
| --- | --- | --- |
| `IDENTITY` | 関数や演算を介さず、ソースカラムからターゲットの値を直接取得します。 | `lineage_customer_summary.customer_id` は `lineage_orders.customer_id` から直接取得されます。 |
| `TRANSFORMATION` | 算術演算、文字列関数、ウィンドウ関数、条件式など、集約以外の式がターゲットの値を変換します。 | `region_label` は `UPPER(lineage_orders.region)` から、`customer_seq` は `ROW_NUMBER()` から得られます。 |
| `AGGREGATION` | 集約関数を含む式がターゲットの値を生成します。別の式で集約を包んでいる場合もこの種別のままです。 | `total_amount` は `SUM(lineage_orders.amount)` から得られます。 |

この例では、次の直接的なカラムリネージが生成されます。

| ターゲットカラム | ソース式 | 種別 |
| --- | --- | --- |
| `lineage_customer_summary.customer_id` | `lineage_orders.customer_id` | `IDENTITY` |
| `lineage_customer_summary.region_label` | `UPPER(lineage_orders.region)` | `TRANSFORMATION` |
| `lineage_customer_summary.total_amount` | `SUM(lineage_orders.amount)` | `AGGREGATION` |
| `lineage_customer_summary.customer_seq` | `ROW_NUMBER() OVER (ORDER BY lineage_orders.customer_id)` | `TRANSFORMATION` |
| `lineage_customer_summary.region_group` | `CASE WHEN UPPER(lineage_orders.region) = 'EAST' ... END` | `TRANSFORMATION` |

#### データセットの間接リネージ

データセットの間接リネージは、ターゲットカラムの値を直接生成せずに結果セット全体に影響する式を記録します。これらの依存関係はイベントレベルのマップに格納され、必要に応じてすべてのターゲット出力カラムに適用できます。

| 種別 | 意味 | 例 |
| --- | --- | --- |
| `JOIN` | Join 条件は、どのソース行を結合できるかを決めます。 | `lineage_orders.customer_id = lineage_customers.customer_id`。 |
| `FILTER` | `WHERE` または `HAVING` の条件は、どの行またはグループが結果に入るかを決めます。 | `status = 'PAID'`、`customer_level = 'VIP'`、`HAVING SUM(amount) >= 50`。 |
| `GROUP_BY` | グループ化式は、集約結果の粒度を決めます。 | `customer_id` と `UPPER(region)` でグループ化します。 |
| `SORT` | `ORDER BY` または TopN 式は、結果の順序を決めます。 | `total_amount DESC` で並べ替えます。これは `SUM(amount)` に解決されます。 |

この例では、次のデータセットの間接リネージが生成されます。

| 種別 | イベント内のソース式の例 | 影響 |
| --- | --- | --- |
| `JOIN` | `lineage_orders.customer_id = lineage_customers.customer_id` | 注文と顧客の照合方法を決めます。 |
| `FILTER` | `status = 'PAID'`、`customer_level = 'VIP'`、`SUM(amount) >= 50` | `WHERE` と `HAVING` の述語が、結果に入る行とグループを共同で決めます。 |
| `GROUP_BY` | `lineage_orders.customer_id` と `UPPER(lineage_orders.region)` | 顧客と地域ごとの集約粒度を決めます。 |
| `SORT` | `total_amount DESC`。`SUM(lineage_orders.amount)` に解決されます。 | Insert クエリの結果の順序を決めます。 |

#### 出力の間接リネージ

出力の間接リネージは、影響を受けるターゲットカラムにのみ関連付けられ、他の出力カラムには適用されません。

| 種別 | 意味 | 例 |
| --- | --- | --- |
| `WINDOW` | ウィンドウ関数の `PARTITION BY` と `ORDER BY` の入力が、その出力カラムに影響します。 | `customer_seq` は `ROW_NUMBER() OVER (ORDER BY customer_id)` で生成され、その `WINDOW` 依存関係は `customer_id` です。 |
| `CONDITIONAL` | `CASE` または `IF` の条件、あるいは `COALESCE` の候補式が、その出力カラムに影響します。 | `region_group` は `CASE WHEN region_label = 'EAST' ...` によって決まり、その `CONDITIONAL` 依存関係はこの述語です。 |

ウィンドウ式や条件式そのものは、直接的なカラムリネージにも現れます。たとえば、`customer_seq` の直接的な種別は `TRANSFORMATION` であり、さらに `WINDOW` の間接リネージも持ちます。`region_group` の直接的な種別も `TRANSFORMATION` であり、さらに `CONDITIONAL` の間接リネージも持ちます。

この例では、次の出力の間接リネージが生成されます。

| ターゲットカラム | 種別 | イベント内のソース式 | 影響 |
| --- | --- | --- | --- |
| `customer_seq` | `WINDOW` | `lineage_orders.customer_id` | `ROW_NUMBER()` のウィンドウ内の並べ替え入力となり、`customer_seq` にのみ影響します。 |
| `region_group` | `CONDITIONAL` | `UPPER(lineage_orders.region) = 'EAST'` | `CASE WHEN` 条件となり、`region_group` にのみ影響します。 |

他の三つのターゲットカラムには、出力の間接リネージはありません。データセットレベルの `JOIN`、`FILTER`、`GROUP_BY`、`SORT` の依存関係は、引き続き結果セット全体に影響します。

#### クエリのコンテキスト

クエリのコンテキストは、誰が、どのセッションで、どの DML 文を通じてリネージイベントを生成したかを示します。

| フィールド | 例または意味 |
| --- | --- |
| ソースコマンド | `InsertIntoTableCommand`。イベントが Insert から来たことを示します。 |
| クエリ ID と元の SQL | クエリ ID と、`INSERT INTO lineage_customer_summary ...` の完全なテキスト。 |
| ユーザーとクライアント IP | たとえば、`lineage_user` と `192.0.2.10`。 |
| セッションのデータベースとカタログ | この例では `lineage_demo` と `internal`。セッションのコンテキストを示し、必ずしもターゲットテーブルの場所を特定するものではありません。 |
| 実行状態 | DML 文が成功すると、通常は `OK` が記録されます。 |
| タイムスタンプと所要時間 | イベント作成時刻と、クエリ開始からイベント作成までのミリ秒数。取得できない場合、値は `-1` です。 |
| 外部カタログのプロパティ | クエリが参照する外部カタログの機密情報以外のプロパティ。パスワード、キー、非表示のプロパティは除去されます。`internal` カタログのみを使用する場合、マップは空です。 |

この例では、元の SQL は上記の複雑な Insert、ソースコマンドは `InsertIntoTableCommand`、セッションのデータベースは `lineage_demo`、セッションのカタログは `internal`、成功状態は `OK` です。クエリ ID、ユーザー、クライアント IP、タイムスタンプ、所要時間には実際の実行コンテキストの値が使用されます。この例では Internal Catalog のみを使用するため、外部カタログのプロパティマップは空です。

プラグインの送信先システムでイベントの受信を確認してください。初回デプロイ時には、`fe.log` で `Loaded lineage plugin`、プラグイン固有のエラー、キュー満杯の警告も確認してください。

![LineageInfo イベントモデル。ターゲットテーブルとソーステーブルから直接・間接リネージを導き、クエリのコンテキストと組み合わせてから、プラグインが送信先システム向けのイベントに変換します。](/images/data-lineage/lineage-event-model.svg)

抽出器は、イベントの配信前に CTE の生成元の式を解決し、`UNION` の分岐を展開します。送信先プラグインは、`TableIf`、`SlotReference`、`Expression` などの Doris の Java オブジェクトを、安定した識別子または独自のイベントスキーマに変換する必要があります。

### イベント処理の動作

`lineage_event_queue_size` は、各 FE のローカルキューで待機できるリネージイベントの最大数を設定します。バイト数ではなくイベント数を数えます。キューが満杯の場合、新しいイベントは破棄され、DML は通常どおり続行します。ワーカーはプラグインを順番に呼び出すため、遅いプラグインは後続のイベントを遅らせ、負荷が継続するとイベントの破棄につながることがあります。プラグインがスローした例外はログに記録されますが、ワーカーを停止させず、DML にも影響しません。

プラグインの検出と初期化は FE の起動時にのみ行われます。動的な再読み込みとアンロードはサポートされていません。

## 設定と使用方法

### 前提条件

1. 外部リネージプラグインを用意します。Doris には組み込みの送信先は付属しません。SPI 契約、JAR のパッケージ化、完全な最小構成のプラグインについては、[データリネージプラグインの開発](/community/developer-guide/data-lineage-plugin-development)を参照してください。
2. プラグインの JAR と、必要なサードパーティー依存 JAR をすべての FE にコピーします。
3. プラグインが外部のガバナンスサービスにイベントを送信する場合は、DML を実行できるすべての FE からそのサービスに接続できることを確認します。

### プラグインのデプロイ

`FE_HOME` は、`bin/`、`conf/`、`lib/` を含む単一の FE インストールディレクトリを表します。すべての FE で次の配置を使用してください。ローダーは `lineage/` 直下のディレクトリのみをスキャンし、各プラグインディレクトリとその `lib/` ディレクトリ内の JAR を読み込みます。

```text
$FE_HOME/plugins/
└── lineage/
    └── example-lineage/
        ├── example-lineage.jar
        └── lib/
            └── downstream-client.jar
```

すべての FE で `fe.conf` を設定します。`example-lineage` をプラグインファクトリの `name()` メソッドが返す値に置き換えてください。

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| 設定項目 | 型とデフォルト値 | 必須かどうか | 説明 |
| --- | --- | --- | --- |
| `plugin_dir` | 文字列。`$FE_HOME/plugins` | いいえ | プラグインのルートディレクトリ。リネージローダーはその配下の `lineage/` 直下のディレクトリをスキャンします。デフォルトのディレクトリを使用する場合は、この設定を省略します。 |
| `activate_lineage_plugin` | 文字列配列。空 | 明示的な設定を推奨 | インスタンス化する Factory 名をカンマで区切って指定します。値が空の場合、名前によるフィルタリングは無効になり、検出されたすべての Factory がインスタンス化されます。 |
| `lineage_event_queue_size` | 正の整数。`50000` | いいえ | 現在の FE で待機できるリネージイベントの最大数。キューが満杯の場合、新しいイベントは破棄されます。 |

三つの設定はいずれも、各 FE の `$FE_HOME/conf/fe.conf` で指定し、その FE プロセスにのみ適用されます。設定は FE の起動時にのみ読み込まれるため、変更後は該当する FE を再起動してください。

#### プラグインの有効化

`activate_lineage_plugin` をすべての FE の `$FE_HOME/conf/fe.conf` で設定します。この設定は、検出された Factory のうち、どれをインスタンス化するかを制御します。JAR の検出やキュー容量は制御しません。各名前は大文字と小文字が区別され、`LineagePluginFactory.name()` と完全に一致する必要があります。`LineagePlugin.name()` の実装も同じ名前を返すことが推奨されます。プラグインディレクトリ名は照合に使用されません。複数のプラグイン名はカンマで区切ります。FE の設定パーサーは、カンマで区切られた各項目の前後の空白を除去しますが、名前の照合では引き続き大文字と小文字が区別されます。

```text
activate_lineage_plugin = example-lineage,governance-lineage
```

FE は起動時に組み込みおよび外部の Factory を検出し、設定された名前のインスタンスのみを作成します。各 FE は自身の設定を読み込むため、DML を実行できるすべての FE で同じプラグインセットを使用する必要があります。変更後は FE を再起動してください。この設定は `ADMIN SET FRONTEND CONFIG` で動的に変更できません。

:::caution 空の値の動作

現在の実装では、`activate_lineage_plugin` の値を空にしても、リネージプラグインは無効になりません。名前によるフィルタリングがスキップされ、検出されたすべての Factory がインスタンス化されます。有効にするプラグインを明示的に列挙し、無効化するために空の値を使用しないでください。プラグインの読み込み後も、`eventFilter()` が抽出前と配信前にイベントを受け取るかどうかを決めます。

:::

#### イベントキューの設定

`lineage_event_queue_size` をすべての FE の `$FE_HOME/conf/fe.conf` で設定します。正の整数を指定する必要があります。DML を実行できる各 FE は独立したキューを持つため、それぞれ個別に設定する必要があります。

これは FE 起動時に読み込まれる設定であり、`ADMIN SET FRONTEND CONFIG` で動的に変更できません。変更後は該当する FE を再起動してください。値を増やすと、待機できるイベントの数と FE のメモリ使用量が増えます。コンシューマースレッドの追加やプラグインの処理スループットの向上にはつながりません。イベントが欠落している場合は、まず `fe.log` で `the lineage event queue is full` を検索し、プラグインの `exec()` メソッドのレイテンシーを減らしてください。その後、ピーク時の滞留量と利用可能な FE メモリに応じてキュー容量を設定します。

その他のプラグイン設定の変更やプラグイン JAR の置き換え後も、すべての FE を再起動してください。プラグインの設定とディレクトリは FE の起動時にのみ読み込まれます。

## 運用とトラブルシューティング

### 書き込み後にイベントが発生しない

一般的な原因として、非対応の文、失敗した DML 文、現在の FE にプラグインが読み込まれていないこと、`eventFilter()` が `false` を返すことなどがあります。

次の順序で確認してください。

1. 文が成功した `INSERT INTO ... SELECT`、`INSERT OVERWRITE TABLE ... SELECT`、または `CREATE TABLE AS SELECT` であることを確認します。`VALUES` のみを使用する Insert はイベントを生成しません。
2. DML を実行した FE にプラグインが設定され、読み込まれていることを確認します。`fe.log` で `Loaded lineage plugin` を検索してください。
3. プラグインの `eventFilter()` がクエリスレッドとワーカースレッドの両方で `true` を返すことを確認します。
4. プラグインのログと送信先サービスを確認し、FE の外部で処理が失敗していないことを確かめます。

### プラグインが読み込まれない

プラグインディレクトリに JAR があり、その JAR に `META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory` が含まれていることを確認します。各プラグインディレクトリが公開できる Factory は一つだけです。Factory 名は全体で一意であり、`activate_lineage_plugin` と一致する必要があります。ディレクトリ、JAR、または設定を修正した後は、該当する FE を再起動してください。

### 高負荷時にイベントが欠落する

`fe.log` で `the lineage event queue is full` とプラグインの例外を検索します。キューが満杯の場合は、まず `exec()` 内の同期的なブロック処理を減らし、送信先への配信に上限付きの再試行と冪等性を持たせてください。その後、`lineage_event_queue_size` を増やすべきかを検討します。イベントのサイズは SQL 文によって異なるため、増やす前に FE メモリを考慮してください。

DML を実行できるすべての FE で、同じプラグインと設定が使用されていることも確認します。各 FE は独立したローカルキューを使用し、プラグインとキューの状態は FE 間で同期されません。

### プラグインの更新が反映されない

プラグインディレクトリは FE の起動時にのみスキャンされます。動的な再読み込みとアンロードはサポートされていません。プラグイン JAR、依存関係、設定を置き換えた後は、関係するすべての FE を再起動し、`Loaded lineage plugin` を再確認してください。

クエリ ID とターゲットテーブルを使用して、送信先のイベント識別子を構成してください。これにより、プラグインがフレームワーク外で再試行を実装する場合でも、ガバナンスシステムでイベントを重複排除できます。

## 関連資料

- [データリネージプラグインの開発](/community/developer-guide/data-lineage-plugin-development)
