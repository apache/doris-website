---
{
    "title": "Apache Doris の POC を進める方法",
    "language": "ja",
    "description": "POC 中にテーブルを作成できない、クエリが遅い、データレイクのクエリが進まないといった問題が起きていませんか？このページでは、テーブル設計、データ取り込み、クエリのチューニング、データレイクのクエリという 4 つの場面について、初めて利用する方からよく寄せられる質問と解決策をまとめます。",
    "sidebar_label": "POC を始める前に",
    "tags": ["POC", "Table Design", "Query Tuning", "Data Lake", "New Users"]
}
---

このページでは、POC を円滑に進められるよう、Apache Doris を初めて利用する方からよく寄せられる質問をまとめます。一般的な POC の流れに沿って、次の内容を扱います。

1. **テーブル設計** - データモデル、ソートキー、パーティション分割、バケット分割の方法を選ぶ。
2. **データ取り込み** - 適切な取り込み方法を選び、よくある問題を避ける。
3. **クエリのチューニング** - クエリが遅い原因を調べ、バケットとインデックスの設定を最適化する。
4. **データレイクのクエリ** - レイクハウスのシナリオ向けの追加の最適化方法を確認する。

:::tip 5 分で確認するチェックリスト
次の点を確認してください。
1. テーブルには適切なデータモデル（Duplicate Key／Unique Key／Aggregate Key）を使用していますか？
2. バケット数は BE の台数の整数倍ですか？
3. 時間を条件とするクエリにパーティション列を含めていますか？
4. Data Cache は有効ですか（データレイクをクエリする場合）？
:::

## テーブル設計

Doris でテーブルを作成するときは、取り込みとクエリの性能に影響する四つの項目を決めます。データモデル、ソートキー、パーティション分割、バケット分割です。

### データモデル

データの書き込み方に応じてモデルを選びます。

| データの特性 | 推奨モデル | 理由 |
|---|---|---|
| 追記のみ（ログ、イベント、ファクトテーブル） | **Duplicate Key**（デフォルト） | すべての行を保持し、クエリ性能に最も優れる |
| 主キーに基づく更新（CDC、Upsert） | **Unique Key** | 同じキーを持つ古い行を新しい行で置き換える |
| 事前集計した指標（PV、UV、集計値） | **Aggregate Key** | 書き込み時に SUM/MAX/MIN で行を統合する |

**ほとんどのシナリオには Duplicate Key が適しています。** 詳しくは、[データモデルの概要](../table-design/data-model/intro)を参照してください。

### ソートキー {#sort-key}

Doris は、ソートキーの先頭 36 バイトに[プレフィックスインデックス](../table-design/index/prefix-index)を構築します。ソートキーを設定するときは、次の原則に従ってください。

- **頻繁にフィルターに使う列を先頭に置く**：WHERE 条件で最もよく使う列を前に配置します。
- **固定長の型を先頭に置く**：INT、BIGINT、DATE などの固定長の型を VARCHAR より前に配置します。プレフィックスインデックスは VARCHAR に到達すると、その位置で直ちに切り詰められるためです。
- **転置インデックスを併用する**：プレフィックスインデックスでカバーできない列には、フィルタリングを高速化するために[転置インデックス](../table-design/index/inverted-index/overview)を追加します。

### パーティション分割

時間列がある場合は、`AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))` を使用して[パーティションプルーニング](../table-design/data-partitioning/auto-partitioning)を有効にします。Doris は不要なパーティションを自動的にスキップします。

### バケット分割 {#bucketing}

デフォルトは **Random バケット分割**です（Duplicate Key テーブルに推奨）。特定の列で頻繁にフィルタリングや JOIN を行う場合は、`DISTRIBUTED BY HASH(that_column)` を使用します。詳しくは、[データのバケット分割](../table-design/data-partitioning/data-bucketing)を参照してください。

**バケット数の決め方：**

