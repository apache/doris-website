---
title: Dictionary を使用して JOIN クエリを高速化
sidebar_label: Dictionary による高速化
language: ja
description: Doris の Dictionary を使用して、ディメンションテーブルとの JOIN をメモリ内のキーと値の検索に変換し、クエリの性能を向上させます。
keywords:
    - Doris Dictionary
    - Dictionary
    - JOIN acceleration
    - dimension table query
    - dict_get
    - HASH_MAP
    - IP_TRIE
    - KV lookup
---

<!-- Knowledge type: Feature definition / Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Query performance tuning / Dimension table join acceleration -->

Dictionary は、JOIN 操作を高速化するために Doris が提供する特別なデータ構造です。通常のテーブルを基に作成され、ソーステーブルの対応する列をキーと値の関係として扱います。これらの列の全データをあらかじめメモリに読み込むことで高速な検索を実現し、クエリの性能を向上させます。

Dictionary は、キーと値の検索を頻繁に行う場合に特に適しています。キーと値の検索に使用するため、キーの重複は許可されません。

:::tip
この機能は実験的な機能で、バージョン 4.1.0 以降でサポートされています。
:::

## ユースケース {#use-cases}

<!-- Knowledge type: Architecture selection decision -->

Dictionary は主に次のような場合に適しています。

1. キーと値の検索を頻繁に行う場合
2. ディメンションテーブルが全体をメモリに収められるほど小さい場合
3. データの更新頻度が比較的低い場合

従来は LEFT OUTER JOIN で実装していたキーと値の検索も、Dictionary を使用すれば JOIN のオーバーヘッドをなくし、通常の関数呼び出しに置き換えられます。

### シナリオの例 {#scenario-example}

EC サイトでは、注文テーブル（`orders`、ファクトテーブル）に大量の取引データが記録されています。商品の詳細情報を取得するために、商品テーブル（`products`、ディメンションテーブル）との JOIN が頻繁に必要になります。

**ステップ 1：ファクトテーブルとディメンションテーブルを作成し、サンプルデータを挿入する**

```sql
-- Product dimension table
CREATE TABLE products (
    product_id BIGINT NOT NULL COMMENT "Product ID",
    product_name VARCHAR(128) NOT NULL COMMENT "Product name",
    brand_name VARCHAR(64) NOT NULL COMMENT "Brand name",
    category_name VARCHAR(64) NOT NULL COMMENT "Category name",
    retail_price DECIMAL(10,2) NOT NULL COMMENT "Retail price",
    update_time DATETIME NOT NULL COMMENT "Update time"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order fact table
CREATE TABLE orders (
    order_id BIGINT NOT NULL COMMENT "Order ID",
    product_id BIGINT NOT NULL COMMENT "Product ID",
    user_id BIGINT NOT NULL COMMENT "User ID",
    quantity INT NOT NULL COMMENT "Purchase quantity",
    actual_price DECIMAL(10,2) NOT NULL COMMENT "Actual transaction price",
    order_time DATETIME NOT NULL COMMENT "Order time"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 32;

-- Insert sample data
INSERT INTO products VALUES
(1001, 'iPhone 15 Pro 256G Black', 'Apple', 'Mobile & Digital', 8999.00, '2024-01-01 00:00:00'),
(1002, 'MacBook Pro M3 Max', 'Apple', 'Computers & Office', 19999.00, '2024-01-01 00:00:00'),
(1003, 'AirPods Pro 2', 'Apple', 'Phone Accessories', 1999.00, '2024-01-01 00:00:00');

INSERT INTO orders VALUES
(10001, 1001, 88001, 1, 8899.00, '2024-02-22 10:15:00'),
(10002, 1002, 88002, 1, 19599.00, '2024-02-22 11:30:00'),
(10003, 1003, 88001, 2, 1899.00, '2024-02-22 14:20:00');
```

**ステップ 2：従来の JOIN を使用する方法**

カテゴリごとの注文件数と売上総額を集計するには、従来は LEFT OUTER JOIN を使用して商品テーブルから商品情報を取得する必要がありました。

