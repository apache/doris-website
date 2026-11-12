---
{
    "title": "Changelog",
    "language": "ja",
    "description": "Doris の Changelog は行レベルの挿入、更新、削除を記録します。テーブルプロパティ、TTL 保持、自動クリーンアップ、サポートされるテーブルモデル、トラブルシューティングを扱います。",
    "keywords": [
        "Changelog",
        "Doris changelog",
        "行レベル変更ログ",
        "changelog.enable",
        "changelog.need_historical_value",
        "changelog.ttl_seconds",
        "changelog TTL",
        "before image",
        "historical value",
        "commit TSO",
        "__DORIS_CHANGELOG_OP__",
        "__DORIS_COMMIT_TSO_COL__",
        "changelog() テーブル関数",
        "Merge-on-Write 変更レコード",
        "Duplicate Key 変更レコード",
        "light schema change",
        "enable_mow_light_delete",
        "enable_feature_changelog",
        "変更データキャプチャ",
        "Doris CDC",
        "Incremental View Maintenance",
        "IVM",
        "Not allowed to perform current operation on Table With changelog",
        "Only duplicate and mow table model support changelog"
    ]
}
---

<!-- Knowledge type: Feature description + Parameter reference -->
<!-- Use cases: Enabling row-level change recording on a table / Checking whether a table model is supported / Inspecting change records -->

Changelog は Doris 内部テーブルの行レベル変更ログです。有効にすると、書き込み（挿入、更新、削除）によって生じるすべての行レベルの変更が、変更前後の値およびコミットタイムスタンプとともに永続化されます。これは [Table Stream](table-stream)、[Incremental Query](incremental-query)、[Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) のデータソースであり、[Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/incremental-read)（Connector 26.4.0 以降）を通じて Flink から利用することもできます。

変更レコードはデフォルトで一日保持されます。最長の想定消費遅延をカバーするように `changelog.ttl_seconds` を設定してください。変更レコードの有効期限が切れても、ベーステーブルのデータは削除されません。