| 原則 | 説明 |
|---|---|
| BE の台数の整数倍にする | データを均等に分散できます。後から BE を増設しても、通常、クエリは複数のパーティションにまたがるため、性能には影響しません |
| できるだけ少なくする | 小さなファイルの生成を避けます |
| バケットあたりの圧縮後のデータ量を <= 20 GB にする | Unique Key テーブルでは <= 10 GB にします。`SHOW TABLETS FROM your_table` で確認してください |
| パーティションあたり 128 バケット以下にする | それ以上必要な場合は、先にパーティション数を増やしてください。上限は 1024 ですが、本番環境でそこまで必要になることはまれです |

### テーブル作成のテンプレート

#### ログ／イベント分析

**ユースケース：** ログ、イベント、センサーデータなど、追記のみを行うシナリオ。

**前提条件：** 特別な要件はありません。

```sql
CREATE TABLE app_logs
(
    log_time      DATETIME    NOT NULL,
    log_level     VARCHAR(10),
    service_name  VARCHAR(50),
    trace_id      VARCHAR(64),
    message       STRING,
    INDEX idx_message (message) USING INVERTED PROPERTIES("parser" = "unicode")
)
AUTO PARTITION BY RANGE(date_trunc(`log_time`, 'day'))
()
DISTRIBUTED BY RANDOM BUCKETS 10;
```

**確認手順：**

```sql
-- 1. Verify that partitions are created automatically
SHOW PARTITIONS FROM app_logs;

-- 2. Verify that data is evenly distributed
SHOW TABLETS FROM app_logs;
```

#### リアルタイムダッシュボードと Upsert（CDC）

**ユースケース：** ユーザープロファイルや注文記録など、主キーに基づく更新が必要なシナリオ。

**前提条件：** 主キー列が明確に定義されていること。

```sql
CREATE TABLE user_profiles
(
    user_id       BIGINT      NOT NULL,
    username      VARCHAR(50),
    email         VARCHAR(100),
    status        TINYINT,
    updated_at    DATETIME
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**確認手順：**

```sql
-- 1. Verify primary key uniqueness (only one latest row per user_id)
SELECT user_id, count(*) as cnt FROM user_profiles GROUP BY user_id HAVING cnt > 1;

-- 2. Verify data distribution
SHOW TABLETS FROM user_profiles;
```

#### 指標の集計

**ユースケース：** トラフィック統計や業務レポートなど、事前集計が必要なシナリオ。

**前提条件：** 集計ディメンション列と指標列が明確に定義されていること。

```sql
CREATE TABLE site_metrics
(
    dt            DATE        NOT NULL,
    site_id       INT         NOT NULL,
    pv            BIGINT      SUM DEFAULT '0',
    uv            BIGINT      MAX DEFAULT '0'
)
AGGREGATE KEY(dt, site_id)
AUTO PARTITION BY RANGE(date_trunc(`dt`, 'day'))
()
DISTRIBUTED BY HASH(site_id) BUCKETS 10;
```

**確認手順：**

```sql
-- 1. Verify that aggregation works (metrics with the same dt+site_id are merged)
SELECT dt, site_id, pv, uv FROM site_metrics ORDER BY dt DESC LIMIT 10;

-- 2. Verify that partition pruning works
EXPLAIN SELECT * FROM site_metrics WHERE dt = '2024-01-01';
```

## データ取り込み

よくある性能上の問題を避けるため、適切な取り込み方法を選び、次のベストプラクティスに従ってください。

- **大量のデータに `INSERT INTO VALUES` を使用しないでください。** 代わりに [Stream Load](../data-operate/import/import-way/stream-load-manual) または [Broker Load](../data-operate/import/import-way/broker-load-manual) を使用します。詳しくは、[データ取り込みの概要](../data-operate/import/load-manual)を参照してください。
- **まずクライアント側で書き込みをまとめてください。** 小さなバッチを高頻度で取り込むと、バージョンが蓄積します。クライアント側でまとめられない場合は、[Group Commit](../data-operate/import/load-best-practices/group-commit-manual) を使用します。
- **大量のデータは小さなバッチに分けて取り込んでください。** 長時間かかる取り込みが失敗すると、最初からやり直す必要があります。増分取り込みには、[S3 TVF を使用した INSERT INTO SELECT](../data-operate/import/import-way/streaming-job/continuous-load-overview) を使用します。
- **Random バケット分割を使用する Duplicate Key テーブルでは `load_to_single_tablet` を有効にしてください。** 書き込み増幅を抑えられます。

**簡単な確認方法：**

```sql
-- View ingestion task status
SHOW LOAD WHERE label = 'your_label';

