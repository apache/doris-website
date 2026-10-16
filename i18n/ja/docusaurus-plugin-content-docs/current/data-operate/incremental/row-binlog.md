---
{
    "title": "Row Binlog",
    "language": "ja",
    "description": "Doris Row Binlog による行単位の挿入、更新、削除の記録について説明します。テーブルプロパティ、TTL による保持、自動クリーンアップ、対応するテーブルモデル、トラブルシューティングを扱います。",
    "keywords": [
        "Row Binlog",
        "行単位の binlog",
        "Doris binlog",
        "binlog.enable",
        "binlog.format ROW",
        "binlog.need_historical_value",
        "binlog.ttl_seconds",
        "Row Binlog TTL",
        "変更前の値",
        "履歴値",
        "コミット TSO",
        "__DORIS_BINLOG_OP__",
        "__DORIS_COMMIT_TSO_COL__",
        "binlog() テーブル関数",
        "Merge-on-Write の変更レコード",
        "Duplicate Key の変更レコード",
        "軽量スキーマ変更",
        "enable_mow_light_delete",
        "変更データキャプチャ",
        "Doris CDC",
        "増分ビュー保守",
        "IVM",
        "Not allowed to perform current operation on Table With binlog",
        "Only duplicate and mow table model support binlog"
    ]
}
---

<!-- Knowledge type: Feature description + Parameter reference -->
<!-- Use cases: Enabling row-level change recording on a table / Checking whether a table model is supported / Inspecting change records -->

Row Binlog は Doris の内部テーブルの行単位の変更ログです。有効にすると、書き込みによる行単位の変更（挿入、更新、削除）ごとに、変更後の値、設定に応じて変更前の値、およびコミットタイムスタンプが保存されます。[Table Stream](table-stream)、[増分クエリ](incremental-query)、[増分ビュー保守（IVM）](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)のデータソースとして使われます。また、[Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/incremental-read)（Connector 26.3.0 以降）を介して Flink から利用することもできます。

変更レコードのデフォルトの保持期間は一日です。想定される最長の取り込み遅延をカバーするように `binlog.ttl_seconds` を設定してください。変更レコードの期限が切れても、ベーステーブルのデータは削除されません。

:::caution 実験的機能
この機能はバージョン 5.0.0 以降で利用できる実験的機能です。FE の設定で `enable_feature_binlog = true` が必要です。
:::

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降。
- `enable_feature_binlog = true` を FE の `fe.conf` に設定します（動的設定ではないため、FE の再起動が必要です）。
- 自動クリーンアップを行う場合は、`enable_feature_binlog = true` を BE の `be.conf` にも設定します（動的設定ではないため、BE の再起動が必要です）。
- Duplicate Key テーブル、またはクラスタキーのない Unique Key Merge-on-Write（MoW）テーブルが必要です。[対応範囲と制限事項](#supported-scope-and-limitations)を参照してください。
- Row Binlog を有効にできるのはテーブル作成時だけです。テーブルを作成する前に利用を検討してください。

## 基本概念 {#basic-concepts}

<!-- Knowledge type: Concept description -->

| 概念 | 説明 |
|---|---|
| 変更レコード | ベーステーブルのトランザクションがコミットされるたびに、変更された各行から一件ずつ生成されるレコード。操作種別（挿入 / 更新 / 削除）、変更後の値、および必要に応じて変更前の値（before image）が含まれます |
| コミットタイムスタンプ（TSO） | 書き込みトランザクションのコミット時に FE から取得する、全体で単調増加するタイムスタンプ。物理部分（ミリ秒）と論理カウンターで構成されます。一つのトランザクションの変更はすべて同じ TSO を共有します。Table Stream のオフセットと `@incr` の時間ウィンドウは、どちらも TSO で表されます |
| LSN | トランザクション内での変更レコードの連番。TSO と組み合わせて変更レコードの順序を定めます |

## Row Binlog の有効化 {#enabling-row-binlog}

<!-- Knowledge type: Operational steps + Configuration parameters -->

Row Binlog は `CREATE TABLE` のテーブルプロパティでのみ有効にでき、その後は無効にできません。

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
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);
```

`binlog.enable` と `binlog.format = "ROW"` は一緒に設定する必要があります。`binlog.enable` だけでは Row Binlog は有効になりません。

### プロパティ {#properties}

| プロパティ | 値 | デフォルト | 作成後の変更 | 説明 |
|---|---|---|---|---|
| `binlog.enable` | `true` / `false` | `false` | 有効化後は無効化不可 | binlog を有効にするかどうか。`binlog.format = "ROW"` と一緒に設定する必要があります |
| `binlog.format` | `ROW` | - | 不可 | 行単位の変更を記録するため、`ROW` を指定します。大文字と小文字は区別され、小文字の `row` を指定すると `Invalid binlog format value: row` が発生します |
| `binlog.need_historical_value` | `true` / `false` | `false` | 不可 | 変更前の値（before image）を記録するかどうか。`true` にできるのは Unique Key MoW テーブルだけです。更新または削除を扱う必要がある `min_delta` / `detail` Table Stream、`MIN_DELTA` 増分クエリ、IVM はこの値に依存します |
| `binlog.ttl_seconds` | 正の整数（秒） | `86400`（一日） | 可 | 変更レコードの保持期間。期限切れのレコードは増分読み取りから除外され、バックグラウンドのコンパクションで回収されます。`0` と負の値は指定できません。[保持とクリーンアップ](#retention-and-cleanup)を参照してください |
| `binlog.max_bytes` | 整数（バイト） | 無制限 | 可 | 保持サイズの上限。**現行バージョンでは効果がありません** |
| `binlog.max_history_nums` | 整数 | 無制限 | 可 | 保持件数の上限。**現行バージョンでは効果がありません** |

### 変更できないプロパティの変更 {#changing-immutable-properties}

既存のテーブルで変更できないプロパティを変更しようとすると、直ちにエラーになります。

```sql
ALTER TABLE orders SET ("binlog.enable" = "false");
-- ERROR: can't disable binlog when format is [Row]

