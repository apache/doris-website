---
title: ディクショナリによる JOIN クエリの高速化
sidebar_label: ディクショナリによる高速化
language: ja
description: Doris のディクショナリを使ってディメンションテーブルとの JOIN をメモリ内のキーと値の検索に置き換え、クエリの性能を向上させます。
keywords:
    - Doris ディクショナリ
    - ディクショナリ
    - JOIN の高速化
    - ディメンションテーブルのクエリ
    - dict_get
    - HASH_MAP
    - IP_TRIE
    - キーと値の検索
---

<!-- Knowledge type: Feature definition / Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Query performance tuning / Dimension table join acceleration -->

ディクショナリは、JOIN 操作を高速化するために Doris が提供する特殊なデータ構造です。通常のテーブルを基に作成され、ソーステーブルの対象列をキーと値の関係として扱います。これらの列のデータをすべてメモリに事前ロードすることで高速な検索を可能にし、クエリの性能を向上させます。

ディクショナリは、キーと値の検索を頻繁に行う場合に特に適しています。キーと値の検索に使うため、キーの重複は許可されません。

:::tip
この機能は実験的な機能であり、バージョン 4.1.0 以降でサポートされています。
:::

## ユースケース

<!-- Knowledge type: Architecture selection decision -->

ディクショナリは主に次の場合に適しています。

1. キーと値の検索を頻繁に行う場合
2. ディメンションテーブル全体がメモリに収まるほど小さい場合
3. データの更新頻度が比較的低い場合

従来 LEFT OUTER JOIN で実現していたキーと値の検索は、ディクショナリを使うと通常の関数呼び出しに置き換わり、JOIN のオーバーヘッドをなくせます。

### シナリオ例

EC システムでは、注文テーブル（ファクトテーブルである `orders`）に大量の取引データが記録されています。商品の詳細情報を取得するために、商品テーブル（ディメンションテーブルである `products`）との JOIN が頻繁に必要になります。

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

カテゴリごとの注文数と売上合計を集計するには、従来は LEFT OUTER JOIN を使って商品テーブルから商品情報を取得する必要がありました。

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

このようなクエリでは、`product_id` を基にほかの商品情報を頻繁に検索します。これは実質的にキーと値の検索です。

**ステップ 3：JOIN の代わりにディクショナリを使う**

キーと値の関係を定義したら、対応するディクショナリを事前に作成できます。これにより、従来の JOIN 操作をより軽量なキーと値の検索に置き換え、SQL の実行効率を高められます。

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

ディクショナリを使うと、元のクエリの JOIN 操作は軽量なキーと値の検索である `dict_get` 関数の呼び出しに変わります。

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

## ディクショナリの定義

<!-- Knowledge type: Configuration parameters / Operation steps -->

### 基本構文

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
| `<dict_name>` | ディクショナリ名 |
| `<source_table>` | ソースデータテーブル |
| `<key_column>` | ソーステーブルでキーとして使う列名 |
| `<value_column>` | ソーステーブルで値として使う列名 |
| `<layout_type>` | ディクショナリのストレージレイアウトの種類。詳細は以下を参照 |
| `<priority_item_key>` | ディクショナリのプロパティ名 |
| `<priority_item_value>` | ディクショナリのプロパティ値 |

`<key_column>` と `<value_column>` はそれぞれ少なくとも一つ必要です。`<key_column>` を `<value_column>` より前に置く必要はありません。

### レイアウトの種類

現在、次の二種類のレイアウトをサポートしています。

| レイアウトの種類 | 用途 | 説明 |
| --- | --- | --- |
| `HASH_MAP` | 一般的なキーと値の検索 | ハッシュテーブルを使った実装 |
| `IP_TRIE` | IP アドレスの検索 | IP アドレス検索向けに最適化されたトライ木を使った実装。キー列には CIDR 表記の IP アドレスを指定し、クエリでは CIDR 表記に対して照合します |

### プロパティ {#properties}