-- Check version pile-up (a high Version Count indicates ingestion is too frequent)
SHOW TABLETS FROM your_table;
```

詳しくは、[データ取り込みのベストプラクティス](../data-operate/import/load-best-practices/load-best-practices)を参照してください。

## クエリのチューニング

### バケット分割

バケット数はクエリの並列度とスケジューリングのオーバーヘッドに直接影響するため、バランスを取る必要があります。

- **バケット数を増やしすぎないでください。** 小さなタブレットが多すぎると、スケジューリングのオーバーヘッドが増え、クエリ性能が最大 50% 低下することがあります。
- **バケット数を減らしすぎないでください。** タブレットが少なすぎると、CPU の並列処理が制限されます。
- **データの偏りを避けてください。** `SHOW TABLETS` でタブレットのサイズを確認します。サイズに大きな差がある場合は、Random バケット分割に切り替えるか、カーディナリティの高い列をバケット分割列に選びます。

**診断用コマンド：**

```sql
-- Check tablet size distribution (used to detect data skew)
SHOW TABLETS FROM your_table\G
-- Review the tablet count and size to decide whether to adjust the bucket count
```

バケット数の選び方は、[バケット分割](#bucketing)を参照してください。

### インデックス

- **ソートキーを適切に設定してください。** PostgreSQL などのシステムと異なり、Doris がインデックスを作成するのはソートキーの先頭 36 バイトだけで、VARCHAR に到達すると直ちに切り詰められます。プレフィックスの範囲外にある列にはソートキーの効果がないため、[転置インデックス](../table-design/index/inverted-index/overview)が必要です。[ソートキー](#sort-key)も参照してください。

**ソートキーが機能しているか確認する：**

```sql
EXPLAIN SELECT * FROM your_table WHERE filter_column = 'xxx';
-- Check whether the Sort Key index is used
```

### 診断ツール

クエリが遅い原因を調べるには、[Query Profile](../query-acceleration/query-profile) を使用します。

**最初の手順：**

```sql
-- 1. Run the query and obtain the query_id
SET enable_profile = true;
SELECT ...;

-- 2. View the Query Profile
SHOW PROFILELIST;
SHOW PROFILE WHERE query_id = 'xxx';
```

## データレイクのクエリ

POC で Doris を介して Hive、Iceberg、Paimon などのデータレイクをクエリする場合（レイクハウスのシナリオ）、次の点がテスト結果に大きく影響します。

### パーティションプルーニングが機能していることを確認する

データレイクのテーブルには大量のデータが含まれることが多いため、WHERE 句には必ずパーティション列を含め、必要なパーティションだけを Doris がスキャンできるようにします。`EXPLAIN <SQL>` を実行し、`partition` フィールドを見てプルーニングが機能しているか確認してください。

```
0:VPAIMON_SCAN_NODE(88)
    partition=203/0          -- 203 partitions are pruned, 0 are actually scanned