ALTER TABLE orders SET ("binlog.need_historical_value" = "false");
-- ERROR: not support change binlog.need_historical_value from true to false

ALTER TABLE t_without_binlog SET ("binlog.format" = "ROW");
-- ERROR: not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW
```

Row Binlog がない既存のテーブルでは、Row Binlog を有効にした新しいテーブルを作成してデータをロードし、[`ALTER TABLE ... REPLACE WITH TABLE`](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE) を使って二つのテーブルをアトミックに入れ替えます。

### プロパティの確認 {#viewing-the-properties}

`SHOW CREATE TABLE` にはすべての `binlog.*` プロパティが表示されます。

```sql
SHOW CREATE TABLE orders\G
```

```text
...
"binlog.enable" = "true",
"binlog.ttl_seconds" = "86400",
"binlog.max_bytes" = "9223372036854775807",
"binlog.max_history_nums" = "9223372036854775807",
"binlog.format" = "ROW",
"binlog.need_historical_value" = "true",
...
```

## 対応範囲と制限事項 {#supported-scope-and-limitations}

<!-- Knowledge type: Support matrix -->
<!-- Use cases: Checking table model / column type support before creating the table -->

### テーブルモデル {#table-models}

| テーブルモデル | 対応 | 備考 |
|---|---|---|
| Duplicate Key | 対応 | 挿入された行のみ記録します。`binlog.need_historical_value = true` は `Duplicate table model don't support record historical value` で拒否されます |
| Unique Key、Merge-on-Write | 対応 | 挿入、更新、削除を記録します。before image を有効にできます。**クラスタキーがあるテーブルには対応せず**、`Unique merge-on-write tables with cluster keys do not support binlog<Row>` で失敗します |
| Unique Key、Merge-on-Read | 非対応 | `Only duplicate and mow table model support binlog<Row>` で失敗します |
| Aggregate Key | 非対応 | 上記と同じエラーになります |

### カラム型 {#column-types}

| 制限 | 備考 |
|---|---|
| 自動採番カラム | 非対応。`CREATE TABLE` と `ADD COLUMN` のどちらでも拒否されます |
| VARIANT カラム | 非対応。`CREATE TABLE` と `ADD COLUMN` のどちらでも拒否されます |

### デプロイモード {#deployment-modes}

Row Binlog はストレージとコンピューティングの統合モード、および分離モードの両方で有効にできます。

### 書き込み方法 {#write-methods}

すべての書き込み方法（`INSERT`、`UPDATE`、`DELETE`、Stream Load、Broker Load、Routine Load、Flink / Spark コネクターなど）による変更が記録されます。部分カラム更新と柔軟な部分カラム更新も対象です。

## 変更レコードのモデル {#change-record-model}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Understanding which change records each write operation produces -->

### 操作種別と隠しカラム {#operation-types-and-hidden-columns}

