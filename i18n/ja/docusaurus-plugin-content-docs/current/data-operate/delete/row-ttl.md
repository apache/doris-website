---
{
    "title": "行レベル TTL",
    "language": "ja",
    "description": "Apache Doris で行レベル TTL を構成し、ソースタイムスタンプまたは行ごとの期限に基づいて行を期限切れにし、保持を管理します。",
    "keywords": ["行レベル TTL", "データの有効期限", "保持", "実験的", "Compaction", "row TTL", "Time to Live", "自動データ有効期限", "行ごとの有効期限", "データ保持", "function_column.enable_row_ttl", "Doris 5.0.0"],
    "doc_type": "feature"
}
---

:::caution 実験的機能

行レベル TTL は実験的機能であり、Apache Doris 5.0.0 以降でサポートされています。採用する前にテスト環境で検証してください。

TTL はテーブルの作成時に有効にする必要があります。既存の通常テーブルで後から有効にしたり、無効にしたり、別の TTL モードに切り替えたりすることはできません。部分列更新、Sequence Columns、マテリアライズドビューには、以下で説明する制限があります。期限切れになっても、ディスク領域が直ちに解放されるとは限りません。

:::

<!-- Knowledge Type: Feature Overview -->
<!-- Use Case: Row-level Data Expiration -->
## 概要 {#overview}

行レベル TTL（Time to Live）は、各行を有効期限後に見えなくし、バックグラウンドの Compaction によって期限切れの行を回収できるようにします。同じテーブルまたはパーティション内の行に異なる有効期限が必要な場合に使用します。ネイティブの Duplicate Key テーブルと Unique Key テーブル（Merge-on-Write（MOW）および Merge-on-Read（MOR）を含む）をサポートしますが、Aggregate Key テーブルはサポートしません。

### TTL モードの選択 {#choose-a-ttl-mode}

テーブル作成時に、次の相互排他的なモードのいずれかを選択します。

| 用途 | モード | 構成 | 有効期限 |
| --- | --- | --- | --- |
| 各イベントをそのタイムスタンプから同じ期間保持する | ソース列 | TTL を有効にし、`function_column.ttl_col` と `function_column.ttl` を同時に設定 | ソースタイムスタンプ + テーブルの保持期間 |
| アプリケーションが各行に絶対期限を割り当てる | 直接有効期限 | これらのプロパティをどちらも設定せずに TTL を有効化 | `__DORIS_TTL_COL__` に書き込まれた行ごとの絶対有効期限 |

### 有効期限のルール {#expiration-rules}

- NULL のソース値または NULL の直接有効期限の場合、その行は TTL によって期限切れになりません。
- 行の有効期限が、クエリで使用される現在時刻以下になると、その行は期限切れです。
- 各クエリはスキャン全体で同じ現在時刻値を使用します。そのため、書き込みがなくても、後続のクエリで返される行が少なくなることがあります。

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Configure Source-column TTL -->
## クイックスタート {#quick-start}

### 前提条件 {#prerequisites}

- Apache Doris 5.0.0 以降を使用し、実験的機能をテスト環境で検証します。
- テーブルの作成、データロード、クエリの権限を持つアカウントでテストデータベースに接続します。
- サポートされるテーブルモデル、つまりネイティブの Duplicate Key または Unique Key（MOW/MOR）を使用します。

### テーブルを作成して有効期限を検証する {#create-a-table-and-verify-expiration}

次の例では、各イベントを `event_time` から一日間保持します。単一レプリカの設定はこの例のためのものであり、本番環境でのレプリケーション推奨値ではありません。

```sql
SET time_zone = '+00:00';
DROP TABLE IF EXISTS row_ttl_events;
CREATE TABLE row_ttl_events (
    id INT,
    event_time DATETIME(6) NULL,
    message STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "function_column.enable_row_ttl" = "true",
    "function_column.ttl_col" = "event_time",
    "function_column.ttl" = "1 day",
    "function_column.ttl_time_zone" = "+00:00"
);

INSERT INTO row_ttl_events VALUES
    (1, NOW(6) - INTERVAL 2 DAY, 'expired'),
    (2, NULL, 'persistent'),
    (3, NOW(6), 'live');

SELECT id, message FROM row_ttl_events ORDER BY id;
```

挿入直後にクエリを実行すると、次の結果が返ります。

```text
id  message
2   persistent
3   live
```

