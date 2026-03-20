---
{
  "title": "Microsoft OneLakeとの統合",
  "description": "Microsoft OneLake は、Fabric エコシステムの一部であり、組織に一元化された論理データを提供する統合されたオープンな SaaS データレイクです",
  "language": "ja"
}
---
**Microsoft OneLake**は、Fabricエコシステムの一部であり、組織に一元化された論理データストレージレイヤーを提供する統合されたオープンSaaSデータレイクです。OneLakeのデータは**Parquet**フォーマットで格納され、**Delta Lake**と**Apache Iceberg**メタデータを同時に維持することができます。この設計により、複数のアナリティクスエンジンが**データの複製や移行なしに**共有データセットに直接アクセスすることが可能となり、データ管理とガバナンスが大幅に簡素化されます。

**Apache DorisのIceberg REST カタログ**を活用することで、ユーザーはOneLakeに保存されたデータを直接クエリおよび分析することができます—再度、データをコピーや移動することなしにです。

この統合により、単一のデータレイク上で**エンドツーエンドのアナリティクスパイプライン**を構築することが可能となり、OneLakeの統合ストレージとガバナンス機能とDorisの高性能分析コンピュートを組み合わせることができます。

技術レベルでは、Dorisはオープンtableフォーマットと標準化されたインターフェースを通じてOneLakeと連携し、メタデータとParquetファイルの両方にアクセスします。このアーキテクチャは一元化されたガバナンス、アクセス制御、セキュリティポリシーを保持し、プラットフォームの信頼性、スケーラビリティ、保守性を確保します。

この投稿では、環境設定、認証、クエリワークフローの例を含む、DorisをOneLakeに接続する方法を説明します。

> Dorisバージョン3.1.4+が必要です

## Onelakeセットアップ

**Fabric (OneLake)**側でのデータと認証設定の準備から始め、次にDorisで**Iceberg REST カタログ**を作成してそのデータにアクセスする方法を示します。

### OneLakeへのデータロード

1. **Microsoft Fabric**コンソールを開き、新しい**Workspace**を作成します（デフォルトのワークスペースは使用*しない*ことを推奨します。一部の設定が制限される場合があります）。

   ![onelake1](/images/integrations/lakehouse/onelake/onelake-1.png)

2. ワークスペース内で、**New Item → レイクハウス**を選択してレイクハウスインスタンスを作成します。

   ![onelake2](/images/integrations/lakehouse/onelake/onelake-2.png)

3. **Workspace Settings**に移動し、必要な機能トグルを有効にしてレイクハウス機能をアクティベートします。

   ![onelake3](/images/integrations/lakehouse/onelake/onelake-3.png)

### ローカルファイルのアップロード

デモンストレーション目的で、ローカルCSVファイルを直接OneLakeにアップロードします。これはサンプルファイルです：

![onelake4](/images/integrations/lakehouse/onelake/onelake-4.png)

1. ワークスペースの**Files**セクションに移動し、**Upload → Upload Files**をクリックして、CSVファイルを選択します。

   ![onelake5](/images/integrations/lakehouse/onelake/onelake-5.png)

2. アップロード後、**Load Tables → New table**を選択します（既存のtableがある場合は、そこにロードすることも可能です）。

3. インポートが完了したら、**Tables**ビューに移動してtableとデータを確認します。

   ![onelake6](/images/integrations/lakehouse/onelake/onelake-6.png)

### 認証設定

DorisがIceberg REST カタログでOneLakeにアクセスできるようにするため、Azureポータルで**アプリケーション登録と権限**を設定する必要があります：

1. **Azure Portal → App registrations → New registration**を開き、後で使用するため以下の値を記録します：

   * Application (client) ID

   * Directory (tenant) ID

   ![onelake7](/images/integrations/lakehouse/onelake/onelake-7.png)

* **API 許可**で、**Azure Storage**に必要な権限を追加します（最小権限の原則に従ってください）。

  ![onelake8](/images/integrations/lakehouse/onelake/onelake-8.png)

* **Certificates & secrets**で、**client secret**を作成し、その値を安全に保存します—ページを離れると隠されます。

  ![onelake9](/images/integrations/lakehouse/onelake/onelake-9.png)

* **Fabric Workspace → Manage Access**に戻り、登録したアプリ（表示名で）をアクセスプリンシパルとして追加します。

  ![onelake10](/images/integrations/lakehouse/onelake/onelake-10.png)