```sql
-- Count the number of orders and total sales for each category
SELECT
    p.category_name,
    p.brand_name,
    COUNT(DISTINCT o.order_id) as order_count,
    SUM(o.quantity) as total_quantity,
    SUM(o.actual_price * o.quantity) as total_amount
FROM orders o
LEFT JOIN products p ON o.product_id = p.product_id
WHERE o.order_time >= '2024-02-22 00:00:00'
GROUP BY p.category_name, p.brand_name
ORDER BY total_amount DESC;
```

```text
+---------------------+------------+-------------+----------------+--------------+
| category_name       | brand_name | order_count | total_quantity | total_amount |
+---------------------+------------+-------------+----------------+--------------+
| Computers & Office  | Apple      |           1 |              1 |     19599.00 |
| Mobile & Digital    | Apple      |           1 |              1 |      8899.00 |
| Phone Accessories   | Apple      |           1 |              2 |      3798.00 |
+---------------------+------------+-------------+----------------+--------------+
```

この種のクエリでは、`product_id` を使ってほかの商品情報を頻繁に検索します。これは本質的に KV 検索です。

**ステップ 3：JOIN の代わりに Dictionary を使用する**

キーと値の関係を定義したら、対応する Dictionary をあらかじめ作成できます。これにより、従来の JOIN 操作をより軽量なキーと値の検索に置き換え、SQL の実行効率を高められます。

```sql
-- Create the product information dictionary
CREATE DICTIONARY product_info_dict USING products
(
    product_id KEY,
    product_name VALUE,
    brand_name VALUE,
    category_name VALUE,
    retail_price VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES(
    'data_lifetime'='300'  -- Considering how often product information changes, refresh every 5 minutes
);
```

Dictionary を使用すると、元のクエリの JOIN 操作は、軽量な KV 検索である `dict_get` 関数による検索に変わります。

```sql
SELECT
    dict_get("test.product_info_dict", "category_name", o.product_id) as category_name,
    dict_get("test.product_info_dict", "brand_name", o.product_id) as brand_name,
    COUNT(DISTINCT o.order_id) as order_count,
    SUM(o.quantity) as total_quantity,
    SUM(o.actual_price * o.quantity) as total_amount
FROM orders o
WHERE o.order_time >= '2024-02-22 00:00:00'
GROUP BY
    dict_get("test.product_info_dict", "category_name", o.product_id),
    dict_get("test.product_info_dict", "brand_name", o.product_id)
ORDER BY total_amount DESC;
```

```text
+---------------------+------------+-------------+----------------+--------------+
| category_name       | brand_name | order_count | total_quantity | total_amount |
+---------------------+------------+-------------+----------------+--------------+
| Computers & Office  | Apple      |           1 |              1 |     19599.00 |
| Mobile & Digital    | Apple      |           1 |              1 |      8899.00 |
| Phone Accessories   | Apple      |           1 |              2 |      3798.00 |
+---------------------+------------+-------------+----------------+--------------+
```

## Dictionary の定義 {#dictionary-definition}

4.1.5 以降、Dictionary の作成には対象の Dictionary オブジェクトに対する `CREATE` 権限と、ソーステーブルに対する `SELECT` 権限が必要です。削除には Dictionary オブジェクトに対する `DROP` 権限が必要です。ソースが外部 Catalog に属する場合は、ソーステーブルに対する権限も確認されます。

<!-- Knowledge type: Configuration parameters / Operation steps -->

### 基本構文 {#basic-syntax}

```sql
CREATE DICTIONARY <dict_name> USING <source_table>
(
    <key_column> KEY[,
    ...,
    <key_columns> VALUE]
    <value_column> VALUE[,
    ...,
    <value_columns> VALUE]
)
LAYOUT(<layout_type>)
PROPERTIES(
    "<priority_item_key>" = "<priority_item_value>"[,
    ...,
    "<priority_item_key>" = "<priority_item_value>"]
);
```

パラメータの説明：

