---
{
    "title": "読み書き分離とプライマリ／スタンバイクラスターの File Cache ウォームアップ設定ガイド",
    "sidebar_label": "読み書き分離：File Cache ウォームアップ",
    "language": "ja",
    "description": "読み書き分離とプライマリ／スタンバイ構成における Doris File Cache のアクティブな増分ウォームアップの仕組みを説明します。コンピュートグループ単位とテーブル単位のイベント駆動ウォームアップ、ジョブの作成、状態の確認、メトリクス、トラブルシューティングを扱います。",
    "keywords": ["読み書き分離", "プライマリ／スタンバイクラスター", "File Cache ウォームアップ", "アクティブな増分ウォームアップ", "テーブル単位のウォームアップ", "ON TABLES", "コンピュートグループの同期", "高可用性"]
}
---

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Read/write separation deployment / Primary/standby cluster high availability / File Cache warm-up -->

## 背景と適用シナリオ

Apache Doris のコンピュートとストレージを分離した構成では、複数のコンピュートグループが同じリモートストレージのデータを共有できます。書き込み用コンピュートグループはデータの取り込み、Compaction、Schema Change を処理し、クエリ用コンピュートグループはオンラインクエリを処理します。新しい Rowset の生成後、クエリ用コンピュートグループが対応するファイルをローカルの File Cache に読み込んでいない場合、最初のクエリはオブジェクトストレージまたは HDFS にアクセスする必要があり、クエリのレイテンシーが変動する可能性があります。

File Cache のアクティブな増分ウォームアップは、書き込み側で新しいデータが生成された後、関連する Segment ファイルとインデックスファイルを対象コンピュートグループのローカルキャッシュに事前に読み込みます。主に次のシナリオに適しています。

| シナリオ | 説明 | 利点 |
|------|------|----------|
| 読み書き分離 | 書き込み用コンピュートグループが継続的にデータを取り込み、クエリ用コンピュートグループはクエリのみを処理する | クエリ用コンピュートグループが新しいデータを読み取る際のキャッシュミスを減らす |
| プライマリ／スタンバイクラスターの高可用性 | スタンバイ側のコンピュートグループがプライマリ側のコンピュートグループからホットデータを継続的に同期する | フェイルオーバー後のコールドキャッシュからの復旧時間を短縮する |
| マルチテナントまたは階層型データウェアハウス | クエリ用コンピュートグループごとに、業務テーブルの一部だけにアクセスする | テーブル単位のフィルタリングにより、不要なウォームアップとキャッシュ使用量を減らす |
| コストの最適化 | ソースコンピュートグループには多数のテーブルがあるが、頻繁に実行されるクエリは一部のテーブルに集中する | リモートストレージからの読み取りとネットワーク転送を減らす |

:::tip バージョン情報
このドキュメントでは、File Cache のアクティブな増分ウォームアップと、テーブル単位でフィルタリングする `ON TABLES` 機能について説明します。対応する正確なバージョンは、該当バージョンのリリースノートと SQL 構文ドキュメントを参照してください。
:::

## 機能の概要

File Cache のアクティブなウォームアップは、次の三つの同期モードをサポートします。

| 同期モード | プロパティ値 | 適用シナリオ |
|------|--------|----------|
| 一度限りの同期 | `once` | 新しいコンピュートグループの稼働開始時に初期ウォームアップを手動で実行する |
| 定期同期 | `periodic` | 一定の間隔でホットデータを同期し、キャッシュを継続的に温めておく |
| イベント駆動同期 | `event_driven` | Load、Compaction、Schema Change 中に生成されたデータを自動的にウォームアップする |

イベント駆動同期は、次の二つの範囲に適用できます。

| 範囲 | 構文形式 | 説明 |
|------|----------|------|
| コンピュートグループ単位のイベント駆動ウォームアップ | `ON TABLES` なし | ソースコンピュートグループで、一致するイベントによって生成された新しいデータがウォームアップをトリガーする |
| テーブル単位のイベント駆動ウォームアップ | `ON TABLES (...)` あり | ルールに一致するテーブルの新しいデータだけがウォームアップをトリガーする |