| プロパティ | 値の型 | 意味 | 必須 |
| --- | --- | --- | --- |
| `data_lifetime` | 整数（秒） | データの有効期間。ディクショナリの最終更新からこの時間が経過し、かつベーステーブルのデータが変更されている場合、自動的に再インポートされます。インポートの仕組みについては[自動インポート](#auto-import)を参照してください | はい |
| `skip_null_key` | 真偽値 | ディクショナリへのデータロード時にキー列に NULL 値がある場合、`true` ならその行をスキップし、それ以外ならエラーになります。デフォルトは `false` です | いいえ |
| `memory_limit` | 整数（バイト） | 単一 BE でディクショナリが使用できるメモリの上限。デフォルトは `2147483648`（2GB）です | いいえ |

### 作成例

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

このテーブルを基に、`city_dict` ディクショナリと `dict_get` 関数を使い、対応する `id` を `city`（`source_table` の列）の値から検索できます。

### 使用上の制約

**1. キー列の制約**

- IP_TRIE ディクショナリのキー列は Varchar 型または String 型である必要があり、**キー列の値は CIDR 形式でなければなりません**。
- IP_TRIE ディクショナリで指定できるキー列は一つだけです。
- HASH_MAP ディクショナリのキー列では、すべての単純型をサポートします（Map や Array などのネストした型は対象外です）。
- キー列として使う列には、**ソーステーブル内で重複する値を含められません**。重複があると、ディクショナリへのデータロード時にエラーになります。

**2. NULL 値の扱い**

- ディクショナリのすべての列には Nullable 列を使用できます。ただし、キー列に実際の NULL 値が含まれないようにしてください。含まれる場合の動作は、`skip_null_key` の設定によって決まります（[プロパティ](#properties)を参照）。

## 使用方法と管理

### データのロード（更新）

<!-- Knowledge type: Operation steps -->

ディクショナリは自動ロードと手動ロードの両方をサポートします。ディクショナリのロードは「更新（refresh）」とも呼びます。

#### 自動インポート {#auto-import}

自動ロードは次のタイミングで実行されます。

1. ディクショナリの作成後
2. ディクショナリのデータの有効期間が切れたとき（[プロパティ](#properties)を参照）
3. BE の状態から、このディクショナリのデータが欠けていると判明したとき（新しい BE が稼働を開始した場合や、既存の BE が再起動した場合など）

Doris は `dictionary_auto_refresh_interval_seconds` 秒ごとに、すべてのディクショナリのデータが有効期間切れかどうかを確認します。ディクショナリの最終更新から `data_lifetime` 秒を超え、**前回のロード以降にベーステーブルのデータが変更されている場合**、Doris はそのディクショナリのロードを自動的に投入します。

一部の BE にデータがなく、前回のロード以降にベーステーブルのデータが変更されていない場合、Doris は影響を受けた BE に現行バージョンのデータだけを補充します。すべての BE を対象とする更新タスクは投入されず、ディクショナリのバージョンも変わりません。

#### 手動インポート

- **目的**：ディクショナリデータの更新を手動で開始します。
- **コマンド**：

    ```sql
    REFRESH DICTIONARY <dict_name>;
    ```

- **説明**：`<dict_name>` は、データをロードするディクショナリの名前です。

#### ロード時の注意事項

1. ディクショナリはデータのロードが完了してからクエリできます。
2. ロード時にキー列に重複する値があると、ロードトランザクションは失敗します。
3. ロードトランザクションがすでに進行中で、ディクショナリの Status が `LOADING` の場合、手動ロードは失敗します。進行中のロードが完了してから再試行してください。
4. ロードしたディクショナリのサイズが設定済みの `memory_limit` を超えると、ロードトランザクションは失敗します。

### ディクショナリのクエリ

<!-- Knowledge type: Operation steps -->

キー列と値列がそれぞれ一つのディクショナリは `dict_get` 関数で、キー列または値列が複数あるディクショナリは `dict_get_many` 関数でクエリできます。

最初にクエリする前に、ディクショナリのロードが完了するまで待ってください。

#### 構文

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```

パラメータの説明：

| パラメータ | 説明 |
| --- | --- |
| `<db_name>` | ディクショナリが属するデータベース名 |
| `<dict_name>` | ディクショナリ名 |
| `<query_column>` | 検索する値列の名前。型は `VARCHAR` で、**定数でなければなりません** |
| `<query_columns>` | 検索するすべての値列の名前。型は `ARRAY<VARCHAR>` で、**定数でなければなりません** |
| `<query_key_value>` | クエリに使用するキー列のデータ |
| `<query_key_values>` | ディクショナリの**すべてのキー列**について、検索に使用するデータを格納した STRUCT |

戻り値の型：

- `dict_get` の戻り値の型は、`<query_column>` に対応するディクショナリ列の型です。
- `dict_get_many` の戻り値の型は [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT) で、`<query_columns>` に対応するディクショナリ列の型で構成されます。

#### クエリ例

**例 1：単一キーと単一の値のクエリ**

`city_dict` ディクショナリ（`test_db` データベース内）をクエリし、キー列の値が「Beijing」のときの `id` の値を取得します。

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

**例 2：単一キーと複数の値のクエリ**

`single_key_dict` ディクショナリ（`test_db` データベース内）をクエリし、キー列の値が 1 のときの `k1` 列と `k3` 列の値を取得します。

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

**例 3：複数のキーと複数の値のクエリ**

`multi_key_dict` ディクショナリ（`test_db` データベース内）をクエリし、二つのキー列の値がそれぞれ 2 と 'ABC' のときの `k2` 列と `k3` 列の値を取得します。

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

たとえば、テーブルの作成文が次の場合：

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

前述のステートメント

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

の戻り値の型は `STRUCT<float, varchar>` です。

#### クエリ時の注意事項

1. 検索したキーのデータがディクショナリに存在しない場合、**またはキーのデータが NULL の場合**、NULL を返します。
2. IP_TRIE ディクショナリをクエリする場合、**`<query_key_value>` の型は `IPV4` または `IPV6` でなければなりません**。
3. IP_TRIE ディクショナリでは、キー列 `<key_column>` のデータとクエリに使用する `<query_key_value>` の両方で、`IPV4` 形式と `IPV6` 形式をサポートします。
4. BE が新たに稼働を開始したか、停止後に再起動したために、その BE にディクショナリデータがない場合、当該 BE にスケジュールされたクエリは失敗します。クエリがどの BE にスケジュールされるかは複数の要因で決まります。FE Master の負荷が高くない場合は、[設定項目](#configuration-items) `dictionary_auto_refresh_interval_seconds` を小さくすると、ディクショナリを利用できない期間を短縮できます。

### ディクショナリの管理

<!-- Knowledge type: Operation steps -->

ディクショナリの管理と確認には、次のステートメントを使用できます。

**1. 現在のデータベース内のすべてのディクショナリの状態を表示する**

```sql
SHOW DICTIONARIES [LIKE <LIKE_NAME>];
```

**2. 特定のディクショナリの定義を表示する**

```sql
DESC DICTIONARY <dict_name>;
```

**3. ディクショナリを削除する**

```sql
DROP DICTIONARY <dict_name>;
```

ディクショナリを削除しても、BE からすぐには削除されない場合があります。

#### 設定項目 {#configuration-items}

ディクショナリでは以下の設定項目をサポートします。いずれも FE CONFIG です。

| 設定項目 | デフォルト値 | 動的に変更可能 | 説明 |
| --- | --- | --- | --- |
| `dictionary_task_queue_size` | 1024 | いいえ | すべてのディクショナリタスクに使うスレッドプールのキュー長。通常は変更不要です |
| `job_dictionary_task_consumer_thread_num` | 3 | いいえ | すべてのディクショナリタスクに使うスレッドプールのスレッド数 |
| `dictionary_rpc_timeout_ms` | 5000 (5s) | はい | ディクショナリ関連のすべての RPC のタイムアウト。通常は変更不要です |
| `dictionary_auto_refresh_interval_seconds` | 5 (秒) | はい | すべてのディクショナリのデータが有効期間切れかどうかを自動的に確認する間隔 |

### 状態の表示

`SHOW DICTIONARIES` ステートメントには、各ディクショナリに対応するベーステーブル、現在のデータバージョン番号、FE と BE の状態が表示されます。

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

フィールドの意味：

1. `Version`：データのバージョン番号。データをロードするたびに 1 ずつ増加します。
2. `Status`：ディクショナリの状態。意味は以下のとおりです。

    | 状態名 | 意味 |
    | --- | --- |
    | NORMAL | ディクショナリは正常な状態です |
    | LOADING | ディクショナリのデータをロード中です |
    | OUT_OF_DATE | ディクショナリのデータは有効期間切れです |

    ロードの進行中に、同じディクショナリを再びロードすることはできません。

3. `DataDistribution`：各 BE の現在の状態。バージョン番号とメモリ使用量（KB）を含みます。
4. `LastUpdateResult`：前回のロード（自動または手動）の結果。エラーが発生した場合は、ここに詳細が表示されます。

ディクショナリの列定義を確認するには、`DESC DICTIONARY` を使用します。例：

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | Type        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```

## 注意事項

<!-- Knowledge type: Best practices -->

### データの整合性

- ディクショナリを更新するたびに新しいバージョンが作成されます。クエリ時に BE が記録しているバージョンと FE のバージョンが異なると、クエリは失敗します。
- Doris はディクショナリとベーステーブルの間に強いデータ整合性を維持しません。自動更新のためにディクショナリの `data_lifetime` を適切に設定し、必要に応じてビジネスロジックに基づく手動更新を併用してください。
- ソーステーブルが何らかの方法で削除されると、対応するディクショナリも自動的に削除されます。

### 性能上の考慮事項

- ディクショナリは、ディメンションテーブルのデータなど、比較的変更の少ないデータに適しています。
- ディクショナリは完全にメモリ内に置かれるテーブルで、その全データがすべての BE のメモリに保存されます。そのため、多くのメモリを消費します。メモリ使用量とクエリ性能のバランスを考え、ディクショナリの基となるテーブルを選んでください。

### ベストプラクティス

1. **キー列と値列を適切に選ぶ**：

    - キーにはカーディナリティが適度な列を選んでください。

2. **レイアウトを選ぶ**：

    - 一般的な用途では HASH_MAP レイアウトを使用します。
    - IP アドレス範囲の照合には IP_TRIE レイアウトを使用します。

3. **状態を管理する**：

    - ディクショナリのメモリ使用量を定期的に監視してください。
    - 適切なデータ更新間隔を選び、データが古くなったと分かっている場合はアプリケーション側からディクショナリを手動で更新してください。
    - ディクショナリを使う場合は、BE のメモリを監視してください。ディクショナリの数が多すぎたり、サイズが大きすぎたりすると、メモリを使いすぎて BE が異常な状態になる可能性があります。

## 完全な使用例

<!-- Knowledge type: Operation steps -->

### 例 1：HASH_MAP、単一キーと単一の値

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

### 例 2：IP_TRIE、CIDR に基づく IP 検索

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

### 例 3：HASH_MAP、複数のキーと複数の値

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

## トラブルシューティング

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

| エラーの症状 | 対処方法 |
| --- | --- |
| クエリで `can not find dict name` と報告される | まず `SHOW DICTIONARIES` を実行し、ディクショナリが存在するか確認します。存在する場合は、対応するディクショナリのデータを再度更新します |
| クエリで `dict_get() only support IP type for IP_TRIE` と報告される | IP_TRIE ディクショナリのキー列が CIDR 形式に厳密に従っているか確認します |
| ロードで `Version ID is not greater than the existing version ID for the dictionary.` と報告される | `DROP DICTIONARY` コマンドで対応するディクショナリを削除し、再作成してデータを再ロードします |
| `SHOW DICTIONARIES` で特定の BE 上のディクショナリの Version が FE の Version より大きいと表示される | `DROP DICTIONARY` コマンドで対応するディクショナリを削除し、再作成してデータを再ロードします |
| ロードで `Dictionary X commit version Y failed` と報告される | ディクショナリを再ロードします |

**復旧方法**：ほとんどのエラーでは、通常の操作で解決しない場合、ディクショナリを削除して再作成すると解決できます。

## よくある質問

**Q1：ディクショナリと通常のマテリアライズドビューの違いは何ですか？**

ディクショナリは、キーと値の検索を高速化し、従来の JOIN 操作を `dict_get` 関数の呼び出しに置き換えるための、完全にメモリ内に置かれる KV 構造です。一方、マテリアライズドビューは、より一般的な事前計算を目的としています。

**Q2：ディクショナリのデータはベーステーブルと強い整合性を保ちますか？**

いいえ。Doris はディクショナリとベーステーブルの間に強いデータ整合性を維持しません。`data_lifetime` による自動更新、または手動の `REFRESH DICTIONARY` でデータを同期する必要があります。

**Q3：HASH_MAP ではなく IP_TRIE を選ぶべきなのはどのような場合ですか？**

CIDR に基づく IP アドレス範囲の照合が必要な場合は IP_TRIE を使用します。それ以外のキーと値の照合には HASH_MAP を使用します。

**Q4：ディクショナリがメモリを使いすぎる場合はどうすればよいですか？**

`memory_limit` プロパティを使うと、単一 BE で使用できるメモリの上限を設定できます。また、ディクショナリが大きくなりすぎないように、カーディナリティが適度な列を選ぶことを推奨します。

**Q5：ディクショナリのクエリが NULL を返す原因は何ですか？**

検索したキーがディクショナリに存在しない場合、または検索したキーのデータが NULL の場合、NULL を返します。