これらの手順が完了すると、OneLakeデータと認証設定の準備が整います。

## Apache DorisからOneLakeへの接続

次に、Dorisで**Iceberg REST カタログ**を作成し、OneLakeデータに接続しましょう。

### カタログの作成

```sql
Doris> CREATE CATALOG onelake_doris PROPERTIES (
            'type' = 'iceberg',
            'iceberg.catalog.type' = 'rest',
            'uri'='https://onelake.table.fabric.microsoft.com/iceberg',
            'warehouse'='<workerspace_id>/<data_item_id>',
            'iceberg.rest.security.type'='oauth2',
            'iceberg.rest.oauth2.server-uri'='https://login.microsoftonline.com/<talent_id>/oauth2/v2.0/token',
            'iceberg.rest.oauth2.credential'='<oauth2.client_id>:'<oauth2.client_secret>,
            'iceberg.rest.oauth2.scope'='https://storage.azure.com/.default', 
            'fs.azure.support'='true',
            'azure.endpoint'='https://onelake.dfs.fabric.microsoft.com',
            'azure.auth_type'='OAuth2',
            'azure.oauth2_account_host'='onelake.dfs.fabric.microsoft.com',
            'azure.oauth2_server_uri'='https://login.microsoftonline.com/<talent_id>/oauth2/v2.0/token',
            'azure.oauth2_client_id'='<oauth2.client_id>',
            'azure.oauth2_client_secret'='<oauth2.client_secret>'
        );
```
カタログを作成する際、以下のパラメータが必要になります:

* `WORKSPACE_ID`と`DATA_ITEM_ID` — LakehouseのURLから取得可能です:

  `https://app.fabric.microsoft.com/groups/<WORKSPACE_ID>/lakehouses/<DATA_ITEM_ID>`

* `client_id`、`client_secret`、`tenant`などのその他のパラメータは、Azure アプリ登録の詳細に対応します。

* OneLakeの場合、`iceberg.rest.oauth2.scope`、`uri`、`azure.oauth2_account_host`、`azure.endpoint`などの設定キーは一般的に固定値を持ちます — 具体的な値については公式ドキュメントまたはサンプル設定を参照してください。

設定後、標準SQLを使用してDorisから直接OneLakeのIcebergTableをクエリできます。

### 基本的な分析

以下は、DorisとOneLakeが統合分析でどのように連携できるかを示す一般的なビジネス分析の例です:

```sql
Doris> SWITCH onelake_doris;
Query OK, 0 rows affected

Doris> USE dbo;
Database changed

Doris> SHOW TABLES;
+----------------+
| Tables_in_dbo  |
+----------------+
| customer_order |
+----------------+
1 row in set
```
1. 過去3日間の新規注文を追跡

   保留中、支払い済み、完了済みの注文を含む最近の販売活動に関するリアルタイムの洞察を得て、フルフィルメントの優先順位付けを改善します。

   ```sql
   Doris> SELECT order_id, customer_name, product_name, total_price, status
       -> FROM customer_order
       -> WHERE order_date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
       -> ORDER BY order_date DESC;

   +----------------+---------------+---------------------+-------------+-----------+
   | order_id       | customer_name | product_name        | total_price | status    |
   +----------------+---------------+---------------------+-------------+-----------+
   | ORD20251112002 | Bob Li        | Smart Watch         |        1128 | Completed |
   | ORD20251112001 | Alice Zhang   | Wireless Headphones |         499 | Completed |
   | ORD20251112003 | Chen Wei      | Bluetooth Speaker   |         299 | Pending   |
   +----------------+---------------+---------------------+-------------+-----------+
   3 rows in set
   ```
2. 都市レベルの販売パフォーマンス

   地域別の販売戦略と在庫計画を導くために、都市ごとの総売上と注文数を集計します。

   ```sql
   Doris> SELECT city,
       ->        SUM(total_price) AS total_sales,
       ->        COUNT(*) AS order_count
       -> FROM customer_order
       -> WHERE status = 'Completed'
       -> GROUP BY city
       -> ORDER BY total_sales DESC;

   +----------+-------------+-------------+
   | city     | total_sales | order_count |
   +----------+-------------+-------------+
   | Beijing  |        1128 |           1 |
   | Shanghai |         499 |           1 |
   | Shenzhen |         387 |           1 |
   +----------+-------------+-------------+
   3 rows in set
   ```