古いイベントは Compaction を待たなくてもすでに見えません。イベント時刻が NULL の行は期限切れになりません。TTL は自動的にデータロード時刻を基準にするのではなく、指定されたイベント時刻に基づきます。そのため、遅れて到着したイベントはロード直後に期限切れになることがあります。

<!-- Knowledge Type: Configuration Parameters -->
## パラメータ {#parameters}

以下の `function_column.*` プロパティはすべて、文字列値のテーブルプロパティです。

| プロパティ | デフォルト / 必須条件 | 意味と変更ルール |
| --- | --- | --- |
| `function_column.enable_row_ttl` | `false`。いずれかのモードを有効にするには `true` に設定 | ブール値の文字列。テーブル作成時にのみ設定できます。 |
| `function_column.ttl_col` | 未設定。ソース列モードでは `function_column.ttl` と同時に指定する必要があります | 既存の非生成 Value 列の名前。型は DATE/DATEV2、DATETIME/DATETIMEV2、または TIMESTAMPTZ。Key 列と TIMESTAMP_NS はサポートされません。作成後は変更できません。 |
| `function_column.ttl` | 未設定。`function_column.ttl_col` と同時に指定する必要があります | 0 以上の整数の期間。作成後は同じ期間または短い期間だけ設定できます。`0` はソースタイムスタンプでの期限切れを意味し、**TTL を無効にすることは意味しません**。直接有効期限モードでは使用できません。 |
| `function_column.ttl_time_zone` | DATE/DATETIME 系のソース列では必須。TIMESTAMPTZ ではデフォルトが `+00:00` | ソースタイムスタンプを解釈するタイムゾーン。`UTC`、`Z`、または `-12:00` から `+14:00` までの固定オフセットを `+HH:MM` / `-HH:MM` 形式で指定できます。TIMESTAMPTZ ではゼロオフセットのみ使用できます。作成後は変更できず、直接有効期限モードでは設定できません。 |

### 期間の形式 {#duration-format}

単位のない期間は秒として解釈されます。単位では大文字と小文字が区別されません。

| 単位 | 使用できる形式 |
| --- | --- |
| 週 | `week`、`weeks` |
| 日 | `day`、`days`、`d` |
| 時間 | `hour`、`hours`、`h` |
| 分 | `minute`、`minutes`、`m` |
| 秒 | `second`、`seconds`、`s` |

たとえば、`86400`、`1 day`、`24h` は同じ期間を表します。1 日は固定の 24 時間です。

- 小数、負の値、`1 day 2 hours` のような複合期間、月、年は拒否されます。
- 期間は符号付き 64 ビットのマイクロ秒に収まる必要があります。
- ソースタイムスタンプに期間を加算した値も、符号付き 64 ビットのエポックマイクロ秒の範囲に収まる必要があります。オーバーフローすると有効期限の計算に失敗します。

### タイムゾーン {#time-zones}

ソース列モードでは、`Asia/Shanghai` などの地域タイムゾーンや夏時間ルールはサポートされません。DATE 値は設定したオフセットでの午前 0 時として解釈されます。TIMESTAMPTZ 値は絶対時刻を表します。クエリセッションのタイムゾーンを変更しても、すでに保存された行の TTL ポリシーは変わりません。

### 非表示の TTL 列 {#hidden-ttl-column}

Doris は NULL を許容する非表示列 `__DORIS_TTL_COL__` を自動的に作成します。テーブルスキーマで宣言しないでください。

ソース列モードでは、Doris はソース値をこの非表示列にコピーします。ソース列を書き込むか更新し、非表示列を介して独立した有効期限を指定しないでください。

直接有効期限モードでは、非表示列は BIGINT であり、**Unix エポックからのマイクロ秒数**を格納します。秒やミリ秒ではありません。入力は次のように処理されます。

| 入力 | 直接有効期限モードでの動作 |
| --- | --- |
| 完全な INSERT 中の NULL、DEFAULT、または省略 | NULL の有効期限になり、その行は TTL によって期限切れになりません。 |
| BIGINT | エポックマイクロ秒としてそのまま使用されます。`0` と負の値は、現在の時刻でクエリするとすでに期限切れです。 |
| DATE/DATETIME 式 | SQL セッションの `time_zone` またはデータロードジョブの `timezone` を使用して、エポックマイクロ秒に変換されます。 |
| TIMESTAMPTZ 式 | エポックマイクロ秒に変換されます。値自体がすでに絶対時刻を表しています。 |
| テキスト形式の日付 | サポートされる時間型に明示的にキャストします。 |
| TIMESTAMP_NS | サポートされません。 |