各変更レコードには、ベーステーブルの表示カラムすべて（変更後の値）に加えて、次の隠しカラムが含まれます。

| 隠しカラム | 型 | 説明 |
|---|---|---|
| `__DORIS_BINLOG_OP__` | TINYINT | 操作種別。`binlog()` テーブル関数が返す生レコードでは、`0` は挿入、`1` は更新、`2` は削除です。`@incr` 増分クエリでは、更新が二行に分割され、`0` は挿入、`1` は削除、`2` は更新前、`3` は更新後を表します |
| `__DORIS_BINLOG_TSO__` | BIGINT | コミットタイムスタンプ |
| `__DORIS_BINLOG_LSN__` | BIGINT | トランザクション内の連番 |
| `__BEFORE__<column>__` | 元のカラムと同じ | 変更前の値。キー以外のカラムごとに一つあり、`binlog.need_historical_value = true` の場合にのみ存在します |

ベーステーブル自体にも、各行に対する最新の書き込みのコミットタイムスタンプを保持する隠しカラム `__DORIS_COMMIT_TSO_COL__` が追加されます。`SET show_hidden_columns = true` の後に直接クエリできます。

```sql
SET show_hidden_columns = true;
SELECT order_id, status, __DORIS_COMMIT_TSO_COL__ FROM orders;
```

### Duplicate Key テーブル {#duplicate-key-tables}

Duplicate Key テーブルでは、変更レコードとして記録されるのは挿入のみです。各書き込みの各行が挿入レコードとして記録され、同じキーの行がマージされることはありません。

Duplicate Key テーブルでの `DELETE FROM ... WHERE ...` は、削除述語を使って行に削除マークを付け、**変更レコードを生成しません**。Table Stream や `@incr` を使う下流のコンシューマーには、この削除が見えません。削除を下流へ伝える必要がある場合は Unique Key MoW テーブルを使ってください。

### Unique Key MoW テーブル {#unique-key-mow-tables}

| 書き込み操作 | 記録内容 |
|---|---|
| 存在しないキーへの書き込み | 挿入レコード一件 |
| 既存のキーへの書き込み（同じキーの `INSERT`、`UPDATE`、部分カラム更新） | 更新後の完全な行を持つ更新レコード一件。before image が有効な場合は更新前の値も含まれます |
| 既存のキーの削除（`DELETE`、削除フラグ付きのロード） | 削除レコード一件。before image が有効な場合は削除前の値を含み、無効な場合はキーカラムにのみ値が入ります |
| 削除したキーへの再度の書き込み | 挿入レコード一件（以前のバージョンは有効な行ではなく削除マーカーです） |
| 表示されている行より低いシーケンスカラム値の書き込み | 書き込みは破棄され、変更レコードは生成されません |

MoW テーブルでの `DELETE` はデフォルトで削除マーカーを書き込むため、削除レコードが生成されます。テーブルプロパティ `enable_mow_light_delete` が `true` の場合、`DELETE` は代わりに削除述語を使用し、Duplicate Key テーブルと同様に変更レコードを生成しません。Row Binlog を使うテーブルでは、このプロパティをデフォルトの `false` のままにしてください。

部分カラム更新では、更新したカラムだけでなく、マージ後の完全な行を記録します。柔軟な部分カラム更新（`unique_key_update_mode = UPDATE_FLEXIBLE_COLUMNS`）では、一つのバッチ内で同じキーを削除してから書き込むと、更新レコード一件として記録されます。before image は削除前の古い行であり、after image は新たに書き込まれた行です。このとき、指定されなかったカラムには古い値ではなくデフォルト値または NULL が入ります。

次の例は、before image を有効にした MoW テーブルの生の変更レコードを示します。

```sql
INSERT INTO orders VALUES (1, 'created', 100.00);
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 1;
INSERT INTO orders VALUES (1, 'created', 150.00);

SELECT __DORIS_BINLOG_OP__ AS op, order_id, status, amount,
       __BEFORE__status__, __BEFORE__amount__
FROM binlog("table" = "orders")
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+----------+---------+--------+--------------------+--------------------+
| op   | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+----------+---------+--------+--------------------+--------------------+
|    0 |        1 | created | 100.00 | NULL               |               NULL |
|    1 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 |        1 | paid    | 100.00 | paid               |             100.00 |
|    0 |        1 | created | 150.00 | NULL               |               NULL |
+------+----------+---------+--------+--------------------+--------------------+
```

