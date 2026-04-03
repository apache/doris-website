---
{
  "title": "UPDATEコマンドによるデータの更新",
  "language": "ja",
  "description": "この文書では、Dorisでデータを変更するためのUPDATEコマンドの使用方法について説明します。"
}
---
この文書では、Dorisでデータを変更するための`UPDATE`コマンドの使用方法を説明します。`UPDATE`コマンドは、Uniqueデータモデルを持つテーブルにのみ適用されます。

## 適用シナリオ

- 小規模なデータ更新：少量のデータを修正する必要があるシナリオに最適です。特定のレコードの誤ったフィールドを修正したり、特定のフィールドのステータスを更新する場合（例：注文ステータスの更新）に適しています。

- 特定フィールルのETLバッチ処理：特定のフィールドの大規模な更新に適しており、ETL処理シナリオでよく見られます。注意：大規模なデータ更新は頻繁に行うべきではありません。

## 動作原理

クエリエンジンは独自のフィルタリングロジックを使用して、更新が必要な行を特定します。その後、UniqueモデルのValueカラムロジックを使用して、古いデータを新しいデータに置き換えます。更新対象の行は変更され、テーブルに再挿入されることで行レベルの更新を実現します。

### 同期性

DorisのUPDATE構文は同期的であり、`UPDATE`文が正常に実行されると、更新操作が完了し、データは即座に可視になります。

### パフォーマンス

`UPDATE`文のパフォーマンスは、更新対象の行数とクエリ条件の効率性と密接に関連しています。

- 更新対象の行数：更新が必要な行が多いほど、`UPDATE`文の実行は遅くなります。小規模な更新の場合、Dorisは`INSERT INTO`文と同様の頻度をサポートします。大規模な更新の場合、実行時間が長いため、頻繁でない呼び出しにのみ適しています。

- クエリ条件の効率性：`UPDATE`の実装では、まずクエリ条件を満たす行を読み取ります。したがって、クエリ条件が効率的であれば、`UPDATE`の速度は高速になります。理想的には、条件カラムはインデックスまたはパーティションバケットのプルーニングにヒットする必要があります。これにより、Dorisはテーブル全体をスキャンする必要がなく、更新が必要な行を迅速に特定でき、更新効率が向上します。条件カラムにvalueカラムを含めないことを強く推奨します。

## 使用例

金融リスク管理シナリオで、以下の構造を持つ取引詳細テーブルがあるとします：

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
  "replication_num" = "3",               -- Number of replicas, default is 3
  "enable_unique_key_merge_on_write" = "true"  -- Enable MOW mode, support merge updates
);
```
以下のトランザクションデータが存在します：

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
以下のリスク管理ルールに従って、すべての日次取引記録のリスクレベルを更新する：
1. 紛争履歴がある取引のリスクレベルはhighとする。
2. 高リスク地域での取引のリスクレベルはhighとする。
3. 異常な金額（日平均の5倍を超える）の取引のリスクレベルはhighとする。
4. 過去7日間の頻繁な取引：
  a. 取引回数が50回を超える場合、リスクレベルはhighとする。
  b. 取引回数が20回から50回の場合、リスクレベルはmediumとする。
5. 営業時間外（午前2時から午前4時）の取引のリスクレベルはmediumとする。
6. デフォルトのリスクレベルはlowとする。

```sql
UPDATE transaction_details
SET risk_level = CASE
  -- Transactions with a dispute history or in high-risk regions
  WHEN has_dispute_history = TRUE THEN 'high'
  WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

  -- Abnormal transaction amount
  WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

  -- High transaction frequency in the last 7 days
  WHEN recent_transaction_count > 50 THEN 'high'
  WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

  -- Transactions during non-working hours
  WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

  -- Default risk level
  ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```
更新されたデータは以下の通りです：

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
## その他のヘルプ

データ更新のより詳細な構文については、[UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE)コマンドマニュアルを参照してください。また、MySQLクライアントのコマンドラインで`HELP UPDATE`を入力することで、より多くのヘルプを得ることができます。