確認のために、`show_hidden_columns` を有効にして非表示列を明示的に選択します。これは TTL フィルタリングを**バイパスせず**、期限切れの行を見えるようにすることもありません。

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Load and Update Row Expiration Times -->
## 例 {#examples}

### 各行に有効期限を割り当てる {#assign-an-expiration-to-each-row}

アプリケーションが各行に個別の有効期限を指定する場合は、直接有効期限モードを使用します。

```sql
SET time_zone = '+00:00';
DROP TABLE IF EXISTS row_ttl_expirations;
CREATE TABLE row_ttl_expirations (id INT, message STRING)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "function_column.enable_row_ttl" = "true"
);

INSERT INTO row_ttl_expirations(id, message, __DORIS_TTL_COL__) VALUES
    (1, 'expired', 0),
    (2, 'persistent', NULL),
    (3, 'live', NOW(6) + INTERVAL 1 DAY);
INSERT INTO row_ttl_expirations VALUES (4, 'omitted');

SELECT id, message FROM row_ttl_expirations ORDER BY id;
```

直ちにクエリを実行すると、次の結果が返ります。

```text
id  message
2   persistent
3   live
4   omitted
```

`INSERT ... SELECT` でも非表示列に時間型の式を指定でき、同じルールで変換されます。

### Stream Load で有効期限のタイムスタンプをロードする {#load-expiration-timestamps-with-stream-load}

上記の `row_ttl_expirations` テーブルを使用します。接続プレースホルダーを置き換え、データロード権限を持つアカウントを使用してください。入力には有効期限のタイムスタンプが含まれるため、列マッピングで明示的にキャストし、ロードのタイムゾーンを指定します。

```bash
curl --location-trusted -u '<user>:<password>' \
  -H 'label:row_ttl_expirations_example_1' \
  -H 'column_separator:,' \
  -H 'timezone:+00:00' \
  -H 'columns:id,message,expiration,__DORIS_TTL_COL__=cast(expiration as datetime(6))' \
  -T - 'http://<fe_host>:<http_port>/api/<database>/row_ttl_expirations/_stream_load' <<'DATA'
10,stream-live,2099-01-01 00:00:00.000000
11,stream-expired,2000-01-01 00:00:00.000000
DATA
```

ロードを繰り返す場合は新しい label を使用します。成功した応答では `Status` が `Success` になります。有効期限が切れていること自体は、その他の点で有効な入力行をロードエラーにはしません。2099 年より前に次のクエリを実行すると、行 10 のみが返ります。

```sql
SELECT id, message FROM row_ttl_expirations WHERE id >= 10 ORDER BY id;
```

```text
id  message
10  stream-live
```

入力がすでにエポックの**マイクロ秒数**である場合は、DATETIME にキャストせず、`columns:id,message,__DORIS_TTL_COL__` で直接マッピングします。

### Unique Key 行を更新する {#update-a-unique-key-row}

通常の SQL UPDATE がサポートされています。可視の行について、無関係な列を変更しても TTL 値は保持されます。ソースタイムスタンプまたは直接有効期限を変更すると、その行の期限切れ時刻が変わります。これはサポートされていない部分列更新のロードモードとは異なります。

```sql
DROP TABLE IF EXISTS row_ttl_accounts;
CREATE TABLE row_ttl_accounts (id INT, message STRING)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "function_column.enable_row_ttl" = "true"
);
INSERT INTO row_ttl_accounts(id, message, __DORIS_TTL_COL__) VALUES
    (1, 'original', 9223372036854775807);
UPDATE row_ttl_accounts SET message = 'updated' WHERE id = 1;

SET show_hidden_columns = true;
SELECT id, message, __DORIS_TTL_COL__ FROM row_ttl_accounts ORDER BY id;
SET show_hidden_columns = false;
```

```text
id  message  __DORIS_TTL_COL__
1   updated  9223372036854775807
```

完全な行の UPSERT は行全体を置き換えます。そのため、直接有効期限モードで有効期限を省略すると、古い有効期限がクリアされます。

```sql
INSERT INTO row_ttl_accounts(id, message) VALUES (1, 'replaced');
SET show_hidden_columns = true;
SELECT id, message, __DORIS_TTL_COL__ FROM row_ttl_accounts ORDER BY id;
SET show_hidden_columns = false;
```

```text
id  message   __DORIS_TTL_COL__
1   replaced  NULL
```