## DDL の制限 {#ddl-restrictions}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Checking which ALTER TABLE operations remain available with Row Binlog enabled -->

Row Binlog を有効にしたテーブルでは、次の `ALTER TABLE` 操作のみ実行できます。

| 許可される操作 | 備考 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | 軽量スキーマ変更の場合のみ（テーブルで `light_schema_change` が有効である必要があります。デフォルトで有効です）。新しいカラムは変更レコードに自動的に追加されます |
| `CREATE INDEX` / `DROP INDEX` | 軽量なインデックス変更の場合のみ |
| `ADD ROLLUP` / `DROP ROLLUP` / `RENAME ROLLUP` | |
| パーティション操作：`ADD PARTITION`、`DROP PARTITION`、`MODIFY PARTITION`、`RENAME PARTITION`、`REPLACE PARTITION` | |
| テーブルの `RENAME`、`REPLACE WITH TABLE` | |
| テーブルまたはカラムのコメントの変更 | |
| バケット分割の変更 | |
| テーブルプロパティの変更 | `bloom_filter_columns` / `bloom_filter_fpp` を除きます |
| `ENABLE FEATURE`（`SEQUENCE_LOAD` など） | 内部で `ADD COLUMN` に変換されます |

その他の操作は `Not allowed to perform current operation on Table With binlog<row>` で拒否されます。主な例は次のとおりです。

- `MODIFY COLUMN`（カラムの型や位置などの変更）
- `RENAME COLUMN`
- `ORDER BY`（カラムの並べ替え）
- `BUILD INDEX`
- bloom filter プロパティの変更