3. 決済方法別の返金率

   異常に高い返金率を示す決済チャネルを特定し、財務またはリスク管理チームが方針を調整したり監視を強化したりするのに役立てます。

   ```sql
   Doris> SELECT payment_method,
       -> SUM(CASE WHEN status = 'Refunded' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
       ->    AS refund_rate_percent
       -> FROM customer_order
       -> GROUP BY payment_method
       -> ORDER BY refund_rate_percent DESC;

   +----------------+---------------------+
   | payment_method | refund_rate_percent |
   +----------------+---------------------+
   | Credit Card    |            50.00000 |
   | WeChat Pay     |             0.00000 |
   | Alipay         |             0.00000 |
   | UnionPay       |             0.00000 |
   +----------------+---------------------+
   4 rows in set
   ```
4. クロスシステムユーザー行動比較

   レガシー（例：Hive）とOneLakeシステムの両方がアクティブな場合、ユーザーの重複と移行後の行動変化を分析して、ビジネスへの影響を評価することができます。

   ```sql
   -- "hive_catalog" is a Hive カタログ created in Doris 
   Doris> SELECT
       ->     a.customer_id,
       ->     COUNT(DISTINCT b.order_id) AS new_order_count,
       ->     SUM(b.total_price) AS new_total_amount
       -> FROM hive_catalog.order_db.hive_customer_order a
       -> JOIN onelake_doris.dbo.customer_order b
       ->   ON a.customer_id = b.customer_id
       -> GROUP BY a.customer_id
       -> ORDER BY new_total_amount DESC
       -> LIMIT 100;
       
   +-------------+-----------------+------------------+
   | customer_id | new_order_count | new_total_amount |
   +-------------+-----------------+------------------+
   | CUST1002    |               1 |             1128 |
   | CUST1001    |               1 |              499 |
   | CUST1004    |               1 |              387 |
   | CUST1003    |               1 |              299 |
   | CUST1005    |               1 |              189 |
   +-------------+-----------------+------------------+
   5 rows in set
   ```
### Snapshot & Time Travel

```sql
Doris> SELECT * FROM customer_order$snapshots\G
*************************** 1. row ***************************
 committed_at: 2025-11-12 17:21:06.692000
  snapshot_id: 7623467350518045470
    parent_id: NULL
    operation: overwrite
manifest_list: abfss://181a804a-ea52-...
      summary: {"XTABLE_METADATA":"{"lastInstantSynced":"2025-11-12...
1 row in set (1.90 sec)

mysql> SELECT * FROM customer_order FOR VERSION AS OF 7623467350518045470 LIMIT 1\G
*************************** 1. row ***************************
      order_id: ORD20251112001
   customer_id: CUST1001
 customer_name: Alice Zhang
         email: alice.zhang@example.com
         phone: 13812345678
       country: China
          city: Shanghai
    order_date: 2025-11-10 22:23:00.000000
    product_id: PROD-A100
  product_name: Wireless Headphones
      category: Electronics
      quantity: 1
    unit_price: 499
   total_price: 499
payment_method: Credit Card
        status: Completed
1 row in set
```
## 結論

このガイドを通じて、**Apache Doris**と**Microsoft OneLake**をシームレスに統合し、統一されたデータレイクアーキテクチャでハイパフォーマンス分析を可能にする方法を実証しました。
この統合は以下の重要な利点を提供します：

* **ゼロデータ移動** – OneLake内のデータに直接アクセスし、コピーやマイグレーションは一切不要。

* **統一ガバナンス** – データレーク全体で一元管理、アクセス制御、セキュリティポリシーを維持。

* **オープンフォーマット互換性** – **Iceberg**オープンTable標準に基づいて構築され、クロスプラットフォームの相互運用性を確保。

* **柔軟な分析** – DorisのパワフルなOLAPエンジンとOneLakeのスケーラブルなストレージレイヤーを組み合わせ。

**リアルタイム業務監視**、**システム間データ比較**、**複雑な多次元分析**のいずれにおいても、このアーキテクチャはエンタープライズにパフォーマンスと柔軟性の両方を提供します。データレイクテクノロジーが進化し続ける中、DorisとOneLakeの統合は、エンタープライズデジタルトランスフォーメーションの堅実なデータ基盤として機能します。

次に、この記事で概説した設定手順に従って独自の分析環境を構築し、ビジネスニーズに合わせたより高度な分析シナリオを探索できます。