| パラメータ | 意味 |
| --- | --- |
| `<dict_name>` | Dictionary の名前 |
| `<source_table>` | ソースデータテーブル |
| `<key_column>` | キーとして使用するソーステーブルの列名 |
| `<value_column>` | 値として使用するソーステーブルの列名 |
| `<layout_type>` | Dictionary のストレージレイアウトの種類。詳細は後述 |
| `<priority_item_key>` | Dictionary のプロパティ名 |
| `<priority_item_value>` | Dictionary のプロパティ値 |

`<key_column>` と `<value_column>` は、それぞれ少なくとも 1 つ必要です。`<key_column>` を `<value_column>` より前に記述する必要はありません。

### レイアウトの種類 {#layout-types}

現在、次の 2 種類のレイアウトがサポートされています。

| レイアウトの種類 | 用途 | 説明 |
| --- | --- | --- |
| `HASH_MAP` | 一般的なキーと値の検索 | ハッシュテーブルを使用した実装 |
| `IP_TRIE` | IP アドレスの検索 | Trie を使用した実装で、IP アドレスの検索向けに最適化されています。キー列には CIDR 表記の IP アドレスを指定し、クエリでは CIDR 表記に基づいて照合します |

### プロパティ {#properties}

| プロパティ | 値の型 | 意味 | 必須 |
| --- | --- | --- | --- |
| `data_lifetime` | 整数、単位は秒 | データの有効期間。Dictionary の最終更新からこの期間を超え、かつベーステーブルのデータに変更がある場合、再インポートが自動的に開始されます。インポートの仕組みについては[自動インポート](#auto-import)を参照してください | はい |
| `skip_null_key` | 真偽値 | Dictionary へのデータロード時にキー列に null 値がある場合、`true` ならその行をスキップし、それ以外ならエラーを報告します。デフォルトは `false` です | いいえ |
| `memory_limit` | 整数、単位はバイト | 単一の BE で Dictionary が使用できるメモリの上限。デフォルトは `2147483648`（2GB）です | いいえ |

### 作成例 {#creation-example}

```sql
-- Create the source data table
CREATE TABLE source_table (
    id INT NOT NULL,
    city VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(id) BUCKETS 1;

-- Create the dictionary
CREATE DICTIONARY city_dict USING source_table
(
    city KEY,
    id VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

このテーブルを基に作成した `city_dict` Dictionary と `dict_get` 関数を使用すると、`source_table` の `city` の値から対応する `id` を検索できます。

### 使用上の制約 {#usage-restrictions}

**1. キー列の制約**

- IP_TRIE Dictionary のキー列は Varchar 型または String 型でなければならず、**キー列の値は CIDR 形式でなければなりません**。
- IP_TRIE Dictionary で指定できるキー列は 1 つだけです。
- HASH_MAP Dictionary のキー列は、すべての単純型をサポートします（Map や Array などのネスト型は対象外です）。
- キー列として使用する列には、**ソーステーブル内で重複する値があってはなりません**。重複している場合、Dictionary のデータロード時にエラーが報告されます。

**2. null 値の扱い**

- Dictionary のすべての列に Nullable 列を使用できますが、キー列に実際の null 値を含めないようにしてください。含まれる場合の動作は、[プロパティ](#properties)の `skip_null_key` によって決まります。

## 使用と管理 {#usage-and-management}

### データのロード（更新） {#loading-refreshing-data}

<!-- Knowledge type: Operation steps -->

Dictionary は自動と手動の両方のデータロードをサポートします。Dictionary へのデータロードは「更新」とも呼ばれます。

#### 自動インポート {#auto-import}

自動データロードは、次のタイミングで行われます。

1. Dictionary の作成後
2. Dictionary のデータが期限切れになったとき（[プロパティ](#properties)を参照）
3. BE の状態から、その Dictionary のデータが欠けていることが判明したとき（新しい BE が稼働を開始した場合や、既存の BE が再起動した場合など）

Doris は `dictionary_auto_refresh_interval_seconds` 秒ごとに、すべての Dictionary データの期限切れを確認します。Dictionary が `data_lifetime` 秒を超えて更新されておらず、**前回のデータロード以降にベーステーブルのデータが変更されている場合**、Doris はその Dictionary のデータロードを自動的に実行します。

一部の BE にデータがなく、前回のデータロード以降にベーステーブルのデータが変更されていない場合、Doris は該当する BE に現行バージョンのデータだけを補充します。すべての BE を対象とする更新タスクは実行されず、Dictionary のバージョンも変わりません。

#### 手動インポート {#manual-import}

- **目的**：Dictionary データの更新を手動で開始します。
- **コマンド**：

    ```sql
    REFRESH DICTIONARY <dict_name>;
    ```

- **説明**：`<dict_name>` は、データをロードする Dictionary の名前です。

#### データロード時の注意事項 {#notes-for-loading}

1. Dictionary にデータがロードされるまで、その Dictionary はクエリできません。
2. データロード中にキー列に重複する値が見つかると、データロードのトランザクションは失敗します。
3. データロードのトランザクションがすでに進行中（Dictionary の Status が `LOADING`）の場合、手動のデータロードは失敗します。進行中のデータロードが完了してから再試行してください。
4. ロードした Dictionary のサイズが設定された `memory_limit` を超えると、データロードのトランザクションは失敗します。

### Dictionary のクエリ {#querying-a-dictionary}

<!-- Knowledge type: Operation steps -->

`dict_get` 関数と `dict_get_many` 関数を使用すると、それぞれ単一のキー列と値列、または複数のキー列と値列を持つ Dictionary に対してクエリできます。

最初のクエリを実行する前に、Dictionary のデータロードが完了するまで待ってください。

#### 構文 {#syntax}

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```

パラメータの説明：

| パラメータ | 説明 |
| --- | --- |
| `<db_name>` | Dictionary が属するデータベースの名前 |
| `<dict_name>` | Dictionary の名前 |
| `<query_column>` | クエリする値列の名前。型は `VARCHAR` で、**定数でなければなりません** |
| `<query_columns>` | クエリするすべての値列の名前。型は `ARRAY<VARCHAR>` で、**定数でなければなりません** |
| `<query_key_value>` | クエリに使用するキー列のデータ |
| `<query_key_values>` | Dictionary の**すべてのキー列**について、クエリに使用するデータを格納した STRUCT |

戻り値の型：

- `dict_get` の戻り値の型は、`<query_column>` に対応する Dictionary の列の型です。
- `dict_get_many` の戻り値の型は、`<query_columns>` に対応する Dictionary の列の型で構成される [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT) です。

#### クエリの例 {#query-examples}

**例 1：単一キー、単一値のクエリ**

`test_db` データベースの `city_dict` Dictionary に対し、キー列の値が「Beijing」の場合の `id` の値を取得します。

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

**例 2：単一キー、複数値のクエリ**

`test_db` データベースの `single_key_dict` Dictionary に対し、キー列の値が 1 の場合の `k1` 列と `k3` 列の値を取得します。

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

**例 3：複数キー、複数値のクエリ**

`test_db` データベースの `multi_key_dict` Dictionary に対し、2 つのキー列の値がそれぞれ 2 と 'ABC' の場合の `k2` 列と `k3` 列の値を取得します。

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

たとえば、テーブルの作成文が次のとおりだとします。

```sql
create table if not exists multi_key_table(
    k0 int not null,
    k1 varchar not null,
    k2 float not null,
    k3 varchar not null
)
DISTRIBUTED BY HASH(`k0`) BUCKETS auto;

create dictionary multi_key_dict using multi_key_table
(
    k0 KEY,
    k1 KEY,
    k2 VALUE,
    k3 VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

この場合、先ほどの文

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

の戻り値の型は `STRUCT<float, varchar>` です。

#### クエリ時の注意事項 {#notes-for-queries}

1. クエリするキーのデータが Dictionary に存在しない場合、**またはキーのデータが null の場合**、null が返されます。
2. IP_TRIE Dictionary をクエリする場合、**`<query_key_value>` の型は `IPV4` または `IPV6` でなければなりません**。
3. IP_TRIE Dictionary を使用する場合、キー列 `<key_column>` のデータとクエリに使用する `<query_key_value>` は、どちらも `IPV4` と `IPV6` の両方の形式をサポートします。
4. 新たに稼働を開始したか、停止後に再起動したために、特定の BE に Dictionary データがない場合、その BE に割り当てられたクエリは失敗します。クエリがその BE に割り当てられるかどうかは、複数の要因によって決まります。FE Master の負荷が高くない場合は、[設定項目](#configuration-items) `dictionary_auto_refresh_interval_seconds` の値を小さくすると、Dictionary を利用できない期間を短縮できます。

### Dictionary の管理 {#dictionary-management}

<!-- Knowledge type: Operation steps -->

Dictionary の管理と確認には、次の文を使用できます。

**1. 現在のデータベースにあるすべての Dictionary の状態を表示する**

```sql
SHOW DICTIONARIES [LIKE <LIKE_NAME>];
```

**2. 特定の Dictionary の定義を表示する**

```sql
DESC DICTIONARY <dict_name>;
```

**3. Dictionary を削除する**

```sql
DROP DICTIONARY <dict_name>;
```

Dictionary を削除しても、BE からはすぐに削除されない場合があります。

#### 設定項目 {#configuration-items}

Dictionary では次の設定項目がサポートされます。いずれも FE CONFIG です。

| 設定項目 | デフォルト値 | 動的に変更可能 | 説明 |
| --- | --- | --- | --- |
| `dictionary_task_queue_size` | 1024 | いいえ | すべての Dictionary タスクに使用するスレッドプールのキュー長。通常、変更する必要はありません |
| `job_dictionary_task_consumer_thread_num` | 3 | いいえ | すべての Dictionary タスクに使用するスレッドプールのスレッド数 |
| `dictionary_rpc_timeout_ms` | 5000 (5s) | はい | Dictionary 関連のすべての RPC のタイムアウト。通常、変更する必要はありません |
| `dictionary_auto_refresh_interval_seconds` | 5 (seconds) | はい | すべての Dictionary データが期限切れかどうかを自動確認する間隔 |

### 状態の表示 {#status-display}

`SHOW DICTIONARIES` 文には、各 Dictionary に対応するベーステーブル、現在のデータバージョン番号、FE と BE での状態が表示されます。

```sql
> SHOW DICTIONARIES;
```

```text
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
| DictionaryId | DictionaryName | BaseTableName                                | Version | Status | DataDistribution                   | LastUpdateResult             |
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
| 51           | precision_dict | internal.test_refresh_dict.precision_test    | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=368} | 2025-02-18 09:58:12: succeed |
| 48           | product_dict   | internal.test_refresh_dict.product_info      | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=240} | 2025-02-18 09:58:12: succeed |
| 49           | ip_dict        | internal.test_refresh_dict.ip_info           | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=194} | 2025-02-18 09:58:12: succeed |
| 52           | order_dict     | internal.test_refresh_dict.column_order_test | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=432} | 2025-02-18 09:58:12: succeed |
| 50           | user_dict      | internal.test_refresh_dict.user_info         | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=240} | 2025-02-18 09:58:12: succeed |
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
```

各フィールドの意味：

1. `Version`：データのバージョン番号です。データロードのたびに 1 増加します。
2. `Status`：Dictionary の状態です。各値の意味は次のとおりです。

    | 状態名 | 意味 |
    | --- | --- |
    | NORMAL | Dictionary は現在正常な状態です |
    | LOADING | Dictionary は現在データをロードしています |
    | OUT_OF_DATE | Dictionary のデータは期限切れです |

    データロードが進行中の Dictionary に対して、再度データロードを開始することはできません。

3. `DataDistribution`：各 BE の現在の状態です。バージョン番号とメモリ使用量（KB）が含まれます。
4. `LastUpdateResult`：前回のデータロード（自動または手動）の結果です。エラーが発生した場合は、ここに詳細情報が表示されます。

Dictionary の列定義を表示するには、`DESC DICTIONARY` を使用します。例：

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | Type        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```

