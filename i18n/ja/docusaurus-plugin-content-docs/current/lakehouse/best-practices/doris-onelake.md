---
{
    "title": "Microsoft OneLake との連携",
    "language": "ja",
    "description": "Microsoft OneLake は Fabric エコシステムの一部であり、組織に一元化された論理データストレージ層を提供する、統合されたオープンな SaaS データレイクです。"
}
---

**Microsoft OneLake** は Fabric エコシステムの一部であり、組織に一元化された論理データストレージ層を提供する、統合されたオープンな SaaS データレイクです。OneLake のデータは **Parquet** 形式で保存され、**Delta Lake** と **Apache Iceberg** のメタデータを同時に保持できます。この設計により、複数の分析エンジンが共有データセットに**データの複製や移行をせずに**直接アクセスでき、データの管理とガバナンスを大幅に簡素化できます。

**Apache Doris の Iceberg REST Catalog** を利用すると、OneLake に保存されたデータをコピーしたり移動したりせずに、直接クエリと分析を実行できます。

この連携により、OneLake の統合ストレージとガバナンス機能に Doris の高性能な分析処理を組み合わせ、単一のデータレイク上に**エンドツーエンドの分析パイプライン**を構築できます。

技術的には、Doris はオープンなテーブル形式と標準化されたインターフェースを通じて OneLake と連携し、メタデータと Parquet ファイルの両方にアクセスします。このアーキテクチャでは、ガバナンス、アクセス制御、セキュリティポリシーの一元管理を維持し、プラットフォームの信頼性、拡張性、保守性を確保します。

この記事では、環境の準備、認証、クエリの実行例を含め、Doris を OneLake に接続する手順を説明します。

> Doris バージョン 3.1.4 以降が必要です。

## OneLake のセットアップ

まず **Fabric（OneLake）** 側でデータと認証を準備し、次にそのデータへアクセスするための **Iceberg REST Catalog** を Doris で作成します。

### OneLake にデータを読み込む

1. **Microsoft Fabric** コンソールを開き、新しい**ワークスペース（Workspace）**を作成します。一部の設定が制限される可能性があるため、既定のワークスペースは*使用しない*ことを推奨します。

   ![Microsoft Fabric でワークスペースを作成する画面](/images/integrations/lakehouse/onelake/onelake-1.png)

2. ワークスペース内で **新しいアイテム（New Item）→ Lakehouse** を選択し、Lakehouse インスタンスを作成します。

   ![ワークスペースで Lakehouse を作成する画面](/images/integrations/lakehouse/onelake/onelake-2.png)

3. **ワークスペースの設定（Workspace Settings）** に移動し、Lakehouse の機能を有効にするために必要な機能スイッチをオンにします。

   ![ワークスペースの設定画面](/images/integrations/lakehouse/onelake/onelake-3.png)

### ローカルファイルをアップロードする

例として、ローカルの CSV ファイルを OneLake に直接アップロードします。以下はサンプルファイルです。

![アップロードする CSV サンプルファイル](/images/integrations/lakehouse/onelake/onelake-4.png)

1. ワークスペースの **ファイル（Files）** セクションに移動し、**アップロード（Upload）→ ファイルのアップロード（Upload Files）** をクリックして CSV ファイルを選択します。

   ![OneLake にファイルをアップロードする画面](/images/integrations/lakehouse/onelake/onelake-5.png)

2. アップロード後、**テーブルの読み込み（Load Tables）→ 新しいテーブル（New table）** を選択します。既存のテーブルがある場合は、そのテーブルに読み込むこともできます。

3. インポートが完了したら、**テーブル（Tables）** ビューでテーブルとデータを確認します。

   ![インポートしたテーブルの表示画面](/images/integrations/lakehouse/onelake/onelake-6.png)

### 認証の設定

Doris が Iceberg REST Catalog を介して OneLake にアクセスできるように、Azure ポータルで**アプリの登録とアクセス許可**を設定します。

1. **Azure ポータル（Azure Portal）→ アプリの登録（App registrations）→ 新規登録（New registration）** を開き、後で使用する次の値を控えます。

   * アプリケーション（クライアント）ID

   * ディレクトリ（テナント）ID

   ![Azure でのアプリ登録画面](/images/integrations/lakehouse/onelake/onelake-7.png)

* **API のアクセス許可（API Permissions）** で、**Azure Storage** に必要なアクセス許可を追加します。最小権限の原則に従ってください。

  ![Azure Storage の API アクセス許可設定画面](/images/integrations/lakehouse/onelake/onelake-8.png)

* **証明書とシークレット（Certificates & secrets）** で**クライアントシークレット**を作成し、その値を安全に保管します。ページを離れると値は表示されなくなります。

  ![クライアントシークレットの作成画面](/images/integrations/lakehouse/onelake/onelake-9.png)

