---
title: Dictionary で JOIN クエリを高速化する
sidebar_label: Dictionary による高速化
language: ja
description: Doris Dictionary を使用してディメンションテーブルとの JOIN をメモリ内のキーと値の検索に変換し、クエリ性能を向上させます。
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

Dictionary は、JOIN 処理を高速化するために Doris が提供する特別なデータ構造です。通常のテーブルを基に構築され、ソーステーブルの対象列をキーと値の関係として扱います。これらの列の全データをあらかじめメモリにロードすることで高速な検索を可能にし、クエリ性能を向上させます。

Dictionary は、キーと値を頻繁に検索する場面に特に適しています。キーと値の検索に使うため、キーの重複は許されません。

:::tip
この機能は実験的なもので、バージョン 4.1.0 からサポートされています。
:::

## ユースケース {#use-cases}

<!-- Knowledge type: Architecture selection decision -->

Dictionary は主に次のような場面に適しています。

1. キーと値を頻繁に検索する場合
2. ディメンションテーブル全体をメモリに収められる場合
3. データの更新頻度が比較的低い場合

従来 LEFT OUTER JOIN で実装していたキーと値の検索は、Dictionary を使うことで JOIN のオーバーヘッドをなくし、通常の関数呼び出しに置き換えられます。

### シナリオ例 {#scenario-example}

EC システムでは、注文テーブル（ファクトテーブルの `orders`）に大量の取引データが記録されています。商品の詳細情報を取得するために、商品テーブル（ディメンションテーブルの `products`）と頻繁に JOIN する必要があります。

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

**ステップ 2：従来の JOIN を使う方法**

カテゴリごとの注文数と売上総額を集計するには、従来は LEFT OUTER JOIN を使って商品テーブルから商品情報を取得する必要がありました。

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

この種のクエリでは、`product_id` を使ってほかの商品情報を頻繁に検索します。これは実質的に KV 検索です。

**ステップ 3：JOIN の代わりに Dictionary を使う**

キーと値の関係を定義したら、対応する Dictionary をあらかじめ構築できます。これにより、従来の JOIN 処理を軽量なキーと値の検索に置き換え、SQL の実行効率を向上させられます。

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

Dictionary を使うと、元のクエリの JOIN 処理は `dict_get` 関数による軽量な KV 検索に変わります。

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

4.1.5 以降、Dictionary の作成には対象の Dictionary オブジェクトに対する `CREATE` 権限と、ソーステーブルに対する `SELECT` 権限が必要です。削除には Dictionary オブジェクトに対する `DROP` 権限が必要です。ソースが外部 Catalog に属する場合は、ソーステーブルの権限も確認されます。

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
| `<source_table>` | ソースデータのテーブル |
| `<key_column>` | キーとして使うソーステーブルの列名 |
| `<value_column>` | 値として使うソーステーブルの列名 |
| `<layout_type>` | Dictionary の保存レイアウトの種類。詳細は後述 |
| `<priority_item_key>` | Dictionary のプロパティ名 |
| `<priority_item_value>` | Dictionary のプロパティ値 |

`<key_column>` と `<value_column>` は、それぞれ少なくとも 1 つ必要です。`<key_column>` を `<value_column>` より前に記述する必要はありません。

### レイアウトの種類 {#layout-types}

現在、次のレイアウトをサポートしています。

| レイアウト | 用途 | 説明 |
| --- | --- | --- |
| `HASH_MAP` | 一般的なキーと値の検索 | ハッシュテーブルによる実装 |
| `IP_TRIE` | IP アドレスの検索 | IP アドレス検索向けに最適化された Trie による実装。キー列には CIDR 表記の IP アドレスを指定する必要があり、クエリはその CIDR 表記に対して照合される |

### プロパティ {#properties}

