---
{
    "title": "UPDATE コマンドによるデータの更新",
    "language": "ja",
    "description": "Doris の Unique Key モデルのテーブルで UPDATE コマンドを使用してデータを変更する方法。少量の行単位の更新と、フィールド単位の ETL バッチ更新に対応します。"
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Row-level data correction / Field batch update / ETL processing -->

この文書では、Apache Doris の Unique Key モデルを使用するテーブルのデータを `UPDATE` コマンドで変更する方法を説明します。適用場面、動作の仕組み、パフォーマンスに影響する要因、および完全な使用例を取り上げます。

`UPDATE` コマンドは、Unique Key モデルを使用するテーブルにのみ適用できます。

## 適用場面

`UPDATE` コマンドは、主に次の二つの場面に適しています。

| 場面 | 説明 | 例 |
| --- | --- | --- |
| 少量のデータ更新 | 少数のレコードの誤ったフィールドを修正する、または特定のフィールドの状態を更新する | 注文ステータスの修正、個々のフィールドの誤ったデータの修正 |
| フィールド単位の ETL バッチ処理 | ETL でよく行われる、特定のフィールドの大量更新 | リスクレベルの一括再計算、タグフィールドの一括更新 |

:::caution 注意
大量のデータ更新は低頻度で実行してください。高頻度での実行は避けてください。
:::

## 動作の仕組み

<!-- Knowledge type: Concept -->

`UPDATE` の主な実行手順は次のとおりです。

1. クエリエンジンが `WHERE` 条件に基づいて更新対象の行を絞り込みます。
2. Unique Key モデルの Value 列を上書きする仕組みにより、新しいデータが古いデータを置き換えます。
3. 変更された行がテーブルに書き戻され、行単位の更新が行われます。

### 同期実行

Doris の `UPDATE` 文は同期的に実行されます。`UPDATE` 文が正常に完了した時点で更新処理は完了しており、データは直ちに参照できます。

### パフォーマンス

`UPDATE` 文のパフォーマンスは、主に次の二つの要因によって決まります。

| 要因 | 説明 | 最適化の提案 |
| --- | --- | --- |
| 更新する行数 | 行数が多いほど実行時間が長くなる | 少量の更新は `INSERT INTO` と同程度の頻度で実行できる。大量の更新は低頻度での実行にのみ適する |
| クエリ条件の効率 | `UPDATE` は最初に条件に一致する行を読み込む | テーブル全体のスキャンを避けるため、条件に使用する列ではインデックス、またはパーティションやバケットのプルーニングを利用する |

:::tip ヒント
クエリ条件で主キーやインデックスを効率よく利用できるよう、`WHERE` 条件に Value 列を含めないことを強く推奨します。
:::

## 使用例

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Financial risk control / Batch update of risk levels -->

以下では、金融リスク管理を例に、`UPDATE` を使用して取引レコードのリスクレベルを一括更新する方法を示します。

### ステップ 1: テーブルの作成

Unique Key モデルを使用し、Merge-on-Write を有効にした取引明細テーブル `transaction_details` を作成します。

```sql
CREATE TABLE transaction_details (
    transaction_id BIGINT NOT NULL,        -- Unique transaction ID
    user_id BIGINT NOT NULL,               -- User ID
    transaction_date DATE NOT NULL,        -- Transaction date
    transaction_time DATETIME NOT NULL,    -- Transaction time
    transaction_amount DECIMAL(18, 2),     -- Transaction amount
    transaction_device STRING,             -- Transaction device
    transaction_region STRING,             -- Transaction region
    average_daily_amount DECIMAL(18, 2),   -- Average daily transaction amount over the last 3 months
    recent_transaction_count INT,          -- Number of transactions in the last 7 days
    has_dispute_history BOOLEAN,           -- Whether there is a dispute history
    risk_level STRING                      -- Risk level
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",                       -- Number of replicas, default is 3
    "enable_unique_key_merge_on_write" = "true"    -- Enable MOW mode to support merge updates
);
```

### ステップ 2: 初期データの確認

テーブルにはすでに次の取引データが含まれており、`risk_level` フィールドにはまだ値が設定されていないとします。

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | NULL       |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | NULL       |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | NULL       |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | NULL       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | NULL       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

### ステップ 3: リスク管理ルールの定義

次の優先順位のルールを適用し、当日のすべての取引レコードにリスクレベルを一括設定します。

| 優先順位 | ルール | リスクレベル |
| --- | --- | --- |
| 1 | 紛争履歴のある取引 | high |
| 2 | 高リスク地域（`high_risk_region1`、`high_risk_region2` など）からの取引 | high |
| 3 | 金額が異常な取引（日次平均金額の 5 倍を超える） | high |
| 4 | 50 回を超える取引が過去 7 日間にあった場合 | high |
| 5 | 20 回以上 50 回以下の取引が過去 7 日間にあった場合 | medium |
| 6 | 通常時間外（午前 2 時から午前 4 時）の取引 | medium |
| 7 | その他のデフォルトケース | low |

### ステップ 4: UPDATE の実行

上記のルールを一つの `UPDATE` 文にまとめ、`CASE WHEN` で複数の条件を表します。

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- Transactions with a dispute history or from high-risk regions
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- Abnormal transaction amount
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- High-frequency transactions in the last 7 days
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- Transactions during off-hours
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- Default risk level
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

### ステップ 5: 更新結果の確認

実行後にデータを再度クエリします。`risk_level` フィールドがルールに従って更新されています。

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | low        |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | medium     |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | medium     |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | high       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | high       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

## 詳細情報

- 完全な構文リファレンス: [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) コマンドのマニュアルを参照してください。
- コマンドラインのヘルプ: MySQL クライアントで `HELP UPDATE` を実行すると、組み込みのドキュメントを確認できます。