Changelog はクロスクラスター レプリケーション（CCR）で使用される binlog とは独立しています。独自の `changelog.*` プロパティと独自のスイッチを持ち、1 つのテーブルで両方を有効にすることはできません。[CCR binlog](#ccr-binlog) を参照してください。

:::caution 実験的機能
この機能はバージョン 5.0.0 以降で利用でき、現在は実験的です。FE 設定で `enable_feature_changelog = true` を指定する必要があります。
:::

:::info row binlog からの改称
初期の開発ビルドでは、この機能は「row binlog」と呼ばれ、`"binlog.enable" = "true"` と `"binlog.format" = "ROW"` で有効にしていました。最初のリリース前に changelog へ改称されました。これらのビルドでその方法により作成されたテーブルは、現在は使用できません。テーブルを削除し、`"changelog.enable" = "true"` で再作成してください。
:::

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降。
- FE の `fe.conf` で `enable_feature_changelog = true` を指定する（動的設定ではないため、FE の再起動が必要）。これは changelog を持つテーブル、コミットタイムスタンプ（TSO）の割り当て、Table Stream の消費を制御します。`enable_feature_binlog` は CCR binlog のみを制御し、changelog には不要です。
- 自動クリーンアップを行う場合は、BE の `be.conf` でも `enable_feature_changelog = true` を指定する（動的設定ではないため、BE の再起動が必要）。
- Duplicate Key テーブル、またはクラスタキーを持たない Unique Key Merge-on-Write（MoW）テーブル。[サポート範囲と制限](#supported-scope-and-limitations)を参照してください。
- Changelog はテーブル作成時にのみ有効にできるため、テーブルを作成する前に評価してください。

## 基本概念 {#basic-concepts}

<!-- Knowledge type: Concept description -->

| 概念 | 説明 |
|---|---|
| 変更レコード | ベーステーブルでトランザクションがコミットされるたびに、変更された各行が 1 つのレコードを生成します。レコードには操作種別（挿入 / 更新 / 削除）、変更後の値、そしてオプションで変更前の値（before image）が含まれます |
| コミットタイムスタンプ（TSO） | 書き込みトランザクションのコミット時に FE から取得されるグローバルに単調増加するタイムスタンプ。物理部分（ミリ秒）と論理カウンターで構成されます。同じトランザクションのすべての変更は同じ TSO を共有します。Table Stream のオフセットと `@incr` の時間ウィンドウはいずれも TSO で測定されます |
| LSN | トランザクション内の変更レコードのシーケンス番号。TSO と組み合わせて変更レコードの順序を定義します |

## changelog の有効化 {#enabling-changelog}

<!-- Knowledge type: Operational steps + Configuration parameters -->

Changelog は `CREATE TABLE` のテーブルプロパティでのみ有効にでき、その後無効にすることはできません。

```sql
CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true",
    "changelog.ttl_seconds" = "86400"
);
```

`binlog.*` プロパティ（`binlog.enable`、`binlog.ttl_seconds` など）は CCR binlog を設定するものであり、changelog には使用しません。[CCR binlog](#ccr-binlog) を参照してください。

### プロパティ {#properties}

| プロパティ | 値 | デフォルト | 作成後に変更可能 | 説明 |
|---|---|---|---|---|
| `changelog.enable` | `true` / `false` | `false` | いいえ | changelog を有効にするかどうか。`CREATE TABLE` でのみ設定できるか、データベースのデフォルトを継承します。[データベースのデフォルト](#database-default)を参照してください |
| `changelog.need_historical_value` | `true` / `false` | `false` | いいえ | 変更前の値（before image）を記録するかどうか。changelog が有効である必要があります。`true` にできるのは Unique Key MoW テーブルだけです。更新または削除を処理する必要がある `min_delta` / `detail` Table Stream、`MIN_DELTA` 増分クエリ、IVM はこのプロパティに依存します |
| `changelog.ttl_seconds` | 正の整数（秒） | `86400`（一日） | はい | 変更レコードの保持期間。changelog が有効である必要があります。期限切れレコードは増分読み取りから除外され、バックグラウンド compaction によって回収されます。`0` と負の値は指定できません。[保持とクリーンアップ](#retention-and-cleanup)を参照してください |

### 不変プロパティの変更 {#changing-immutable-properties}

既存のテーブルでは `changelog.enable` と `changelog.need_historical_value` を変更できないため、既存テーブルで changelog を有効にすることも、無効にすることもできません。このような変更は直ちに失敗します。

```sql
ALTER TABLE orders SET ("changelog.enable" = "false");
-- ERROR: not support change changelog.enable from true to false

ALTER TABLE orders SET ("changelog.need_historical_value" = "false");
-- ERROR: not support change changelog.need_historical_value from true to false

ALTER TABLE t_without_changelog SET ("changelog.enable" = "true");
-- ERROR: not support change changelog.enable from false to true
```

changelog を持たない既存テーブルの場合は、changelog を有効にした新しいテーブルを作成してデータをロードし、[`ALTER TABLE ... REPLACE WITH TABLE`](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE) で両方をアトミックに入れ替えます。

### プロパティの表示 {#viewing-the-properties}

`SHOW CREATE TABLE` は、changelog が有効なテーブルの `changelog.*` プロパティを一覧表示します。

```sql
SHOW CREATE TABLE orders\G
```

```text
...
"changelog.enable" = "true",
"changelog.ttl_seconds" = "86400",
"changelog.need_historical_value" = "true",
...
```

### データベースのデフォルト {#database-default}

データベースでは、そのデータベース内で作成されるテーブルのデフォルトとして changelog を設定できます。

```sql
CREATE DATABASE changelog_db PROPERTIES ("changelog.enable" = "true");
```

以後 `changelog_db` で作成されるテーブルは、`"changelog.enable" = "false"` を指定しない限り changelog が有効になります。また、独自の値を指定しない限り、データベースの `changelog.ttl_seconds` と `changelog.need_historical_value` を使用します。Aggregate Key テーブルなど、モデルが changelog をサポートしないテーブルは、このようなデータベースでは `"changelog.enable" = "false"` を指定する必要があります。`ALTER DATABASE ... SET PROPERTIES` による変更は、その後に作成されるテーブルのデフォルトだけを変更します。

デフォルトで changelog が有効なデータベースでは、changelog を持たないテーブルに対する `SHOW CREATE TABLE` の出力に `"changelog.enable" = "false"` が表示されます。そのため、`CREATE TABLE ... LIKE` や、その出力からコピーしたステートメントでも changelog を持たないテーブルが作成されます。

## サポート範囲と制限 {#supported-scope-and-limitations}

<!-- Knowledge type: Support matrix -->
<!-- Use cases: Checking table model / column type support before creating the table -->

### テーブルモデル {#table-models}

| テーブルモデル | サポート | 備考 |
|---|---|---|
| Duplicate Key | はい | 挿入された行だけが記録されます。`changelog.need_historical_value = true` は `Duplicate table model don't support record historical value` というエラーで拒否されます |
| Unique Key、Merge-on-Write | はい | 挿入、更新、削除が記録され、before image を有効にできます。**クラスタキーを持つテーブルはサポートされません**。`Unique merge-on-write tables with cluster keys do not support changelog` で失敗します |
| Unique Key、Merge-on-Read | いいえ | `Only duplicate and mow table model support changelog` で失敗します |
| Aggregate Key | いいえ | 同上 |

### 列タイプ {#column-types}

| 制限 | 備考 |
|---|---|
| 自動インクリメント列 | サポートされません。`CREATE TABLE` と `ADD COLUMN` の両方で拒否されます |
| VARIANT 列 | サポートされません。`CREATE TABLE` と `ADD COLUMN` の両方で拒否されます |

### デプロイモード {#deployment-modes}

Changelog は統合ストレージ・コンピュートモードと、ストレージ・コンピュート分離モードの両方で有効にできます。

### 書き込み方法 {#write-methods}

すべての書き込み方法（`INSERT`、`UPDATE`、`DELETE`、Stream Load、Broker Load、Routine Load、Flink / Spark コネクターなど）によって生成された変更が記録されます。部分列更新と柔軟な部分列更新も含まれます。

### 一時テーブル {#temporary-tables}

一時テーブルに changelog はありません。一時テーブルで `"changelog.enable" = "true"` を指定すると `Cannot create temporary table with changelog enable` で失敗し、一時テーブルはデータベースの changelog デフォルトも無視します。

### CCR binlog {#ccr-binlog}

Changelog とクロスクラスター レプリケーション（CCR）で使用される binlog を組み合わせることはできません。

- 1 つのテーブルで `"binlog.enable" = "true"` と `"changelog.enable" = "true"` の両方を設定することはできません。また、changelog を持つテーブルの `binlog.*` プロパティは変更できません。
- changelog を持つテーブルは、CCR binlog を有効にしたデータベース内に作成したり、そのデータベースへリカバリしたりできません。changelog を持つテーブルを含むデータベースで CCR binlog を有効にすることもできません。
- 1 つのデータベースで両方を有効にすることはできません。

Changelog を持つテーブルはバックアップとリストアもサポートしません。

## 変更レコードモデル {#change-record-model}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Understanding which change records each write operation produces -->

### 操作種別と非表示列 {#operation-types-and-hidden-columns}

各変更レコードには、ベーステーブルのすべての可視列（変更後の値）に加えて、次の非表示列が含まれます。

| 非表示列 | 型 | 説明 |
|---|---|---|
| `__DORIS_CHANGELOG_OP__` | BIGINT | 操作種別。`changelog()` テーブル関数が返す生レコードでは、`0` は挿入、`1` は更新、`2` は削除です。`@incr` 増分クエリでは更新が 2 行に分割され、`0` は挿入、`1` は削除、`2` は更新前、`3` は更新後を表します |
| `__DORIS_CHANGELOG_TSO__` | BIGINT | コミットタイムスタンプ |
| `__DORIS_CHANGELOG_LSN__` | BIGINT | トランザクション内のシーケンス番号 |
| `__DORIS_CHANGELOG_BEFORE_<column>__` | 元の列と同じ | 変更前の値。キー以外の各列に 1 つ存在します。`changelog.need_historical_value = true` の場合だけ存在します |

ベーステーブル自体にも、各行の最新の書き込みのコミットタイムスタンプを保持する非表示列 `__DORIS_COMMIT_TSO_COL__` が追加されます。`SET show_hidden_columns = true` の後に直接クエリできます。

```sql
SET show_hidden_columns = true;
SELECT order_id, status, __DORIS_COMMIT_TSO_COL__ FROM orders;
```

### Duplicate Key テーブル {#duplicate-key-tables}

Duplicate Key テーブルには挿入だけがあります。すべての書き込みの各行が挿入レコードとして記録され、同じキーを持つ行がマージされることはありません。

Duplicate Key テーブルでの `DELETE FROM ... WHERE ...` は、削除述語で行をマークし、**変更レコードを生成しません**。Table Stream または `@incr` を使用する下流のコンシューマーは、このような削除を認識できません。削除を下流へ伝播する必要がある場合は、Unique Key MoW テーブルを使用してください。

### Unique Key MoW テーブル {#unique-key-mow-tables}

| 書き込み操作 | 記録内容 |
|---|---|
| 存在しないキーへの書き込み | 挿入レコード 1 件 |
| 既存キーへの書き込み（同じキーを持つ `INSERT`、`UPDATE`、部分列更新） | 更新後の完全な行を含む更新レコード 1 件。before image が有効な場合は更新前の値も含みます |
| 既存キーの削除（`DELETE`、削除サイン付きロード） | 削除レコード 1 件。before image が有効な場合は削除前の値を含み、それ以外ではキー列だけに値があります |
| 削除後に同じキーを再度書き込む | 挿入レコード 1 件（以前のバージョンは削除マーカーであり、ライブ行ではありません） |
| 可視行より小さい sequence 列値の書き込み | 書き込みは破棄され、変更レコードは生成されません |

MoW テーブルの `DELETE` はデフォルトで削除マーカーを書き込むことで実装されるため、削除レコードを生成します。テーブルプロパティ `enable_mow_light_delete` が `true` の場合、`DELETE` は代わりに削除述語を使用し、Duplicate Key テーブルと同様に変更レコードを生成しません。changelog を持つテーブルでは、このプロパティをデフォルトの `false` のままにしてください。

部分列更新では、更新された列だけでなく、マージ後の完全な行が記録されます。柔軟な部分列更新（`unique_key_update_mode = UPDATE_FLEXIBLE_COLUMNS`）では、1 つのバッチ内で同じキーを削除してから書き込む操作が、更新レコード 1 件として記録されます。before image は削除前の古い行で、after image は新しく書き込まれた行です。指定されなかった列は古い値ではなく、デフォルト値または NULL になります。

次の例は、before image を有効にした MoW テーブルの生の変更レコードを示します。

```sql
INSERT INTO orders VALUES (1, 'created', 100.00);
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 1;
INSERT INTO orders VALUES (1, 'created', 150.00);

SELECT __DORIS_CHANGELOG_OP__ AS op, order_id, status, amount,
       __DORIS_CHANGELOG_BEFORE_status__ AS before_status,
       __DORIS_CHANGELOG_BEFORE_amount__ AS before_amount
FROM changelog("table" = "orders")
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

```text
+------+----------+---------+--------+---------------+---------------+
| op   | order_id | status  | amount | before_status | before_amount |
+------+----------+---------+--------+---------------+---------------+
|    0 |        1 | created | 100.00 | NULL          |          NULL |
|    1 |        1 | paid    | 100.00 | created       |        100.00 |
|    2 |        1 | paid    | 100.00 | paid          |        100.00 |
|    0 |        1 | created | 150.00 | NULL          |          NULL |
+------+----------+---------+--------+---------------+---------------+
```

## DDL の制限 {#ddl-restrictions}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Checking which ALTER TABLE operations remain available with changelog enabled -->

Changelog が有効なテーブルで許可される `ALTER TABLE` 操作は次のとおりです。

| 許可 | 備考 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | 軽量スキーマ変更としてのみ許可されます（テーブルで `light_schema_change` が有効である必要があり、デフォルトで有効）。新しい列は変更レコードに自動的に追加されます |
| `CREATE INDEX` / `DROP INDEX` | 軽量インデックス変更のみ |
| `ADD ROLLUP` / `DROP ROLLUP` / `RENAME ROLLUP` | |
| パーティション操作：`ADD PARTITION`、`DROP PARTITION`、`MODIFY PARTITION`、`RENAME PARTITION`、`REPLACE PARTITION` | |
| テーブルの `RENAME`、`REPLACE WITH TABLE` | |
| テーブルコメントまたは列コメントの変更 | |
| バケット方式の変更 | |
| テーブルプロパティの変更 | `bloom_filter_columns` / `bloom_filter_fpp` を除く |
| `ENABLE FEATURE`（`SEQUENCE_LOAD` など） | 内部的に `ADD COLUMN` へ変換されます |

その他の操作は `Not allowed to perform current operation on Table With changelog` で拒否されます。代表例は次のとおりです。

- `MODIFY COLUMN`（列の型や位置などの変更）
- `RENAME COLUMN`
- `ORDER BY`（列の並べ替え）
- `BUILD INDEX`
- bloom filter プロパティの変更

Changelog が有効なテーブルでも `TRUNCATE TABLE` は通常どおり動作しますが、バックアップとリストアはサポートされません。ベーステーブルのスキーマおよびパーティションの変更が既存の Table Stream に与える影響については、[Table Stream Advanced](table-stream-advanced#effect-of-base-table-changes)を参照してください。

## 保持とクリーンアップ {#retention-and-cleanup}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Setting retention / Handling expired offsets / Capacity planning -->

Doris 5.0.0 以降、`changelog.ttl_seconds` は統合ストレージ・コンピュートモードとストレージ・コンピュート分離モードの両方で changelog の保持期間を制御します。保持期間はコミット TSO の物理時刻に基づき、現在の Master FE の TSO を基準として計算されます。コミット時刻が基準時刻から TTL を引いた時刻以前のレコードは期限切れになります。テーブルに新しい書き込みがなくても、保持ウィンドウは進みます。

### 保持期間の設定 {#configuring-retention}

デフォルト TTL は `86400` 秒（一日）です。データベースで `changelog.ttl_seconds` を設定すると、新しい changelog テーブルはその値を継承します。ただし、テーブルプロパティで上書きした値が優先されます。データベース設定を変更しても、既存テーブルの TTL は変わりません。`CREATE TABLE ... LIKE` はソーステーブルの TTL をコピーします。

上記で作成した `orders` テーブルの変更を七日間保持するには、次を実行します。

```sql
ALTER TABLE orders SET ("changelog.ttl_seconds" = "604800");
```

ステートメントが成功すると、`SHOW CREATE TABLE orders` に次が含まれます。

```text
"changelog.ttl_seconds" = "604800"
```

TTL は `0` より大きくなければならず、`0` や `-1` で期限切れを無効にすることはできません。TTL を短縮すると既存レコードが直ちに期限切れになる場合があります。TTL を延長すると、物理的に残っているレコードが再び読み取り可能になる場合がありますが、すでにクリーンアップされたレコードを復元することはできません。パーティションへの設定公開中に `ALTER TABLE` が失敗した場合、短い TTL がすでに適用されている可能性があります。`SHOW CREATE TABLE` を確認し、同じステートメントを再試行して更新を完了してください。

### 読み取りへの影響 {#effect-on-reads}

増分読み取りでは、物理的なクリーンアップが完了する前に、ステートメントの計画時点で保持ウィンドウが適用されます。1 つのステートメントは 1 つの基準 TSO を使用し、新しいステートメントごとにウィンドウが再計算されます。

| 読み取り方法 | 要求された開始位置が期限切れの場合の動作 |
|---|---|
| `startTimestamp` なしの `@incr` | `MIN_DELTA` モードを含め、保持されている変更だけを読み取ります |
| `incrementType = MIN_DELTA` で `startTimestamp` を明示した `@incr` | 不完全な正味変更を返さないよう、`Changelog offset has expired according to changelog.ttl_seconds` で失敗します |
| `incrementType = DETAIL` または `APPEND_ONLY` の `@incr` | 実効開始位置を最初に保持されている TSO へ移動し、要求されたウィンドウのうち保持されている部分だけを返します |
| `type = min_delta` の Table Stream | パーティションの消費オフセットが期限切れの場合、同じエラーで失敗します |
| `type = detail` または `append_only` の Table Stream | 期限切れの変更をスキップし、最初に保持されている TSO から読み取ります |
| MoW スナップショット読み取り（`FOR TIME AS OF`、`FOR VERSION AS OF`、または Stream の `@snapshot()`） | 再構築に changelog が必要な場合、before image が保持ウィンドウ内にないため、期限切れの対象スナップショットは同じエラーで失敗します |
| `changelog()` テーブル関数 | TTL フィルターを適用しません。物理クリーンアップで削除されるまで、期限切れの生レコードも表示できます |

期限切れ処理はコンシューマーを待ちません。Stream が `IS_STALE` / `STALE_REASON` によって利用可能と報告されている場合でも、保持ウィンドウ内に変更を消費してください。現在の実装では、これらのフィールドは TTL の期限切れを報告しません。必要な変更が期限切れになった後は、完全なスナップショットから下流データを再構築してください。Table Stream の場合は、[リセット手順](table-stream-advanced#reset-reset)を使用して下流を再ロードし、オフセットを進めます。IVM の内部 Stream は、[マテリアライズドビューの更新タスク](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)で管理します。

### 例：変更が期限切れになってもベースデータは保持される {#example-expired-changes-with-base-data-preserved}

この例は、`CREATE` と `LOAD` 権限、およびクエリ用の `SELECT` 権限を持つユーザーで、既存のデータベース内で実行してください。

```sql
CREATE TABLE changelog_ttl_demo (id INT, value INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "changelog.enable" = "true",
    "changelog.ttl_seconds" = "30"
);

INSERT INTO changelog_ttl_demo VALUES (1, 10);

SELECT COUNT(*) AS change_count
FROM changelog_ttl_demo@incr("incrementType" = "DETAIL");
```

挿入直後、クエリは次を返します。

```text
+--------------+
| change_count |
+--------------+
|            1 |
+--------------+
```

30 秒を超えて待ってから、増分クエリを再度実行します。

```sql
SELECT COUNT(*) AS change_count
FROM changelog_ttl_demo@incr("incrementType" = "DETAIL");
```

```text
+--------------+
| change_count |
+--------------+
|            0 |
+--------------+
```

ベース行は引き続き存在します。

```sql
SELECT id, value FROM changelog_ttl_demo;
```

```text
+------+-------+
| id   | value |
+------+-------+
|    1 |    10 |
+------+-------+
```

### 物理クリーンアップと容量計画 {#physical-cleanup-and-capacity-planning}

バックグラウンド compaction は、アイドル状態のテーブルを含め、完全に期限切れになった changelog Rowset を回収します。期限切れでないレコードも含む Rowset は、すべてのレコードが期限切れになるまで保持されます。クリーンアップでは、ベーステーブルのデータとバージョンの連続性が保持されます。ストレージは非同期に回収されるため、TTL はファイルがその時点で消える期限でも、厳密なストレージ容量上限でもありません。

自動クリーンアップには、BE で `enable_feature_changelog = true` が設定され、自動 compaction が有効になっている必要があります。BE 設定またはテーブルプロパティ `disable_auto_compaction = true` を設定すると自動クリーンアップが一時停止しますが、増分読み取りでは引き続き期限切れレコードがフィルターされます。BE の再起動後、クリーンアップは Master FE のハートビートから有効な基準 TSO を受け取るまで待機します。

Changelog の保持は時間だけで制限され、サイズまたは件数の制限はありません。書き込み量、TTL、クリーンアップ遅延に基づいてストレージを確保してください。before image を有効にした MoW テーブルでは、更新ごとに古い値のコピーも追加で保存されます。TTL は最大消費遅延、更新間隔、想定停止時間をカバーし、復旧のための時間も含めて設定してください。

## 書き込みオーバーヘッド {#write-overhead}

<!-- Knowledge type: Performance notes -->
<!-- Use cases: Evaluating load throughput before going to production -->

Changelog を有効にすると、すべての書き込みで変更レコードが追加生成され、永続化されます。MoW テーブルでは、更新と削除で before image を作成するために古い値も読み取ります。ロードスループットは明らかに低下し、実際の低下量はテーブルスキーマと更新比率によって異なります。推奨事項は次のとおりです。

- 増分消費が本当に必要なテーブルだけで有効にする。
- 本番環境へ移行する前に、現実的な書き込みワークロードでスループットの変化を評価する。
- 変更前の値が不要な場合（たとえば `append_only` 消費だけを行う場合や最新値だけが重要な場合）は、`changelog.need_historical_value` を有効にしない。

## changelog() テーブル関数によるトラブルシューティング {#troubleshooting-with-the-changelog-table-function}

<!-- Knowledge type: Troubleshooting -->
<!-- Use cases: Confirming whether a write produced the expected changes / Inspecting the change history of a key -->

`changelog()` テーブル関数は、テーブルの生の変更レコードを返します。たとえば、書き込みによって期待した変更が生成されたかどうかの確認や、キーの変更履歴の調査に使用できます。

:::caution
`changelog()` は主に内部デバッグ用であり、本番データパイプラインでの使用は推奨されません。出力形式とパラメータはバージョン間で変更される可能性があります。実際の増分消費には [Table Stream](table-stream) または [`@incr`](incremental-query) を使用してください。
:::

```sql
SELECT __DORIS_CHANGELOG_OP__, __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__,
       order_id, status, amount
FROM changelog(
    "db" = "demo",
    "table" = "orders",
    "partition" = "p20260914"
)
WHERE order_id = 1
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

| パラメータ | 必須 | 説明 |
|---|---|---|
| `table` | はい | テーブル名 |
| `db` | いいえ | データベース名。デフォルトは現在のデータベース |
| `partition` | いいえ | コンマ区切りのパーティション名。デフォルトはすべてのパーティション |
| `tablet` | いいえ | コンマ区切りの Tablet ID。デフォルトはすべての Tablet |

`changelog()` は保存された生レコードを、変更の折りたたみや TTL フィルターなしで読み取ります。`__DORIS_CHANGELOG_OP__` は生のエンコーディング（`0` 挿入、`1` 更新、`2` 削除）を使用します。物理クリーンアップが完了するまで、期限切れのレコードがここに表示される場合があります。`changelog.need_historical_value = true` のテーブルで `changelog()` に対して `SELECT *` を実行すると、before image 列も返されます。これらの列名は予約済みプレフィックス `__DORIS_` で始まります。`changelog()` に基づいてビュー、CTAS テーブル、またはマテリアライズドビューを定義する場合は、列を明示し、非表示列と before image 列に別名を付けてください。完全な構文は [CHANGELOG テーブル関数](../../sql-manual/sql-functions/table-valued-functions/changelog)にあります。

## よくあるエラー {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| エラーメッセージ | 原因 | 対処 |
|---|---|---|
| `Property binlog.format is no longer supported, use "changelog.enable" = "true" to enable changelog, or remove it for CCR binlog` | ステートメントで、初期の開発ビルドが changelog を有効にするために使用していた `binlog.format` を指定している | `"changelog.enable" = "true"` で changelog を有効にする。CCR binlog の場合はプロパティを削除する |
| `Property binlog.need_historical_value is no longer supported, use changelog.need_historical_value instead` | 初期の開発ビルドで使用されていたプロパティ名を指定している | `changelog.need_historical_value` を使用する |
| `Table <db>.<table> was created with "binlog.format" = "ROW", which is no longer supported; drop the table and create it again with "changelog.enable" = "true"` | テーブルが初期の開発ビルドで作成された | テーブルを削除し、`"changelog.enable" = "true"` で再作成する |
| `Cannot create table <table> with changelog when enable_feature_changelog=false` | FE で changelog が有効になっていない | `fe.conf` に `enable_feature_changelog = true` を設定し、FE を再起動する |
| `changelog.ttl_seconds must be greater than 0` | TTL が `0` または負の値 | 秒単位の正の整数を設定する。デフォルトは `86400` |
| `Changelog offset has expired according to changelog.ttl_seconds` | `MIN_DELTA` の開始位置または MoW スナップショットが保持ウィンドウ外にある | 完全なスナップショットから下流を再構築し、消費位置を再調整する。[読み取りへの影響](#effect-on-reads)を参照 |
| `not support change changelog.enable from false to true` | 既存テーブルで `ALTER TABLE` を使用して changelog を有効にしようとした | Changelog はテーブル作成時にのみ有効にできます。changelog を有効にした新しいテーブルを作成してデータをロードし、`ALTER TABLE ... REPLACE WITH TABLE` で 2 つのテーブルを入れ替える |
| `not support change changelog.enable from true to false` | changelog が有効なテーブルで `changelog.enable = false` を設定しようとした | 一度有効にした changelog は無効にできない |
| `not support change changelog.need_historical_value from true to false` | `changelog.need_historical_value` を変更した | このプロパティは作成後に変更できない |
| `Property <property> requires "changelog.enable" = "true"` | changelog を有効にしていないテーブルの `CREATE TABLE` で `changelog.ttl_seconds` または `changelog.need_historical_value` を設定した | テーブルで changelog を有効にするか、プロパティを削除する |
| `changelog.ttl_seconds can not be set because changelog is not enabled for table: <table>` | changelog を持たないテーブルで `ALTER TABLE` により `changelog.ttl_seconds` を設定した | changelog の保持期間を持てるのは changelog が有効なテーブルだけ |
| `Duplicate table model don't support record historical value` | Duplicate Key テーブルで `changelog.need_historical_value = true` を設定した | Duplicate Key テーブルには before image がない。プロパティを削除するか、before image が必要なら Unique Key MoW テーブルを使用する |
| `Unique merge-on-write tables with cluster keys do not support changelog` | MoW テーブルにクラスタキーがある | クラスタキーなしでテーブルを作成する |
| `Only duplicate and mow table model support changelog` | テーブルモデルが Aggregate Key または Unique Key Merge-on-Read | Duplicate Key または Unique Key MoW テーブルを使用する。デフォルトで changelog が有効なデータベースでは、このようなテーブルに `"changelog.enable" = "false"` を設定する |
| `Table <table> can not enable both binlog and changelog` | `CREATE TABLE` で `binlog.enable` と `changelog.enable` の両方を `true` に設定した | どちらか一方を選択する。[CCR binlog](#ccr-binlog)を参照 |
| `Can not create table <table> with changelog in database <db> because the database enables binlog` | データベースで CCR binlog が有効になっている | CCR binlog を有効にしていないデータベースでテーブルを作成する |
| `Cannot create temporary table with changelog enable` | 一時テーブルで `"changelog.enable" = "true"` を設定した | 一時テーブルに changelog は設定できない |
| `Not allowed to perform current operation on Table With changelog` | `MODIFY COLUMN`、`RENAME COLUMN`、`ORDER BY`、`BUILD INDEX`、bloom filter プロパティの変更など、許可されていない DDL を実行した | [DDL の制限](#ddl-restrictions)の許可一覧を参照 |
