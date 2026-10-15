---
{
    "title": "Unique Key モデルでの UPDATE",
    "language": "ja",
    "description": "Apache Doris の Unique Key モデルで UPDATE 文を使用して行単位でデータを更新する方法。適用場面、基本原理、実用例を説明します。"
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Data correction / ETL field batch processing / Business state changes -->

Doris にデータを書き込んだ後、注文のステータス変更、ETL ジョブによる特定フィールドの補完、誤りが見つかった過去のレコードの修正など、既存データの変更が必要になることがあります。Doris はこうした用途向けに、Unique Key モデルで標準の `UPDATE` 文を提供し、条件に一致する行を更新できます。

この文書では、Doris の `UPDATE` コマンドの適用場面、基本原理、代表的な使い方を説明します。**`UPDATE` コマンドは Unique データモデルを使用するテーブルにのみ適用できます**。

## 適用場面

`UPDATE` コマンドは、主に次の二つの場面で使用します。

| 場面 | 説明 | 実行頻度の目安 |
| --- | --- | --- |
| 少量の更新 | 少数のレコードの誤ったフィールドを修正する、または注文のステータス変更などで少数のレコードの状態を更新する。 | INSERT と同程度の頻度。 |
| ETL バッチ処理 | 特定のフィールドを一括更新する。ETL 処理で列の値を補完または再計算する場合に使用する。 | 低頻度の実行にのみ適する。 |

## 基本原理

<!-- Knowledge type: Principle explanation -->

`UPDATE` コマンドは次のように実行されます。

1. クエリエンジンの `WHERE` フィルタリング機能を使用し、対象テーブルから更新する行を選択します。
2. 選択した行の対象列をメモリ上で変更します。
3. Unique モデルの「Value 列の新しいデータが古いデータを置き換える」仕組みを使用して、変更した行をテーブルに再挿入し、行単位の更新を実現します。

### 同期実行

Doris の `UPDATE` は**同期文**です。`UPDATE` 文が正常に完了した時点で更新も完了しており、新しいデータは直ちに参照できます。

### パフォーマンス特性

`UPDATE` 文のパフォーマンスは、主に次の二つの要因に左右されます。

- **更新する行数**: 更新する行が多いほど、`UPDATE` 文の実行時間は長くなります。
    - 少量の更新: Doris は `INSERT INTO` と同程度の実行頻度をサポートします。
    - 大量の更新: 一度の `UPDATE` に時間がかかるため、低頻度の実行にのみ適しています。

- **クエリ条件による検索の効率**: `UPDATE` はまずクエリ条件に一致する行を読み込むため、条件による検索が効率的であるほど `UPDATE` は高速になります。
    - 推奨: 全テーブルスキャンを避けるため、可能であれば条件に使用する列でインデックスを利用するか、パーティションまたはバケットのプルーニングを利用します。
    - **強く非推奨**: 条件に Value 列を含めること。

## 使用例

<!-- Knowledge type: Operating steps -->
<!-- Applicable scenarios: Financial risk control / Field batch processing -->

以下では、金融リスク管理を例に、`UPDATE` コマンドを使用して取引明細テーブルのリスクレベルを一括で設定する方法を示します。

### 1. テーブルの作成

Unique Key モデルを使用し、MOW（Merge-on-Write）モードを有効にした取引明細テーブルを作成します。

```sql
CREATE TABLE transaction_details (
    transaction_id BIGINT NOT NULL,        -- Unique transaction ID
    user_id BIGINT NOT NULL,               -- User ID
    transaction_date DATE NOT NULL,        -- Transaction date
    transaction_time DATETIME NOT NULL,    -- Transaction time
    transaction_amount DECIMAL(18, 2),     -- Transaction amount
    transaction_device STRING,             -- Transaction device
    transaction_region STRING,             -- Transaction region
    average_daily_amount DECIMAL(18, 2),   -- Average daily transaction amount in the last 3 months
    recent_transaction_count INT,          -- Number of transactions in the last 7 days
    has_dispute_history BOOLEAN,           -- Whether there is a chargeback record
    risk_level STRING                      -- Risk level
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",                     -- Number of replicas, default 3
    "enable_unique_key_merge_on_write" = "true"  -- Enable MOW mode to support merge updates
);
```

### 2. 初期データ

このテーブルにはすでに以下の取引データが含まれており、`risk_level` フィールドはまだ設定されていません。

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

### 3. リスク管理ルール

次のリスク管理ルールに従い、当日のすべての取引レコードのリスクレベルを更新します。

| 番号 | ルール | リスクレベル |
| --- | --- | --- |
| 1 | チャージバックの記録がある | high |
| 2 | 高リスク地域での取引 | high |
| 3 | 取引金額が異常（日次平均の 5 倍を超える） | high |
| 4 | 取引回数が 50 回を超える（過去 7 日間） | high |
| 5 | 取引回数が 20～50 回（過去 7 日間） | medium |
| 6 | 時間外の取引（午前 2 時から午前 4 時の間） | medium |
| 7 | その他（デフォルト） | low |

### 4. UPDATE の実行

`CASE WHEN` 式を使用し、上記のルールを一つの文で当日のレコードに適用します。

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- Transactions with a chargeback record or in a high-risk region
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- Sudden abnormal transaction amount
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- Very high transaction frequency in the last 7 days
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- Off-hours transactions
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- Default risk
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

### 5. 更新結果

`UPDATE` が正常に完了した後でテーブルを照会すると、ルールに従って `risk_level` フィールドに値が設定されていることを確認できます。

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

`UPDATE` コマンドの完全な構文については、[UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) コマンドのマニュアルを参照するか、MySQL クライアントのコマンドラインで `HELP UPDATE` を実行してください。