## 注意事項 {#notes}

<!-- Knowledge type: Best practices -->

### データの整合性 {#data-consistency}

- Dictionary を更新するたびに新しいバージョンが作成されます。クエリ中に BE が記録しているバージョンと FE 上のバージョンが異なる場合、そのクエリは失敗します。
- Doris は Dictionary とベーステーブルの間で強いデータ整合性を維持しません。Dictionary の `data_lifetime` を適切に設定して自動更新を有効にし、必要に応じて業務ロジックに基づく手動更新を追加してください。
- ソーステーブルが何らかの方法で削除されると、対応する Dictionary も自動的に削除されます。

### 性能に関する考慮事項 {#performance-considerations}

- Dictionary は、ディメンションテーブルのデータなど、比較的更新の少ないデータに適しています。
- Dictionary は完全にメモリ上に保持されるテーブルであり、その全データがすべての BE のメモリに保存されるため、多くのメモリを消費します。メモリ使用量とクエリ性能のバランスを考慮し、Dictionary の作成元に適したテーブルを選んでください。

### ベストプラクティス {#best-practices}

1. **キー列と値列を適切に選ぶ**：

    - キーにはカーディナリティが適度な列を選んでください。

2. **レイアウトを選ぶ**：

    - 一般的な用途には HASH_MAP レイアウトを使用してください。
    - IP アドレス範囲の照合には IP_TRIE レイアウトを使用してください。