```

パーティション数が予想より大幅に多い場合は、WHERE 句の条件がパーティション列に正しく対応しているか確認してください。

### Data Cache を有効にする

リモートストレージ（HDFS／オブジェクトストレージ）の IO レイテンシは、ローカルディスクより数倍高くなります。Data Cache は最近アクセスしたリモートデータを BE のローカルディスクにキャッシュするため、**同じデータに対する繰り返しのクエリでは、内部テーブルに近い性能を得られます**。

- キャッシュはデフォルトで無効です。設定方法は [Data Cache](../lakehouse/data-cache) のドキュメントを参照してください。
- **キャッシュの事前ウォームアップ**はバージョン 4.0.2 以降でサポートされており、POC のテスト前にアクセス頻度の高いデータをあらかじめ読み込めます。

:::tip
POC ではクエリを一度実行してキャッシュにデータを読み込み、二回目のクエリのレイテンシを基準値として使用してください。これにより、本番環境の定常時の性能をより正確に把握できます。
:::

### 小さなファイルを管理する

データレイクには小さなファイルが多数含まれることがあります。小さなファイルは多数の Split に分割されるため、FE のメモリ負荷が高まって OOM が発生することがあり、クエリプランの作成にかかるオーバーヘッドも増えます。

- **データソース側で対処する（推奨）：** Hive／Spark 側で小さなファイルを定期的にマージし、各ファイルを 128 MB より大きく保ちます。
- **Doris 側で対処する：** `SET max_file_split_num = 50000;`（4.0.4 以降でサポート）を使用して、スキャンあたりの Split 数の上限を設定し、OOM を防ぎます。

### Query Profile で診断する

データレイクのクエリでは、通常、計算処理よりも IO がボトルネックになります。[Query Profile](../query-acceleration/query-profile) を使うと、クエリが遅い原因を特定できます。特に次の点を確認してください。

- **Split 数とデータ量**：スキャンするデータが多すぎないか判断します。
- **MergeIO のメトリクス**：`MergedBytes` が `RequestBytes` を大幅に上回る場合は、読み取り増幅が深刻です。`merge_io_read_slice_size_bytes`（デフォルトは 8 MB）を小さくして影響を抑えます。
- **キャッシュヒット率**：Data Cache が効果的に機能しているか確認します。

その他の最適化方法は、[データレイクのクエリチューニング](../lakehouse/best-practices/optimization)を参照してください。

## よくあるエラーと対処方法

### テーブル作成時に「Tablet count should be greater than 0」というエラーが発生する

**原因：** バケット数が 0 に設定されているか、バケット分割が指定されていません。

**対処方法：** DDL に `DISTRIBUTED BY HASH(xxx) BUCKETS n` が含まれているか確認し、BUCKETS の後に正の整数を指定してください。

```sql
-- Correct example
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### クエリが遅く、インデックスが使われていない可能性がある

**診断手順：**

1. `EXPLAIN SQL` を実行してクエリプランを確認し、ソートキーのインデックスが使われているか調べます。
2. `SHOW TABLETS FROM table_name` を実行して、タブレットのサイズが均等か確認します。
3. Query Profile でボトルネックを特定します。

```sql
-- Check whether the index is used (look at output_id for Sort Key columns)
EXPLAIN SELECT * FROM table_name WHERE key_col = 'xxx';

-- Check tablet size (to detect data skew)
SHOW TABLETS FROM table_name;
```

### データレイクのクエリで OOM が発生する

**原因：** 小さなファイルが多すぎて Split 数が急増しています。

**対処方法：**

1. データソース側で小さなファイルをマージします（各ファイルを > 128 MB にします）。
2. Doris 側で Split 数に上限を設定します。

```sql
SET max_file_split_num = 50000;
```

### 取り込み時のバージョン蓄積によってクエリが遅くなる

**原因：** 小さなバッチを高頻度で取り込むことで、バージョンが増えすぎています。

**対処方法：**

1. 取り込みバッチをまとめ、取り込み頻度を下げます。
2. Group Commit を有効にします。

```sql
SET group_commit_mode = 'async_mode';
```

## よくある質問

### Q: POC にはどのくらい時間がかかりますか？

基本的な機能の確認（テーブル作成、データ取り込み、簡単なクエリ）には通常 1～2 日かかります。詳しい性能チューニングには 3～5 日かかります。

### Q: テーブル作成時のバケット数はどのように決めればよいですか？

まず BE ノード数の整数倍にして、データが均等に分散されるようにします。バケットあたりの圧縮後のデータ量は <= 20 GB（Unique Key テーブルでは <= 10 GB）にしてください。

### Q: クエリが予想より遅い場合はどうすればよいですか？

1. `EXPLAIN` を実行し、インデックスが使われているか確認します。
2. `SHOW TABLETS` を実行し、データに偏りがないか確認します。
3. Query Profile でボトルネックを特定します。

### Q: Data Cache を有効にすべきですか？

データレイク（Hive／Iceberg／Paimon）をクエリする場合は、有効にしてください。最初のクエリでデータが自動的にキャッシュされ、繰り返しのクエリでは内部テーブルに近い性能が得られます。