更新時は、次のルールに注意してください。

- ソース列モードで完全な行の INSERT がソース列を省略すると、前の行のタイムスタンプではなく、その列の通常のデフォルト値または NULL のルールが使用されます。
- 通常のクエリでは、すでに期限切れになった行を UPDATE で見つけることはできません。必要な値を含む完全な INSERT を使用して、新しいバージョンを書き込んでください。
- Unique Key テーブルでは、最新バージョンが期限切れになっても、同じキーの古いバージョンが再び見えるようにはなりません。

### 保持期間を短縮する {#shorten-retention}

クイックスタートのソース列テーブルと ALTER 権限を持つアカウントを使用します。

```sql
ALTER TABLE row_ttl_events SET ("function_column.ttl" = "12 hours");
SHOW CREATE TABLE row_ttl_events;
```

新しい保持期間は、既存のソース値と今後の書き込みの両方に適用されます。`SHOW CREATE TABLE` には更新された `function_column.ttl` プロパティが表示されます。単位のない整数で表示される期間の単位は秒です。

新しいポリシーで保持期間を超えた行は、そのポリシーを使用するクエリから見えなくなり、回収対象になります。同じ期間を再度設定することはできますが、以前に期限切れとなったデータがすでに回収されている可能性があるため、期間を延長することはできません。

:::caution ALTER の失敗はロールバックを意味しない

短いクエリポリシーは、回収設定が配布される前に永続化されます。そのため、ALTER がタイムアウト、構成バージョンの確認不足、または同時実行されたテーブル変更を報告した場合でも、短い保持期間が適用済みになっている可能性があります。

`SHOW CREATE TABLE` を確認し、報告された問題を解決してから、同じ期間で再試行してポリシーを同期してください。以前の長い期間に戻そうとしないでください。

:::

<!-- Knowledge Type: Feature Constraints -->
## 制限事項 {#limitations}

TTL を有効にする前に、既存のテーブル機能とワークロードとの互換性を確認してください。

| 領域 | 現在の動作 / 制限 |
| --- | --- |
| テーブルモデル | ネイティブの Duplicate Key および Unique Key（MOW/MOR）テーブルのみ。Aggregate Key は拒否されます。 |
| 有効化とモード変更 | CREATE TABLE の時点でのみ有効化できます。ALTER で TTL の有効化・無効化、ソースまたはタイムゾーンの変更、モードの切り替えはできません。`ENABLE FEATURE "ROW_TTL"` はサポートされません。短縮できるのはソース列の保持期間だけです。 |
| Sequence Column | 行レベル TTL と共存できません。作成後に `SEQUENCE_LOAD` を有効化する場合も同様です。 |
| スキーマ変更 | TTL ソース列または非表示列の削除・変更、ソース列の名前変更はできません。無関係な列の変更には通常のスキーマ変更ルールが適用されます。 |
| 部分列更新 | どちらの TTL モードでもサポートされません。`enable_unique_key_partial_update = true` を指定した INSERT、Stream Load の `partial_columns = true`、`UPDATE_FIXED_COLUMNS`、`UPDATE_FLEXIBLE_COLUMNS` が含まれます。リクエストに TTL 値を指定してもサポートされません。完全な UPSERT、通常の SQL UPDATE、DELETE は、それぞれの通常のテーブルモデルルールに従って引き続き使用できます。 |
| マテリアライズドビュー | TTL テーブルに対する同期マテリアライズドビューの `CREATE MATERIALIZED VIEW` は拒否されます。非同期マテリアライズドビューでは TTL テーブルを基底テーブルにできません。これは通常の `ALTER TABLE ... ADD ROLLUP` とは異なり、後者はサポートされ、TTL の非表示列は Doris によって維持されます。 |
| 履歴および増分アクセス | TTL テーブルでは `FOR VERSION AS OF`、`FOR TIME AS OF`、`@incr(...)`、`CREATE STREAM ... ON TABLE` はサポートされません。 |
| クエリヒント | `PREAGGOPEN` は拒否されます。MOR スキャンでは、バージョンマージと有効期限のセマンティクスを維持するため、ストレージの事前集計が無効になります。 |
| クエリ性能 | TTL スキャンでは SQL Cache、Query Cache、ショートサーキットポイントクエリ、一部の TopN プッシュダウンが無効になります。ポイントルックアップ、集計、結合、ORDER BY/LIMIT は引き続き動作しますが、TTL なしのテーブルと同じ実行計画や性能を想定しないでください。 |
| 整合性チェック | 自動チェックサム整合性チェックでは TTL テーブルがスキップされます。TTL Tablet に対する明示的なチェックサム整合性チェックは拒否されます。これは通常のレプリケーションを無効にするものではありません。 |