`TRUNCATE TABLE` やバックアップ / 復元などのテーブル単位の操作は、Row Binlog を有効にしたテーブルでも通常どおり動作します。ベーステーブルのスキーマとパーティションの変更が既存の Table Stream に与える影響については、[Table Stream の詳細](table-stream-advanced#effect-of-base-table-changes)を参照してください。

## 保持とクリーンアップ {#retention-and-cleanup}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Setting retention / Handling expired offsets / Capacity planning -->

Doris 5.0.0 以降、`binlog.ttl_seconds` はストレージとコンピューティングの統合モードと分離モードの両方で Row Binlog の保持期間を制御します。保持期間はコミット TSO の物理時刻に基づき、現在の Master FE の TSO を基準に計算されます。コミット時刻が基準時刻から TTL を引いた時刻以前のレコードは期限切れになります。テーブルへの新しい書き込みがなくても、保持ウィンドウは進みます。

### 保持期間の設定 {#configuring-retention}

デフォルトの TTL は `86400` 秒（一日）です。データベースで `binlog.ttl_seconds` を明示的に設定すると、テーブルプロパティで上書きしない限り、新しいテーブルにその値が引き継がれます。データベースの設定を変更しても、既存のテーブルには影響しません。`CREATE TABLE ... LIKE` は元のテーブルの TTL をコピーします。

上で作成した `orders` テーブルの変更を七日間保持するには、次を実行します。

```sql
ALTER TABLE orders SET ("binlog.ttl_seconds" = "604800");
```

ステートメントが成功すると、`SHOW CREATE TABLE orders` に次の値が含まれます。

```text
"binlog.ttl_seconds" = "604800"
```

TTL は `0` より大きくなければなりません。`0` も `-1` も期限切れ処理を無効にしません。TTL を短くすると、既存のレコードが直ちに期限切れになる場合があります。TTL を長くすると、物理的にまだ残っているレコードを再び読み取れる場合がありますが、すでにクリーンアップされたレコードは復元できません。設定をパーティションへ反映する途中で `ALTER TABLE` が失敗した場合、短い TTL がすでに適用されている可能性があります。`SHOW CREATE TABLE` を確認し、同じステートメントを再実行して更新を完了してください。

### 読み取りへの影響 {#effect-on-reads}

増分読み取りでは、物理的なクリーンアップが完了する前でも、ステートメントの計画時に保持ウィンドウが適用されます。一つのステートメントは一つの基準 TSO を使用し、新しいステートメントごとにウィンドウが再計算されます。

| 読み取り方法 | 要求した開始位置が期限切れの場合の動作 |
|---|---|
| `@incr` で `startTimestamp` を指定しない場合 | `MIN_DELTA` モードも含め、保持されている変更のみを読み取ります |
| `@incr` で `incrementType = MIN_DELTA` と明示的な `startTimestamp` を指定する場合 | 不完全な差分を返さないよう、`Row binlog offset has expired according to binlog.ttl_seconds` で失敗します |
| `@incr` で `incrementType = DETAIL` または `APPEND_ONLY` を指定する場合 | 実効開始位置を保持されている最初の TSO に移し、要求ウィンドウ内の保持されている部分だけを返します |
| `type = min_delta` の Table Stream | パーティションの取り込みオフセットが期限切れの場合、同じエラーで失敗します |
| `type = detail` または `append_only` の Table Stream | 期限切れの変更をスキップし、保持されている最初の TSO から読み取ります |
| MoW のスナップショット読み取り（`FOR TIME AS OF`、`FOR VERSION AS OF`、または Stream の `@snapshot()`） | 再構築に Row Binlog が必要な場合、対象のスナップショットが期限切れだと同じエラーで失敗します。保持ウィンドウ内に before image が残っていないためです |
| `binlog()` テーブル関数 | TTL フィルターを適用しません。物理的なクリーンアップで削除されるまで、期限切れの生レコードも表示される場合があります |

期限切れ処理はコンシューマーを待ちません。Stream が `IS_STALE` / `STALE_REASON` でまだ使用可能と報告されていても、保持ウィンドウ内に変更を取り込んでください。現行の実装では、これらのフィールドは TTL による期限切れを報告しません。必要な変更が期限切れになった場合は、完全なスナップショットから下流のデータを再構築します。Table Stream では、[リセット手順](table-stream-advanced#reset-reset)を使って下流へデータを再ロードし、オフセットを進めます。IVM の内部 Stream は[マテリアライズドビューの更新タスク](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)を通じて管理します。

### 例：ベースデータを残したまま変更が期限切れになる場合 {#example-expired-changes-with-base-data-preserved}

既存のデータベースで、`CREATE` 権限と `LOAD` 権限、クエリ用の `SELECT` 権限を持つユーザーとして次の例を実行します。

```sql
CREATE TABLE row_binlog_ttl_demo (id INT, value INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.ttl_seconds" = "30"
);

INSERT INTO row_binlog_ttl_demo VALUES (1, 10);

SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

挿入直後、クエリは次を返します。

```text
+--------------+
| change_count |
+--------------+
|            1 |
+--------------+
```

30 秒以上待ってから、増分クエリを再度実行します。

```sql
SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

```text
+--------------+
| change_count |
+--------------+
|            0 |
+--------------+
```

ベーステーブルの行は引き続き存在します。

```sql
SELECT id, value FROM row_binlog_ttl_demo;
```

```text
+------+-------+
| id   | value |
+------+-------+
|    1 |    10 |
+------+-------+
```

### 物理的なクリーンアップと容量計画 {#physical-cleanup-and-capacity-planning}

バックグラウンドのコンパクションは、書き込みのないテーブルも含め、完全に期限切れになった Row Binlog Rowset を回収します。期限切れでないレコードも含む Rowset は、すべてのレコードが期限切れになるまで保持されます。クリーンアップではベーステーブルのデータとバージョンの連続性が維持されます。ストレージは非同期に回収されるため、TTL はファイルの消去期限でも、厳密なストレージサイズの上限でもありません。

自動クリーンアップには、BE の `enable_feature_binlog = true` と自動コンパクションの有効化が必要です。BE の設定またはテーブルプロパティ `disable_auto_compaction = true` を指定すると、自動クリーンアップは停止しますが、増分読み取りでは期限切れのレコードが引き続き除外されます。BE の再起動後は、Master FE のハートビートから有効な基準 TSO を受け取るまでクリーンアップは待機します。

`binlog.max_bytes` と `binlog.max_history_nums` は、Row Binlog には引き続き効果がありません。書き込み量、TTL、クリーンアップの遅延を考慮してストレージを確保してください。before image を有効にした MoW テーブルでは、更新のたびに古い値のコピーが追加で保存されます。TTL は、最大取り込み遅延、更新間隔、想定される停止時間より長く設定し、復旧に必要な時間も含めてください。

## 書き込みのオーバーヘッド {#write-overhead}

<!-- Knowledge type: Performance notes -->
<!-- Use cases: Evaluating load throughput before going to production -->

Row Binlog を有効にすると、すべての書き込みで変更レコードの生成と保存が追加されます。MoW テーブルでは、before image を作るために更新と削除の際に古い値も読み取ります。ロードのスループットは目に見えて低下し、その程度はテーブルのスキーマと更新の割合によって異なります。推奨事項は次のとおりです。

- 増分取り込みが本当に必要なテーブルでのみ有効にしてください。
- 本番環境で使用する前に、実際に近い書き込みワークロードでスループットの変化を評価してください。
- `binlog.need_historical_value` は、変更前の値が不要な場合（`append_only` での取り込みや最新の値だけが必要な場合など）、有効にしないでください。

## binlog() テーブル関数を使ったトラブルシューティング {#troubleshooting-with-the-binlog-table-function}

<!-- Knowledge type: Troubleshooting -->
<!-- Use cases: Confirming whether a write produced the expected changes / Inspecting the change history of a key -->

`binlog()` テーブル関数はテーブルの生の変更レコードを返します。書き込みによって想定どおりの変更が生成されたかどうかの確認や、キーの変更履歴の調査などに使えます。

:::caution
`binlog()` は主に内部デバッグ用であり、本番環境のデータパイプラインには推奨しません。出力形式とパラメータはバージョン間で変更される可能性があります。実際の増分取り込みには [Table Stream](table-stream) または [`@incr`](incremental-query) を使ってください。
:::

```sql
SELECT __DORIS_BINLOG_OP__, __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__,
       order_id, status, amount
FROM binlog(
    "db" = "demo",
    "table" = "orders",
    "partition" = "p20260914"
)
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

| パラメータ | 必須 | 説明 |
|---|---|---|
| `table` | はい | テーブル名 |
| `db` | いいえ | データベース名。デフォルトは現在のデータベースです |
| `partition` | いいえ | カンマ区切りのパーティション名。デフォルトはすべてのパーティションです |
| `tablet` | いいえ | カンマ区切りの Tablet ID。デフォルトはすべての Tablet です |

`binlog()` は保存された生レコードを、変更の統合や TTL フィルタリングを行わずに読み取ります。`__DORIS_BINLOG_OP__` は生レコードの符号化（`0` は挿入、`1` は更新、`2` は削除）を使います。期限切れのレコードも、物理的なクリーンアップが完了するまでここに表示される場合があります。完全な構文は [BINLOG テーブル関数](../../sql-manual/sql-functions/table-valued-functions/binlog)を参照してください。

## よくあるエラー {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| エラーメッセージ | 原因 | 対処方法 |
|---|---|---|
| `Invalid binlog format value: row` | `binlog.format` に小文字を指定した | 値は大文字と小文字を区別します。大文字の `ROW` を指定してください |
| `ROW binlog.ttl_seconds must be greater than 0` | TTL が `0` または負の値である | 秒単位の正の整数を指定してください。デフォルトは `86400` です |
| `Row binlog offset has expired according to binlog.ttl_seconds` | `MIN_DELTA` の開始位置または MoW のスナップショットが保持ウィンドウの外にある | 完全なスナップショットから下流を再構築して取り込み位置を合わせてください。[読み取りへの影響](#effect-on-reads)を参照してください |
| `not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW` | 既存のテーブルで `ALTER TABLE` を使って Row Binlog を有効にしようとした | Row Binlog はテーブル作成時にのみ有効にできます。Row Binlog を有効にした新しいテーブルを作成し、データをロードした後、`ALTER TABLE ... REPLACE WITH TABLE` で二つのテーブルを入れ替えてください |
| `can't disable binlog when format is [Row]` | Row Binlog を有効にしたテーブルで `binlog.enable = false` を設定した | 一度有効にした Row Binlog は無効にできません |
| `not support change binlog.need_historical_value from true to false` | `binlog.need_historical_value` を変更した | このプロパティは作成後に変更できません |
| `Duplicate table model don't support record historical value` | Duplicate Key テーブルで `binlog.need_historical_value = true` を設定した | Duplicate Key テーブルには before image がありません。このプロパティを削除するか、before image が必要な場合は Unique Key MoW テーブルを使ってください |
| `Unique merge-on-write tables with cluster keys do not support binlog<Row>` | MoW テーブルにクラスタキーがある | クラスタキーなしでテーブルを作成してください |
| `Only duplicate and mow table model support binlog<Row>` | テーブルモデルが Aggregate Key または Unique Key Merge-on-Read である | Duplicate Key または Unique Key MoW テーブルを使ってください |
| `Not allowed to perform current operation on Table With binlog<row>` | `MODIFY COLUMN`、`RENAME COLUMN`、`ORDER BY`、`BUILD INDEX`、bloom filter プロパティの変更など、許可されていない DDL を実行した | [DDL の制限](#ddl-restrictions)にある許可操作の一覧を参照してください |