| プロパティ | 値の型 | 意味 | 必須 |
| --- | --- | --- | --- |
| `data_lifetime` | 整数、単位は秒 | データの有効期間。Dictionary の最終更新からこの期間を超え、かつ基となるテーブルのデータに変更があると、自動的に再インポートされる。インポートの仕組みについては[自動インポート](#auto-import)を参照 | はい |
| `skip_null_key` | 真偽値 | Dictionary へのデータロード時にキー列が null の行があった場合、`true` ならその行をスキップし、それ以外の場合はエラーを報告する。デフォルトは `false` | いいえ |
| `memory_limit` | 整数、単位はバイト | 単一の BE で Dictionary が使用するメモリの上限。デフォルトは `2147483648`、つまり 2GB | いいえ |

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

このテーブルを基にした `city_dict` Dictionary と `dict_get` 関数を組み合わせると、`source_table` の `city` の値から、対応する `id` を検索できます。

### 使用上の制約 {#usage-restrictions}

**1. キー列の制約**

- IP_TRIE Dictionary のキー列は Varchar 型または String 型で、**キー列の値は CIDR 形式でなければなりません**。
- IP_TRIE Dictionary で指定できるキー列は 1 つだけです。
- HASH_MAP Dictionary のキー列はすべての単純型をサポートします（Map や Array などのネストされた型は除きます）。
- キー列として使う列の値は、**ソーステーブル内で重複していてはなりません**。重複していると、Dictionary へのデータロード時にエラーが報告されます。

**2. null 値の扱い**

- Dictionary のすべての列は Nullable 列にできますが、キー列に null 値が実際に含まれることは避けてください。含まれる場合の動作は、[プロパティ](#properties)の `skip_null_key` によって決まります。

## 使用と管理 {#usage-and-management}

### データのロード（更新） {#loading-refreshing-data}

<!-- Knowledge type: Operation steps -->

Dictionary は自動データロードと手動データロードの両方に対応しています。Dictionary へのデータロードは「更新」とも呼びます。

#### 自動インポート {#auto-import}

自動データロードは、次の場合に行われます。

1. Dictionary の作成後
2. Dictionary のデータの有効期間が切れたとき（[プロパティ](#properties)を参照）
3. BE の状態から、この Dictionary のデータが存在しないと判明したとき（新しい BE が稼働を始めた場合や、既存の BE が再起動した場合など）

Doris は `dictionary_auto_refresh_interval_seconds` 秒ごとに、すべての Dictionary のデータが期限切れかどうかを確認します。Dictionary が `data_lifetime` 秒を超えて更新されておらず、**前回のデータロード後に基となるテーブルのデータが変更されている場合**、Doris はその Dictionary のデータロードを自動的に実行します。

一部の BE にデータがなく、前回のデータロード後に基となるテーブルのデータが変更されていない場合、Doris は影響を受けた BE に現在のバージョンのデータだけを補充します。すべての BE を対象とする更新タスクは実行されず、Dictionary のバージョンも変わりません。

#### 手動インポート {#manual-import}

- **目的**：Dictionary データの更新を手動で開始します。
- **コマンド**：

    ```sql
    REFRESH DICTIONARY <dict_name>;
    ```

- **説明**：`<dict_name>` は、データをロードする Dictionary の名前です。

#### データロード時の注意事項 {#notes-for-loading}

1. Dictionary は、データロードが完了してからクエリで使用できます。
2. データロード中にキー列に重複値が見つかると、ロードトランザクションは失敗します。
3. すでにロードトランザクションが進行中の場合（Dictionary の Status が `LOADING` の場合）、手動データロードは失敗します。進行中のデータロードが完了してから再試行してください。
4. ロードした Dictionary のサイズが設定済みの `memory_limit` を超えると、ロードトランザクションは失敗します。

### Dictionary をクエリする {#querying-a-dictionary}

<!-- Knowledge type: Operation steps -->

単一のキー列と値列を持つ Dictionary は `dict_get` 関数で、複数のキー列または値列を持つ Dictionary は `dict_get_many` 関数でクエリできます。

最初にクエリする際は、Dictionary のデータロードが完了するまで待ってください。

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
| `<query_column>` | 検索対象の値列の名前。型は `VARCHAR` で、**定数でなければならない** |
| `<query_columns>` | 検索対象となるすべての値列の名前。型は `ARRAY<VARCHAR>` で、**定数でなければならない** |
| `<query_key_value>` | クエリに使用するキー列のデータ |
| `<query_key_values>` | Dictionary の**すべてのキー列**について、検索するデータを含む STRUCT |

戻り値の型：

- `dict_get` の戻り値の型は、`<query_column>` に対応する Dictionary の列の型です。
- `dict_get_many` の戻り値の型は、`<query_columns>` に対応する Dictionary の列の型で構成される [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT) です。

#### クエリの例 {#query-examples}

**例 1：単一キー、単一値のクエリ**

`test_db` データベースの `city_dict` Dictionary をクエリし、キー列の値が "Beijing" のときの `id` の値を取得します。

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

**例 2：単一キー、複数値のクエリ**

`test_db` データベースの `single_key_dict` Dictionary をクエリし、キー列の値が 1 のときの `k1` 列と `k3` 列の値を取得します。

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

**例 3：複数キー、複数値のクエリ**

`test_db` データベースの `multi_key_dict` Dictionary をクエリし、キー列の値がそれぞれ 2 と 'ABC' のときの `k2` 列と `k3` 列の値を取得します。

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

1. 検索するキーのデータが Dictionary に存在しない場合、**またはキーのデータが null の場合**、null が返されます。
2. IP_TRIE Dictionary をクエリする場合、**`<query_key_value>` の型は `IPV4` または `IPV6` でなければなりません**。
3. IP_TRIE Dictionary を使用する場合、キー列 `<key_column>` のデータとクエリに使用する `<query_key_value>` は、どちらも `IPV4` と `IPV6` の両方の形式をサポートします。
4. 新たに稼働を始めた、または停止後に再起動した BE に Dictionary のデータがまだない場合、その BE に割り当てられた Dictionary のクエリは失敗します。クエリがその BE に割り当てられるかどうかは複数の要因によって決まります。FE Master の負荷が高くなければ、[設定項目](#configuration-items) `dictionary_auto_refresh_interval_seconds` を小さくすることで、Dictionary を利用できない期間を短縮できます。

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

Dictionary を削除しても、BE からすぐには削除されない場合があります。

#### 設定項目 {#configuration-items}

Dictionary は次の設定項目に対応しています。いずれも FE CONFIG です。

| 設定項目 | デフォルト値 | 動的変更 | 説明 |
| --- | --- | --- | --- |
| `dictionary_task_queue_size` | 1024 | 不可 | すべての Dictionary タスクに使用するスレッドプールのキュー長。通常は変更不要 |
| `job_dictionary_task_consumer_thread_num` | 3 | 不可 | すべての Dictionary タスクに使用するスレッドプールのスレッド数 |
| `dictionary_rpc_timeout_ms` | 5000（5 秒） | 可 | Dictionary 関連のすべての RPC のタイムアウト。通常は変更不要 |
| `dictionary_auto_refresh_interval_seconds` | 5（秒） | 可 | すべての Dictionary のデータが期限切れかどうかを自動的に確認する間隔 |

### 状態の表示 {#status-display}

`SHOW DICTIONARIES` 文には、各 Dictionary に対応する基となるテーブル、現在のデータのバージョン番号、および FE と BE での状態が表示されます。

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

1. `Version`：データのバージョン番号。データロードのたびに 1 ずつ増加します。
2. `Status`：Dictionary の状態。各値の意味は次のとおりです。

    | 状態名 | 意味 |
    | --- | --- |
    | NORMAL | Dictionary は正常な状態 |
    | LOADING | Dictionary はデータロード中 |
    | OUT_OF_DATE | Dictionary のデータは期限切れ |

    データロードが進行中の Dictionary に対して、新たなデータロードは実行できません。

3. `DataDistribution`：各 BE の現在の状態。バージョン番号とメモリ使用量（KB）を含みます。
4. `LastUpdateResult`：前回のデータロードの結果（自動・手動のいずれか）。エラーがあった場合は詳細が表示されます。

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

- Dictionary を更新するたびに新しいバージョンが作成されます。クエリ中に BE に記録されたバージョンと FE のバージョンが異なる場合、そのクエリは失敗します。
- Doris は Dictionary と基となるテーブルの間で強いデータ整合性を維持しません。自動更新が適切に行われるよう Dictionary の `data_lifetime` を設定し、必要に応じて業務ロジックに基づく手動更新を併用してください。
- ソーステーブルが何らかの方法で削除されると、対応する Dictionary も自動的に削除されます。

### 性能に関する考慮事項 {#performance-considerations}

- Dictionary は、ディメンションテーブルのデータなど、比較的更新の少ないデータに適しています。
- Dictionary は完全にメモリ上に置かれるテーブルで、その全データがすべての BE のメモリに保存されるため、多くのメモリを使用します。メモリ使用量とクエリ性能のバランスを考慮し、Dictionary のソースに適したテーブルを選んでください。

### ベストプラクティス {#best-practices}

1. **キー列と値列を適切に選ぶ**：

    - カーディナリティが適度な列をキーに選びます。

2. **レイアウトを選ぶ**：

    - 一般的な用途には HASH_MAP レイアウトを使用します。
    - IP アドレス範囲の照合には IP_TRIE レイアウトを使用します。

3. **状態を管理する**：

    - Dictionary のメモリ使用量を定期的に監視します。
    - 適切なデータ更新間隔を選び、データが古くなったとわかっている場合は、業務側で Dictionary を手動更新します。
    - Dictionary を使用する際は BE のメモリ使用量を監視し、Dictionary の数やサイズが大きすぎてメモリを過度に消費し、BE の状態に異常が生じないようにします。

## 完全な使用例 {#complete-examples}

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
| クエリで `can not find dict name` と報告される | まず `SHOW DICTIONARIES` を実行して Dictionary が存在するか確認する。存在する場合は、対応する Dictionary のデータを再度更新する |
| クエリで `dict_get() only support IP type for IP_TRIE` と報告される | IP_TRIE Dictionary のキー列が CIDR 形式に厳密に従っているか確認する |
| データロードで `Version ID is not greater than the existing version ID for the dictionary.` と報告される | `DROP DICTIONARY` コマンドで該当する Dictionary を削除し、再作成してデータをロードし直す |
| `SHOW DICTIONARIES` で、特定の BE 上の Dictionary の Version が FE の Version より大きいと表示される | `DROP DICTIONARY` コマンドで該当する Dictionary を削除し、再作成してデータをロードし直す |
| データロードで `Dictionary X commit version Y failed` と報告される | Dictionary のデータをロードし直す |

**復旧方法**：ほとんどのエラーでは、通常の操作で解決できない場合でも、Dictionary を削除して再作成することで解決できます。

## よくある質問 {#faq}

**Q1：Dictionary と通常のマテリアライズドビューには、どのような違いがありますか？**

Dictionary は純粋なメモリ内の KV 構造で、キーと値の検索を高速化し、従来の JOIN 処理を `dict_get` 関数の呼び出しに変換するために設計されています。一方、マテリアライズドビューは、より一般的な事前計算を目的としています。

**Q2：Dictionary のデータと基となるテーブルの間では、強い整合性が維持されますか？**

いいえ。Doris は Dictionary と基となるテーブルの間で強いデータ整合性を維持しません。`data_lifetime` による自動更新、または手動の `REFRESH DICTIONARY` によってデータを同期する必要があります。

**Q3：HASH_MAP ではなく IP_TRIE を選ぶべきなのは、どのような場合ですか？**

CIDR に基づく IP アドレス範囲の照合が必要な場合は IP_TRIE を使用します。それ以外のキーと値の照合には HASH_MAP を使用します。

**Q4：Dictionary がメモリを使いすぎる場合は、どうすればよいですか？**

`memory_limit` プロパティを使用して、単一の BE で使用するメモリの上限を設定できます。また、Dictionary が大きくなりすぎないよう、カーディナリティが適度な列をソースとして選ぶことを推奨します。

**Q5：Dictionary のクエリが null を返す理由として、何が考えられますか？**

検索するキーが Dictionary に存在しない場合、または検索するキーのデータが null の場合、null が返されます。