3. **状態を管理する**：

    - Dictionary のメモリ使用量を定期的に監視してください。
    - 適切なデータ更新間隔を選び、データが古くなったと分かっている場合は、業務側で Dictionary を手動更新してください。
    - Dictionary の使用時は BE のメモリを監視し、Dictionary の数が多すぎたり、サイズが大きすぎたりしてメモリを過度に消費し、BE の状態に異常が生じることを防いでください。

## 完全な例 {#complete-examples}

<!-- Knowledge type: Operation steps -->

### 例 1：HASH_MAP、単一キーと単一値 {#example-1-hash_map-single-key-and-single-value}

```sql
-- Create the source data table
CREATE TABLE cities (
    city_id INT NOT NULL,
    city_name VARCHAR(32) NOT NULL,
    region_code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(city_id) BUCKETS 1;

-- Insert data
INSERT INTO cities VALUES
(1, 'Beijing', 'BJ'),
(2, 'Shanghai', 'SH'),
(3, 'Guangzhou', 'GZ');

-- Create the dictionary
CREATE DICTIONARY city_code_dict USING cities
(
    city_name KEY,
    region_code VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');

-- Query using the dictionary
SELECT dict_get("test_refresh_dict.city_code_dict", "region_code", "Beijing");
```

```text
+------------------------------------------------------------------------+
| dict_get('test_refresh_dict.city_code_dict', 'region_code', 'Beijing') |
+------------------------------------------------------------------------+
| BJ                                                                     |
+------------------------------------------------------------------------+
```