テーブル単位のイベント駆動ウォームアップは、クエリ用コンピュートグループが主要テーブルの一部だけを必要とする場合に適しています。コンピュートグループ単位のウォームアップと比べ、対象コンピュートグループでの不要なリモート読み取り、ネットワーク転送、キャッシュ使用量を減らせます。

## ウォームアップジョブの作成

### 一度限りの同期

一度限りの同期は、新しいコンピュートグループの稼働開始時に初期ウォームアップを行う場合に適しています。

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>;
```

### 定期同期

定期同期は、ホットデータの同期を継続的に維持する場合に適しています。

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);
```

`sync_interval_sec` は同期間隔を秒単位で指定します。デフォルト値は `600` です。

### コンピュートグループ単位のイベント駆動ウォームアップ

コンピュートグループ単位のイベント駆動ウォームアップは、読み書き分離のシナリオに適しています。ソースコンピュートグループの書き込みイベントを監視し、Load、Compaction、Schema Change 中に生成されたデータを対象コンピュートグループに事前に読み込みます。

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

- `sync_event`：イベント駆動ウォームアップジョブを作成する場合は、このパラメータを `load` に設定します。

### テーブル単位のイベント駆動ウォームアップ

テーブル単位のイベント駆動ウォームアップでは、コンピュートグループ単位のイベント駆動ウォームアップに `ON TABLES` 句を追加し、ウォームアップ対象のテーブル範囲を指定します。

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
ON TABLES (
    INCLUDE '<database_pattern>.<table_pattern>'
    [, INCLUDE '<database_pattern>.<table_pattern>' ...]
    [, EXCLUDE '<database_pattern>.<table_pattern>' ...]
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

パラメータの説明：

| パラメータ | 必須 | 説明 |
|------|----------|------|
| `<target_compute_group>` | はい | 対象コンピュートグループの名前。一致したテーブルの新しいデータは、このコンピュートグループのローカル File Cache にウォームアップされます |
| `<source_compute_group>` | はい | ソースコンピュートグループの名前。Doris はこのコンピュートグループの書き込みイベントを監視します |
| `ON TABLES` | いいえ | テーブル単位のフィルタリングルール。省略すると、コンピュートグループ単位のイベント駆動ウォームアップジョブになります |
| `INCLUDE` | `ON TABLES` を使用する場合は必須 | ウォームアップ範囲に含めるテーブルパターンを指定します。少なくとも一つの `INCLUDE` ルールが必要です |
| `EXCLUDE` | いいえ | `INCLUDE` の結果からテーブルパターンを除外します |
| `sync_mode` | はい | テーブル単位のイベント駆動ウォームアップでは `event_driven` を使用します |
| `sync_event` | はい | テーブル単位のイベント駆動ウォームアップでは、現在 `load` イベントを使用します |

:::caution 注意
同じソースコンピュートグループと対象コンピュートグループに対して、コンピュートグループ単位の `load` イベント駆動ウォームアップと、テーブル単位の `ON TABLES` イベント駆動ウォームアップを同時に設定しないでください。両者の意味は重複しており、Doris はジョブ作成時に競合する設定を拒否します。コンピュートグループ単位からテーブル単位のウォームアップに切り替えるには、先に古いジョブをキャンセルしてから、新しい `ON TABLES` ジョブを作成します。
:::

## ON TABLES のマッチングルール

### パターンの形式

`ON TABLES` のパターンは `'database.table'` 形式を使用し、単一引用符で囲む必要があります。次のワイルドカードを使用できます。

| ワイルドカード | 意味 | 例 |
|--------|------|------|
| `*` | 空文字列を含む任意の長さの文字列に一致する | `'ods.*'` は `ods` データベース内のすべてのテーブルに一致する |
| `?` | 任意の一文字に一致する | `'logs.access_202?'` は `logs.access_2020` から `logs.access_2029` までに一致する |

ワイルドカードを使わないパターンは完全一致です。たとえば、`'sales.orders'` は `orders` テーブルのうち、`sales` データベースにあるものだけに一致します。

よく使うパターンの例：

| パターン | 意味 |
|------|------|
| `'mydb.*'` | `mydb` データベース内のすべてのテーブルに一致する |
| `'*.orders'` | すべてのデータベースにある `orders` という名前のテーブルに一致する |
| `'dw.fact_*'` | 名前が `fact_` で始まるテーブルのうち、`dw` データベースにあるものに一致する |
| `'*.*_bak'` | すべてのデータベースにある、名前が `_bak` で終わるテーブルに一致する |
| `'sales.orders'` | `sales.orders` に完全一致する |

### INCLUDE と EXCLUDE

Doris は最終的なウォームアップ範囲を次のように計算します。

```text
Final warm-up scope = tables matched by all INCLUDE rules - tables matched by all EXCLUDE rules
```

ルール：

- `INCLUDE` と `EXCLUDE` ルールの順序は、最終結果に影響しません。
- 少なくとも一つの `INCLUDE` ルールが必要です。`EXCLUDE` だけは指定できません。
- 複数の `INCLUDE` ルールは和集合として扱われます。
- 複数の `EXCLUDE` ルールは、候補集合から一致するテーブルを除外します。
- マッチングは Doris のデータベース名とテーブル名の命名規則に従います。実際のデータベース名とテーブル名と同じ大文字・小文字を使用してください。

例：

```sql
WARM UP COMPUTE GROUP analytics_cg WITH COMPUTE GROUP write_cg
ON TABLES (
    INCLUDE 'ods.*',
    INCLUDE 'dw.fact_*',
    INCLUDE 'dw.dim_*',
    EXCLUDE 'ods.tmp_*',
    EXCLUDE '*.*_bak'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

この例では、次のテーブルがウォームアップされます。

- `ods` データベース内の、名前が `tmp_` で始まるテーブルを除くテーブル。
- `dw` データベース内の、名前が `fact_` または `dim_` で始まるテーブル。
- どのデータベースでも、名前が `_bak` で終わるバックアップテーブルは対象外です。

### マテリアライズドビュー

`ON TABLES` ルールは、通常のテーブルと非同期マテリアライズドビューの両方に一致します。非同期マテリアライズドビューはデータベースの名前空間内に独立したテーブルとして存在し、`INCLUDE` と `EXCLUDE` ルールによって名前で照合されます。

同期マテリアライズドビュー（Rollup）はベーステーブルの内部インデックスであり、独立したテーブルではありません。ベーステーブルがウォームアップされると、その同期マテリアライズドビューに関連するデータもベーステーブルと一緒に処理されるため、別のルールは不要です。

## 例

### 特定のテーブルをウォームアップする

```sql
WARM UP COMPUTE GROUP report_cg WITH COMPUTE GROUP business_cg
ON TABLES (
    INCLUDE 'sales.orders',
    INCLUDE 'sales.customers',
    INCLUDE 'inventory.stock_level'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### データベース全体をウォームアップする

```sql
WARM UP COMPUTE GROUP analytics_cg WITH COMPUTE GROUP load_cg
ON TABLES (
    INCLUDE 'analytics_db.*'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 複数のデータベースをウォームアップし、一時テーブルを除外する

```sql
WARM UP COMPUTE GROUP query_cg WITH COMPUTE GROUP etl_cg
ON TABLES (
    INCLUDE 'ods.*',
    INCLUDE 'dwd.*',
    INCLUDE 'dws.*',
    EXCLUDE '*.tmp_*',
    EXCLUDE '*.*_backup'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 同じテーブルを複数の対象コンピュートグループにウォームアップする

同じテーブルを複数のクエリ用コンピュートグループで使用する必要がある場合は、対象コンピュートグループごとに一つずつジョブを作成します。

```sql
WARM UP COMPUTE GROUP realtime_cg WITH COMPUTE GROUP write_cg
ON TABLES (INCLUDE 'sales.orders')
PROPERTIES ("sync_mode" = "event_driven", "sync_event" = "load");

WARM UP COMPUTE GROUP batch_cg WITH COMPUTE GROUP write_cg
ON TABLES (INCLUDE 'sales.orders')
PROPERTIES ("sync_mode" = "event_driven", "sync_event" = "load");
```

## ウォームアップジョブの管理

### ジョブの表示

すべてのウォームアップジョブを表示します。

```sql
SHOW WARM UP JOB;
```

特定のジョブを表示します。

```sql
SHOW WARM UP JOB WHERE id = <job_id>;
```

フィールドの説明：

| フィールド | 説明 |
|--------|------|
| `JobId` | ウォームアップジョブの一意の ID |
| `SrcComputeGroup` | ソースコンピュートグループの名前 |
| `DstComputeGroup` | 対象コンピュートグループの名前 |
| `Status` | ジョブの状態。`PENDING`、`RUNNING`、`FINISHED`、`CANCELLED` など |
| `Type` | ウォームアップ範囲。`CLUSTER` はコンピュートグループ単位、`TABLE` は明示的に指定したテーブル、`TABLES` は `ON TABLES` ルールで一致したテーブルを意味します |
| `SyncMode` | 同期モード。`ONCE`、`PERIODIC(interval_sec)`、`EVENT_DRIVEN(event)` など |
| `CreateTime` | ジョブの作成時刻 |
| `StartTime` | 直近の開始時刻 |
| `FinishBatch` | 完了したバッチの数 |
| `AllBatch` | バッチの総数 |
| `FinishTime` | 直近の終了時刻。イベント駆動ジョブは通常、実行状態を維持します |
| `ErrMsg` | 直近のエラーメッセージ。エラーがなければ空です |
| `Tables` | 明示的なテーブル一覧。主に一度限り、または定期的なテーブル単位のウォームアップで使用します |
| `TableFilter` | `ON TABLES` ルールの正規化された表現。コンピュートグループ単位のジョブでは空です |
| `MatchedTables` | 現在一致しているテーブル名の一覧。定期的な更新により、テーブルの作成、削除、名前変更が反映されます |
| `SyncStats` | イベント駆動ジョブの同期進捗。一覧クエリでは概要を、ID を指定したクエリでは詳細な JSON を表示します |

`SHOW WARM UP JOB` は日常的な確認に適しています。表示する一覧が横に広がりすぎないよう、`SyncStats` には直近 30 分間の概要が表示されます。

```json
{
  "window": "30m",
  "src_size": "58.2mb",
  "dst_size": "57.5mb",
  "gap_size": "716kb",
  "trigger_gap_ms": 1200
}
```

ジョブ ID を指定して照会すると、`SyncStats` には 5 分、30 分、1 時間のウィンドウごとの詳細なメトリクスが表示されます。

```sql
SHOW WARM UP JOB WHERE id = <job_id>;
```

`SyncStats` の例：

```json
{
  "seg_num": {
    "requested_5m": 42,
    "finish_5m": 40,
    "gap_5m": 2,
    "fail_5m": 0,
    "requested_30m": 180,
    "finish_30m": 178,
    "gap_30m": 2,
    "fail_30m": 0,
    "requested_1h": 320,
    "finish_1h": 318,
    "gap_1h": 2,
    "fail_1h": 0
  },
  "seg_size": {
    "requested_5m": "12.5mb",
    "finish_5m": "11.8mb",
    "gap_5m": "716kb",
    "fail_5m": "0b",
    "requested_30m": "58.2mb",
    "finish_30m": "57.5mb",
    "gap_30m": "716kb",
    "fail_30m": "0b",
    "requested_1h": "102.3mb",
    "finish_1h": "101.6mb",
    "gap_1h": "716kb",
    "fail_1h": "0b"
  },
  "idx_num": {
    "requested_5m": 10,
    "finish_5m": 10,
    "gap_5m": 0,
    "fail_5m": 0
  },
  "idx_size": {
    "requested_5m": "2.1mb",
    "finish_5m": "2.1mb",
    "gap_5m": "0b",
    "fail_5m": "0b"
  },
  "last_trigger_ts": "2026-08-11 14:32:15",
  "last_finish_ts": "2026-08-11 14:32:18",
  "progress_trigger_ts": "2026-08-11 14:32:14",
  "trigger_gap_ms": 1000
}
```

次のフィールドに注目してください。

| フィールド | 説明 |
|------|------|
| `requested_*` | ソースコンピュートグループが送信したウォームアップ要求の量 |
| `finish_*` | 対象コンピュートグループで完了したウォームアップ処理の量 |
| `gap_*` | 未完了の量を示す差分 |
| `fail_*` | 対象コンピュートグループで失敗したウォームアップ処理の量 |
| `last_trigger_ts` | 直近にウォームアップがトリガーされた時刻 |
| `progress_trigger_ts` | 対象コンピュートグループの現在の進捗に対応する、上流側のトリガー時刻 |
| `last_finish_ts` | 直近にウォームアップが完了した時刻 |
| `trigger_gap_ms` | ソース側の最新トリガー時刻と対象側の進捗ウォーターマークとの差。単位はミリ秒 |

:::info バージョンに関する注意（4.0.8）

バージョン 4.0.8 以降、三つの時刻フィールド `last_trigger_ts`、`last_finish_ts`、`progress_trigger_ts` の形式が `HH:mm:ss` から `yyyy-MM-dd HH:mm:ss` に変更され、日付も含まれるようになりました。それ以前は時刻のみが表示され、日付をまたぐ場合に日付が曖昧でした。

これらのフィールドを固定の形式で解析するスクリプトは、4.0.8 にアップグレードする前に調整してください。

:::

### ジョブのキャンセル

```sql
CANCEL WARM UP JOB WHERE id = <job_id>;
```

キャンセルすると、Doris はこのジョブのイベント監視とウォームアップのトリガーを停止します。対象コンピュートグループの File Cache に書き込まれたデータは積極的には削除されず、通常のキャッシュ退避ポリシーに従って解放されます。

現在のバージョンでは、既存ジョブの `ON TABLES` ルールを直接変更することはできません。ウォームアップ範囲を調整するには、先に古いジョブをキャンセルしてから新しいジョブを作成します。

## マッチングの更新と動作上の注意

### テーブルの作成、削除、名前変更

`ON TABLES` ルールはジョブの作成時に評価され、ジョブの実行中にも定期的に再評価されます。デフォルトの更新間隔は 60 秒です。

これにより、次のように動作します。

- ジョブ作成後に新しいテーブルが作成され、その名前がルールに一致する場合、後続の更新サイクルでウォームアップ範囲に自動的に含まれます。
- 一致していたテーブルが削除されると、後続の更新サイクルで `MatchedTables` から削除されます。
- 一致していたテーブルの名前が変更された場合、ウォームアップが継続するかどうかは、新しい名前がルールに引き続き一致するかどうかによります。

新しいテーブルの作成から次のルール更新まで、最大 60 秒の遅延が生じることがあります。この間に新しいテーブルへ書き込んでも、このテーブル単位のジョブはトリガーされません。更新後の書き込みでは通常どおりウォームアップがトリガーされます。

### 作成時に一致するテーブルがない場合

テーブル単位のイベント駆動ウォームアップジョブを作成する際、`ON TABLES` ルールは既存のテーブルに少なくとも一つ一致する必要があります。一致するテーブルがない場合、ジョブの作成は失敗します。データベース名、テーブル名、ワイルドカードのパターンを確認してください。

ウォームアップの関係を事前に設定したい場合は、ウォームアップジョブを作成する前に、ルールに一致するテーブルを少なくとも一つ作成してください。

### Schema Change

`ON TABLES` はテーブルの集合のみを決定し、イベントの種類自体が持つトリガーの意味は変更しません。現在のジョブで設定され、現在のバージョンでサポートされるイベントの種類について、新しく生成されたデータはテーブルのマッチング結果に従って処理されます。ジョブに `sync_event = "load"` が設定されている場合は、対応する Load イベントだけを監視します。

## 動作の仕組み

### 定期同期の実行フロー

1. FE がジョブを登録し、同期間隔を記録します。
2. FE がトリガー時刻に達したかどうかを定期的に確認します。
3. トリガー時刻に達すると、FE は対象のテーブルまたはパーティションを対応する Tablet に変換し、タスクを配布します。
4. BE はリモートストレージからファイルを読み取り、対象コンピュートグループの File Cache に書き込みます。

### イベント駆動同期の実行フロー

1. ユーザーがイベント駆動ジョブを作成し、FE が同期関係を永続化します。
2. FE がイベント駆動の設定をソースコンピュートグループの BE に送信します。
3. ソースコンピュートグループの BE が、書き込みイベントのコミット後にウォームアップをトリガーします。
4. テーブル単位のイベント駆動ジョブでは、ソース BE は現在一致しているテーブル集合に属する Rowset だけを処理します。
5. 対象コンピュートグループの BE が対応する Segment ファイルとインデックスファイルをダウンロードし、ローカルの File Cache に書き込みます。
6. FE が `SHOW WARM UP JOB` と FE メトリクスを通じて、ジョブの状態と同期進捗を公開します。

## メトリクスによる監視

### SQL による確認

ウォームアップの進捗を確認する最も直接的な方法は、`SHOW WARM UP JOB` を使用することです。

```sql
SHOW WARM UP JOB;
SHOW WARM UP JOB WHERE id = <job_id>;
```

確認の目安：

- `gap_size` または詳細な `gap_*` が継続的に 0 に近づいている場合、対象コンピュートグループは概ねソースコンピュートグループの書き込み速度に追いついています。
- `trigger_gap_ms` が 0 に近づいている場合、対象コンピュートグループはソースコンピュートグループの最新のトリガーイベントに追いついています。
- `fail_*` が 0 より大きい場合は、ディスク容量の問題、リモートストレージへのアクセス失敗、ネットワークエラーがないか BE のログを確認してください。
- 5 分間のウィンドウはリアルタイムの変動、30 分間と 1 時間のウィンドウは継続的な傾向の確認に役立ちます。

### BE の Bvar メトリクス

`SHOW WARM UP JOB` と FE の `/metrics` に加え、BE の Bvar ページを使用して、個々の BE におけるウォームアップ実行メトリクスを確認できます。

```bash
curl http://<be_host>:<brpc_port>/vars
```

定期ジョブの BE 側メトリクス：

| メトリクス名 | 意味 |
|----------|------|
| `file_cache_once_or_periodic_warm_up_submitted_segment_size` | 送信したセグメントデータのサイズ |
| `file_cache_once_or_periodic_warm_up_finished_segment_size` | 完了したセグメントデータのサイズ |
| `file_cache_once_or_periodic_warm_up_submitted_index_num` | 送信したインデックスの数 |
| `file_cache_once_or_periodic_warm_up_finished_index_num` | 完了したインデックスの数 |

イベント駆動ジョブにおけるソース BE のメトリクス：

| メトリクス名 | 意味 |
|----------|------|
| `file_cache_event_driven_warm_up_requested_segment_size` | 同期を要求したセグメントデータのサイズ |
| `file_cache_event_driven_warm_up_requested_index_num` | 同期を要求したインデックスの数 |
| `file_cache_warm_up_rowset_last_call_unix_ts` | 最後に開始した同期要求のタイムスタンプ |

イベント駆動ジョブにおける対象 BE のメトリクス：

| メトリクス名 | 意味 |
|----------|------|
| `file_cache_event_driven_warm_up_submitted_segment_num` | 受信したセグメントの数 |
| `file_cache_event_driven_warm_up_finished_segment_num` | ウォームアップが完了したセグメントの数 |
| `file_cache_warm_up_rowset_last_handle_unix_ts` | 最後に処理した同期要求のタイムスタンプ |

これらのメトリクスは個々の BE の実行状況を反映します。BE がウォームアップ要求を受信したか、ダウンロードを完了したか、最近要求を開始または処理したかを確認する際に役立ちます。複数の BE にまたがるジョブ単位の集計には、`SHOW WARM UP JOB WHERE id = <job_id>` または FE の Prometheus メトリクスを使用してください。

### FE の Prometheus メトリクス

クラウドモードでは、FE が BE からイベント駆動ウォームアップの進捗を定期的に取得して集計します。デフォルトの更新間隔は 15 秒です。この間隔は FE の設定項目 `cloud_warm_up_sync_stats_refresh_interval_ms` で制御され、デフォルト値は `15000` ミリ秒です。

FE の `/metrics` から次のメトリクスを収集できます。

| メトリクス名 | 説明 |
|--------|------|
| `doris_fe_file_cache_warm_up_sync_job_info` | ジョブのメタデータ。値は常に 1 です。ラベルには `job_id`、`job_type`、`sync_mode`、`sync_event`、`job_state`、ソースおよび対象コンピュートグループが含まれます |
| `doris_fe_file_cache_warm_up_sync_job_size_bytes` | ソース側が送信し、対象側が完了したウォームアップの合計サイズ。単位はバイトです。`side` ラベルと `window` ラベルが含まれます |
| `doris_fe_file_cache_warm_up_sync_job_trigger_gap_ms` | ソース側の最新トリガー時刻と対象側の進捗ウォーターマークとの差。単位はミリ秒です |

よく使う PromQL の例：

```promql
# Total warm-up size submitted by the source side in the last 5 minutes for each job
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="src",window="5m"}

# Total warm-up size completed by the target side in the last 5 minutes for each job
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="dst",window="5m"}

# Sync size gap in the last 5 minutes for each job
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="src",window="5m"}
  - ignoring(side)
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="dst",window="5m"}

# Trigger progress time gap for each job
doris_fe_file_cache_warm_up_sync_job_trigger_gap_ms
```

`ignoring(side)` は Prometheus に対し、ソースと対象のサイズ系列の差を計算するときに `side` ラベルを無視するよう指定します。これにより、同じジョブとウィンドウに属する `src` 系列と `dst` 系列を対応付けられます。

## 一連の操作手順

1. 現在のコンピュートグループを表示し、ソースと対象のコンピュートグループ名を確認します。

    ```sql
    SHOW COMPUTE GROUPS;
    ```

2. ウォームアップが必要なテーブルの範囲を確認します。

    ```sql
    SHOW TABLES FROM ods;
    SHOW TABLES FROM dw;
    ```

3. テーブル単位のイベント駆動ウォームアップジョブを作成します。

    ```sql
    WARM UP COMPUTE GROUP read_cg WITH COMPUTE GROUP write_cg
    ON TABLES (
        INCLUDE 'ods.*',
        INCLUDE 'dw.fact_*',
        EXCLUDE 'ods.tmp_*'
    )
    PROPERTIES (
        "sync_mode" = "event_driven",
        "sync_event" = "load"
    );
    ```

4. ジョブの状態と一致したテーブルを確認します。

    ```sql
    SHOW WARM UP JOB;
    ```

5. データを書き込んだ後、同期の進捗を確認します。

    ```sql
    SHOW WARM UP JOB WHERE id = <job_id>;
    ```

6. ルールを調整するには、古いジョブをキャンセルして新しいジョブを作成します。

    ```sql
    CANCEL WARM UP JOB WHERE id = <job_id>;
    ```

## ベストプラクティス

- クエリ用コンピュートグループが少数の主要テーブルだけにアクセスする場合は、コンピュートグループ単位のウォームアップによる過剰なキャッシュ使用を避けるため、テーブル単位のイベント駆動ウォームアップを選択してください。
- テーブル名の命名規則が明確なデータウェアハウスでは、`INCLUDE 'dws.*'`、`INCLUDE 'ads.*'`、`EXCLUDE '*.tmp_*'` のようなルールを使うと管理しやすくなります。
- 複数のジョブで同じホットテーブルを対象にすることは避けてください。対象側で可能な限り重複ダウンロードを回避できても、ジョブ管理とメトリクスの解釈が複雑になります。
- ウォームアップ範囲を変更するには、ジョブをキャンセルして再作成します。既存ジョブのルールが自動的に変更されることはありません。
- 個々のジョブの詳細には `SHOW WARM UP JOB` を使用し、長期的な傾向の監視には Grafana で FE の Prometheus メトリクスを使用してください。

## FAQ

**Q: ある回の同期に失敗すると、ジョブ全体がキャンセルされますか？**

いいえ。その回の同期に失敗しても、その実行がスキップされるだけです。ジョブの状態は変わらず、以降のサイクルでも再試行が続きます。`SHOW WARM UP JOB WHERE id = <job_id>` を実行して `ErrMsg` と `SyncStats` の失敗数を確認し、根本原因を調べるために BE のログを確認してください。

**Q: 定期ジョブの実行がタイムアウトするとどうなりますか？**

タイムアウトすると、その回の実行はスキップされます。ジョブ自体は削除されず、次のサイクルは通常どおりトリガーされます。`StartTime`、`FinishTime`、`FinishBatch`、`AllBatch` を `SHOW WARM UP JOB` で確認すると、直近の実行状況を把握できます。

**Q: 複数のソースコンピュートグループから同じ対象コンピュートグループへ同期できますか？**

はい。たとえば、コンピュートグループ A とコンピュートグループ C の両方からコンピュートグループ B へ同期できます（A -> B と C -> B が共存します）。複数のジョブが同じテーブルを対象にする場合、ジョブ管理とメトリクスの解釈が複雑になります。

**Q: テーブル単位のイベント駆動ウォームアップは、どのような場合に使用すべきですか？**

対象コンピュートグループが一部のテーブルだけを照会する場合や、ソースコンピュートグループに多数のテーブルがあっても、アクセスの多いテーブルは少数に限られる場合に使用します。これにより、不要なウォームアップとキャッシュの占有を減らせます。

**Q: `ON TABLES` を使用しない場合はどうなりますか？**

`ON TABLES` を指定しない場合、ジョブはコンピュートグループ単位のイベント駆動ウォームアップジョブになります。ソースコンピュートグループで、一致するイベントによって生成された新しいデータがウォームアップをトリガーします。

**Q: `INCLUDE` と `EXCLUDE` の順序は結果に影響しますか？**

いいえ。Doris はまずすべての `INCLUDE` ルールの和集合を計算し、その後、`EXCLUDE` ルールに一致するすべてのテーブルを除外します。

**Q: ジョブ作成後にルールに一致するテーブルを作成した場合、自動的にウォームアップされますか？**

はい。Doris はルールを定期的に再評価します。新しいテーブルがルールに一致する場合、後続の更新サイクルでウォームアップ範囲に含まれます。デフォルトの更新間隔は 60 秒です。

**Q: テーブルの名前を変更した後もウォームアップは継続しますか？**

新しいテーブル名が `ON TABLES` ルールに引き続き一致するかどうかによります。一致すればウォームアップは継続します。一致しなければ、後続の更新サイクルで停止します。

**Q: テーブル内の一つのパーティションだけをウォームアップできますか？**

テーブル単位のイベント駆動ウォームアップはテーブル単位でフィルタリングするため、`ON TABLES` でパーティションを指定することはできません。一致したテーブルの新しいデータは、テーブル単位のルールに従って処理されます。

**Q: ウォームアップが有効になっていることを確認するにはどうすればよいですか？**

次の手順で確認できます。

1. `SHOW WARM UP JOB WHERE id = <job_id>` を実行し、`Status` が `RUNNING` または `FINISHED` であることを確認します。
2. テーブル単位のイベント駆動ウォームアップでは、`MatchedTables` が想定どおりか確認します。
3. `FinishBatch` と `AllBatch` を比較し、一度限りのジョブまたは定期ジョブの進捗を確認します。
4. `SyncStats` を確認し、`gap_size` または詳細な `gap_*` が 0 に近づき、`trigger_gap_ms` が増加し続けていないことを確認します。
5. 対象コンピュートグループの BE Bvar メトリクスを確認し、`file_cache_event_driven_warm_up_finished_segment_num` などの完了カウンターが増加し続けていることを確認します。
6. 対象コンピュートグループで関連テーブルを照会し、File Cache のヒット率、FE メトリクス、BE のログを使用して、リモート読み取りが依然として多いかどうかを確認します。

**Q: 同期間隔や `ON TABLES` ルールなど、同期ジョブの設定を変更するにはどうすればよいですか？**

現在のバージョンでは直接変更できません。まず `CANCEL WARM UP JOB WHERE id = <job_id>` を実行して古いジョブをキャンセルし、その後、新しいジョブを作成する必要があります。