<!-- Knowledge Type: Data Reclamation Behavior -->
## 物理回収の境界 {#physical-reclamation-boundaries}

TTL による可視性はクエリ中に確認されます。ディスクからの回収は、対象となるバックグラウンド Compaction と、その後の不要ファイルのクリーンアップに依存します。テーブルがアイドル状態である場合、Compaction が遅延している場合、または古いファイルが保持されている場合、期限切れデータがディスクに残ることがあります。固定された削除期限はありません。

回収動作は、テーブルモデルと Compaction パスによって異なります。

| テーブルモデル / データパス | 回収動作 |
| --- | --- |
| Duplicate Key | サポートされる Segment、Cumulative、Base、Full Compaction パスで期限切れの行を回収できます。 |
| Unique Key MOW | Cumulative、Base、Full Compaction で公開済み Rowset の期限切れ行を回収できます。公開前の Segment Compaction では、書き込み競合の解決のため、期限切れのキーが保持されます。 |
| Unique Key MOR | Full Compaction、またはバージョン 0 以降のバージョンを対象とする Base Compaction でのみ期限切れ行を回収します。そのため、同じキーの古いバージョンが現れることはありません。 |
| コールドデータ Compaction | 行 TTL の回収は実行しません。 |
| Changelog Tablet | ログエントリを削除するために行 TTL を適用しません。Raw Changelog には、基底テーブルの行が期限切れになった後も書き込みが残ることがあります。その保持期間は別に管理されます。 |

行 TTL は、有効期限の時点ですべてのコピーや変更レコードが消去されることを保証しません。

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Resolve TTL Configuration Errors and Reclamation Delays -->
## トラブルシューティング {#error-handling}

構成エラーやストレージ回収の遅延には、次の確認を行います。

| エラー / 症状 | 対処 |
| --- | --- |
| `function_column.ttl_col and function_column.ttl must be set together` | ソース列モードでは両方を指定し、直接有効期限モードでは両方を省略します。 |
| `function_column.ttl_time_zone is required` | DATE/DATETIME ソース列に固定オフセットを明示的に設定します。 |
| `row ttl column must be a value column` | サポートされる時間型の Value 列を選択し、Key 列は使用しません。 |
| `Partial update is not supported on tables with row TTL` | 省略した列に意図したデフォルト値が適用されることを確認した完全な UPSERT、または通常の SQL UPDATE を使用します。省略値を確認せずに部分更新設定を単に削除しないでください。 |
| `Increasing function_column.ttl is not supported` | 期間を維持するか短縮します。より長い保持が必要な場合は、新しいテーブルを計画し、保持されているソースから再ロードしてください。TTL では回収済みデータを復元できません。 |
| `TTL properties can only be specified when creating a table` | ALTER で有効化フラグ、ソース、タイムゾーンを変更しないでください。ソース列 TTL テーブルで変更できるのは `function_column.ttl` だけです。 |
| 行が消えるがストレージサイズが減少しない | Compaction の進行状況と上記の回収境界を確認します。有効期限と物理削除は別の段階です。 |

<!-- Knowledge Type: Architecture Decision -->
## ベストプラクティス {#best-practices}

- 各イベント後に一定期間保持する場合はソース列モードを選択し、アプリケーションが行ごとに絶対期限を割り当てる場合は直接有効期限モードを選択します。ロード前に、遅れて到着するタイムスタンプと NULL 値を確認してください。
- 保持期間が自然に時間パーティション全体に従う場合は、[動的パーティショニング](../../table-design/data-partitioning/dynamic-partitioning)を優先します。行 TTL はより細かな粒度に適していますが、行ごとのフィルタリングが追加され、一部のクエリ最適化が制限されます。
- 採用前に、実際のデータロード、更新、クエリ、Compaction のワークロードをテストします。特に、部分列更新、Sequence Columns、マテリアライズドビュー、履歴クエリ、キャッシュへの依存を確認してください。
- 保持期間を短縮する前に、意図したカットオフを確認し、復元が必要なデータをこの TTL ポリシーの外部に保持します。通常のクエリで可視性を検証し、ディスク使用量や非表示列の確認を、有効期限や完全消去の証拠とみなさないでください。