### 例 2：IP_TRIE、CIDR に基づく IP 検索 {#example-2-ip_trie-cidr-based-ip-lookup}

```sql
-- Create the source data table
CREATE TABLE ip_locations (
    ip_range VARCHAR(30) NOT NULL,
    country VARCHAR(64) NOT NULL,
    region VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(ip_range) BUCKETS 1;

-- Insert some sample data
INSERT INTO ip_locations VALUES
('1.0.0.0/24', 'United States', 'California', 'Los Angeles'),
('1.0.1.0/24', 'China', 'Beijing', 'Beijing'),
('1.0.4.0/24', 'Japan', 'Tokyo', 'Tokyo');

-- Create the IP address dictionary
CREATE DICTIONARY ip_location_dict USING ip_locations
(
    ip_range KEY,
    country VALUE,
    region VALUE,
    city VALUE
)
LAYOUT(IP_TRIE)
PROPERTIES('data_lifetime' = '600');

-- Query the location information for an IP address, matched by CIDR.
SELECT
    dict_get("test_refresh_dict.ip_location_dict", "country", cast('1.0.0.1' as ipv4)) AS country,
    dict_get("test_refresh_dict.ip_location_dict", "region", cast('1.0.0.2' as ipv4)) AS region,
    dict_get("test_refresh_dict.ip_location_dict", "city", cast('1.0.0.3' as ipv4)) AS city;
```