* **Fabric ワークスペース（Fabric Workspace）→ アクセスの管理（Manage Access）** に戻り、登録したアプリを表示名で検索してアクセス主体として追加します。

  ![Fabric ワークスペースのアクセス管理画面](/images/integrations/lakehouse/onelake/onelake-10.png)

これで、OneLake のデータと認証の準備は完了です。

## Apache Doris から OneLake に接続する

次に、Doris で **Iceberg REST Catalog** を作成し、OneLake のデータに接続します。

### Catalog を作成する

```sql
Doris> CREATE CATALOG onelake_doris PROPERTIES (
            'type' = 'iceberg',
            'iceberg.catalog.type' = 'rest',
            'uri'='https://onelake.table.fabric.microsoft.com/iceberg',
            'warehouse'='<workerspace_id>/<data_item_id>',
            'iceberg.rest.security.type'='oauth2',
            'iceberg.rest.oauth2.server-uri'='https://login.microsoftonline.com/<tenant_id>/oauth2/v2.0/token',
            'iceberg.rest.oauth2.credential'='<oauth2.client_id>:<oauth2.client_secret>',
            'iceberg.rest.oauth2.scope'='https://storage.azure.com/.default', 
            'fs.azure.support'='true',
            'azure.endpoint'='https://onelake.dfs.fabric.microsoft.com',
            'azure.auth_type'='OAuth2',
            'azure.oauth2_account_host'='onelake.dfs.fabric.microsoft.com',
            'azure.oauth2_server_uri'='https://login.microsoftonline.com/<tenant_id>/oauth2/v2.0/token',
            'azure.oauth2_client_id'='<oauth2.client_id>',
            'azure.oauth2_client_secret'='<oauth2.client_secret>'
        );
```

Catalog を作成する際には、次のパラメータが必要です。

* `WORKSPACE_ID` と `DATA_ITEM_ID` は、Lakehouse の URL から確認できます。

  `https://app.fabric.microsoft.com/groups/<WORKSPACE_ID>/lakehouses/<DATA_ITEM_ID>`

* `client_id`、`client_secret`、`tenant` などのパラメータには、Azure で登録したアプリの情報を使用します。

* OneLake では、`iceberg.rest.oauth2.scope`、`uri`、`azure.oauth2_account_host`、`azure.endpoint` などの設定キーの値は通常固定です。詳細は公式ドキュメントや設定例を参照してください。

設定が完了すると、標準 SQL を使用して Doris から OneLake の Iceberg テーブルに直接クエリを実行できます。

### 基本的な分析

以下は、Doris と OneLake を組み合わせた統合分析の一般的なビジネス向けの例です。

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

1. 過去三日間の新規注文を追跡する

   保留中、支払い済み、完了済みの注文を含む最近の販売状況をリアルタイムに把握し、受注処理の優先順位付けに役立てます。

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

2. 都市別の販売実績を分析する

   都市ごとの売上合計と注文数を集計し、地域別の販売戦略や在庫計画に役立てます。

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

3. 支払い方法別の返金率を分析する

   返金率が特に高い支払い手段を特定し、財務部門やリスク管理部門によるポリシーの調整や監視の強化に役立てます。

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

4. システム間でユーザー行動を比較する

   旧システム（Hive など）と OneLake の両方が稼働している場合、移行後のユーザーの重複や行動の変化を分析し、ビジネスへの影響を評価できます。

   ```sql
   -- "hive_catalog" is a Hive Catalog created in Doris 
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

### スナップショットとタイムトラベル

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

## まとめ

このガイドでは、**Apache Doris** と **Microsoft OneLake** を連携させ、統合されたデータレイクアーキテクチャ上で高性能な分析を行う方法を示しました。
&#x20;この連携には、次の主な利点があります。

* **データ移動が不要**：データのコピーや移行をせずに、OneLake のデータへ直接アクセスできます。

* **統合されたガバナンス**：データレイク全体で、管理、アクセス制御、セキュリティポリシーを一元化できます。

* **オープン形式との互換性**：オープンなテーブル標準である **Iceberg** を基盤とし、プラットフォーム間の相互運用性を確保できます。

* **柔軟な分析**：Doris の強力な OLAP エンジンと OneLake の拡張性の高いストレージ層を組み合わせられます。

**リアルタイムのビジネス監視**、**システム間のデータ比較**、**複雑な多次元分析**のいずれにおいても、このアーキテクチャは高い性能と柔軟性を提供します。データレイク技術が進化し続ける中、Doris と OneLake の連携は企業のデジタル変革を支える堅固なデータ基盤となります。

この記事の設定手順に従って独自の分析環境を構築し、ビジネスのニーズに合わせた、さらに高度な分析シナリオを試してみてください。