```text
+---------------+------------+-------------+
| country       | region     | city        |
+---------------+------------+-------------+
| United States | California | Los Angeles |
+---------------+------------+-------------+
```

### 例 3：HASH_MAP、複数キーと複数値 {#example-3-hash_map-multiple-keys-and-multiple-values}

```sql
-- Product SKU dimension table: contains the basic attributes of products
CREATE TABLE product_sku_info (
    product_id INT NOT NULL COMMENT "Product ID",
    color_code VARCHAR(32) NOT NULL COMMENT "Color code",
    size_code VARCHAR(32) NOT NULL COMMENT "Size code",
    product_name VARCHAR(128) NOT NULL COMMENT "Product name",
    color_name VARCHAR(32) NOT NULL COMMENT "Color name",
    size_name VARCHAR(32) NOT NULL COMMENT "Size name",
    stock INT NOT NULL COMMENT "Stock",
    price DECIMAL(10,2) NOT NULL COMMENT "Price",
    update_time DATETIME NOT NULL COMMENT "Update time"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order detail table: records actual sales data
CREATE TABLE order_details (
    order_id BIGINT NOT NULL COMMENT "Order ID",
    product_id INT NOT NULL COMMENT "Product ID",
    color_code VARCHAR(32) NOT NULL COMMENT "Color code",
    size_code VARCHAR(32) NOT NULL COMMENT "Size code",
    quantity INT NOT NULL COMMENT "Purchase quantity",
    order_time DATETIME NOT NULL COMMENT "Order time"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 10;

-- Insert product SKU data
INSERT INTO product_sku_info VALUES
(1001, 'BLK', 'M', 'Nike Sports T-Shirt', 'Black', 'Size M', 100, 199.00, '2024-02-23 10:00:00'),
(1001, 'BLK', 'L', 'Nike Sports T-Shirt', 'Black', 'Size L', 80, 199.00, '2024-02-23 10:00:00'),
(1001, 'WHT', 'M', 'Nike Sports T-Shirt', 'White', 'Size M', 90, 199.00, '2024-02-23 10:00:00'),
(1001, 'WHT', 'L', 'Nike Sports T-Shirt', 'White', 'Size L', 70, 199.00, '2024-02-23 10:00:00'),
(1002, 'RED', 'S', 'Adidas Sports Pants', 'Red', 'Size S', 50, 299.00, '2024-02-23 10:00:00'),
(1002, 'RED', 'M', 'Adidas Sports Pants', 'Red', 'Size M', 60, 299.00, '2024-02-23 10:00:00'),
(1002, 'BLU', 'S', 'Adidas Sports Pants', 'Blue', 'Size S', 55, 299.00, '2024-02-23 10:00:00'),
(1002, 'BLU', 'M', 'Adidas Sports Pants', 'Blue', 'Size M', 65, 299.00, '2024-02-23 10:00:00');

-- Insert order data
INSERT INTO order_details VALUES
(10001, 1001, 'BLK', 'M', 2, '2024-02-23 12:01:00'),
(10002, 1001, 'WHT', 'L', 1, '2024-02-23 12:05:00'),
(10003, 1002, 'RED', 'S', 1, '2024-02-23 12:10:00'),
(10004, 1001, 'BLK', 'L', 3, '2024-02-23 12:15:00'),
(10005, 1002, 'BLU', 'M', 2, '2024-02-23 12:20:00');

-- Create a multi-key, multi-value dictionary
CREATE DICTIONARY sku_dict USING product_sku_info
(
    product_id KEY,
    color_code KEY,
    size_code KEY,
    product_name VALUE,
    color_name VALUE,
    size_name VALUE,
    price VALUE,
    stock VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime'='300');

-- Example of a query using dict_get_many: get order details and SKU information
WITH order_sku_info AS (
    SELECT
        o.order_id,
        o.quantity,
        o.order_time,
        dict_get_many("test.sku_dict",
            ["product_name", "color_name", "size_name", "price", "stock"],
            struct(o.product_id, o.color_code, o.size_code)
        ) as sku_info
    FROM order_details o
    WHERE o.order_time >= '2024-02-23 12:00:00'
        AND o.order_time < '2024-02-23 13:00:00'
)
SELECT
    order_id,
    order_time,
    struct_element(sku_info, 'product_name') as product_name,
    struct_element(sku_info, 'color_name') as color_name,
    struct_element(sku_info, 'size_name') as size_name,
    quantity,
    struct_element(sku_info, 'price') as unit_price,
    quantity * struct_element(sku_info, 'price') as total_amount,
    struct_element(sku_info, 'stock') as current_stock
FROM order_sku_info
ORDER BY order_time;
```

```text
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
| order_id | order_time          | product_name        | color_name | size_name | quantity | unit_price | total_amount | current_stock |
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
|    10001 | 2024-02-23 12:01:00 | Nike Sports T-Shirt | Black      | Size M    |        2 |     199.00 |       398.00 |           100 |
|    10002 | 2024-02-23 12:05:00 | Nike Sports T-Shirt | White      | Size L    |        1 |     199.00 |       199.00 |            70 |
|    10003 | 2024-02-23 12:10:00 | Adidas Sports Pants | Red        | Size S    |        1 |     299.00 |       299.00 |            50 |
|    10004 | 2024-02-23 12:15:00 | Nike Sports T-Shirt | Black      | Size L    |        3 |     199.00 |       597.00 |            80 |
|    10005 | 2024-02-23 12:20:00 | Adidas Sports Pants | Blue       | Size M    |        2 |     299.00 |       598.00 |            65 |
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
```

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

| エラーの症状 | 対処方法 |
| --- | --- |
| クエリで `can not find dict name` が報告される | まず `SHOW DICTIONARIES` を実行し、Dictionary が存在するか確認します。存在する場合は、対応する Dictionary のデータを再度更新します |
| クエリで `dict_get() only support IP type for IP_TRIE` が報告される | IP_TRIE Dictionary のキー列が CIDR 形式に厳密に従っているか確認します |
| データロード時に `Version ID is not greater than the existing version ID for the dictionary.` が報告される | `DROP DICTIONARY` コマンドで該当する Dictionary を削除し、再作成してデータをロードし直します |
| `SHOW DICTIONARIES` で、特定の BE 上の Dictionary の Version が FE の Version より大きいと表示される | `DROP DICTIONARY` コマンドで該当する Dictionary を削除し、再作成してデータをロードし直します |
| データロード時に `Dictionary X commit version Y failed` が報告される | Dictionary のデータをロードし直します |

**復旧方法**：ほとんどのエラーでは、通常の操作で解決できない場合でも、Dictionary を削除して再作成することで解決できます。

## よくある質問 {#faq}

**Q1：Dictionary と通常のマテリアライズドビューはどう違いますか？**

Dictionary は、キーと値の検索を高速化するために設計された、完全にメモリ上に保持される KV 構造です。従来の JOIN 操作を `dict_get` 関数呼び出しに置き換えます。一方、マテリアライズドビューは、より一般的な事前計算を目的としています。

**Q2：Dictionary のデータとベーステーブルの間では、強い整合性が保たれますか？**

いいえ。Doris は Dictionary とベーステーブルの間で強いデータ整合性を維持しません。`data_lifetime` に基づく自動更新、または手動の `REFRESH DICTIONARY` によってデータを同期する必要があります。

**Q3：HASH_MAP ではなく IP_TRIE を選ぶべきなのはどのような場合ですか？**

CIDR に基づく IP 範囲の照合クエリが必要な場合は、IP_TRIE を使用してください。それ以外のキーと値の照合には HASH_MAP を使用してください。

**Q4：Dictionary がメモリを使いすぎる場合はどうすればよいですか？**

`memory_limit` プロパティで、単一の BE におけるメモリ使用量の上限を設定できます。また、Dictionary が大きくなりすぎないように、作成元にはカーディナリティが適度な列を選ぶことを推奨します。

**Q5：Dictionary のクエリで null が返される原因には何がありますか？**

クエリするキーが Dictionary に存在しない場合、またはクエリするキーのデータが null の場合、null が返されます。
