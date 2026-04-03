---
{
  "title": "Dictionary table（実験的機能）",
  "description": "Dictionary は、JOIN操作を高速化するためにDorisが提供する特別なデータ構造です。これは通常のtableをベースに構築されます。",
  "language": "ja"
}
---
## 概要

Dictionaryは、JOIN操作を高速化するためにDorisが提供する特別なデータ構造です。通常のtableを基盤として構築され、元のtableの対応する列をキー・バリューの関係として扱い、これらの列のすべてのデータを事前にメモリにロードして高速な検索操作を実現し、クエリパフォーマンスを向上させます。頻繁なキー・バリュー検索が必要なシナリオに特に適しています。

当然ながら、キー・バリュー検索ソリューションとして、dictionaryTableは重複キーを許可しません。

## 使用シナリオ

dictionaryテーブは主に以下のシナリオに適しています：

1. 頻繁なキー・バリュー検索が必要なシナリオ
2. ディメンションtableが小さく、完全にメモリにロードできる場合
3. データ更新の頻度が比較的低いシナリオ

元々LEFT OUTER JOINを使用して実装する必要があったキー・バリュー検索は、dictionaryTableの助けを借りて完全に排除でき、通常の関数呼び出しに変換できます。以下は完全なシナリオの例です：

### シナリオの例

eコマースシステムでは、注文table（`orders`、ファクトtable）が大量の取引データを記録し、詳細な商品情報を取得するために商品table（`products`、ディメンションtable）と頻繁に関連付けを行う必要があります。

```sql
-- Product Dimension Table
CREATE TABLE products (
    product_id BIGINT NOT NULL COMMENT "商品ID",
    product_name VARCHAR(128) NOT NULL COMMENT "商品名称",
    brand_name VARCHAR(64) NOT NULL COMMENT "品牌名称",
    category_name VARCHAR(64) NOT NULL COMMENT "品类名称",
    retail_price DECIMAL(10,2) NOT NULL COMMENT "零售价",
    update_time DATETIME NOT NULL COMMENT "更新时间"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order Fact Table
CREATE TABLE orders (
    order_id BIGINT NOT NULL COMMENT "订单ID",
    product_id BIGINT NOT NULL COMMENT "商品ID",
    user_id BIGINT NOT NULL COMMENT "用户ID",
    quantity INT NOT NULL COMMENT "购买数量",
    actual_price DECIMAL(10,2) NOT NULL COMMENT "实际成交价",
    order_time DATETIME NOT NULL COMMENT "下单时间"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 32;

INSERT INTO products VALUES
(1001, 'iPhone 15 Pro 256G 黑色', 'Apple', '手机数码', 8999.00, '2024-01-01 00:00:00'),
(1002, 'MacBook Pro M3 Max', 'Apple', '电脑办公', 19999.00, '2024-01-01 00:00:00'),
(1003, 'AirPods Pro 2', 'Apple', '手机配件', 1999.00, '2024-01-01 00:00:00');

INSERT INTO orders VALUES
(10001, 1001, 88001, 1, 8899.00, '2024-02-22 10:15:00'),
(10002, 1002, 88002, 1, 19599.00, '2024-02-22 11:30:00'),
(10003, 1003, 88001, 2, 1899.00, '2024-02-22 14:20:00');
```
以下は典型的なクエリのセットです。各カテゴリの注文数量と売上を集計するために、過去には商品Tableから商品情報を取得する機能を実現するためにLEFT OUTER JOINを使用する必要がありました。

```sql
-- Analyze the order volume and sales revenue of each category
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
+---------------+------------+-------------+----------------+--------------+
| category_name | brand_name | order_count | total_quantity | total_amount |
+---------------+------------+-------------+----------------+--------------+
| 电脑办公      | Apple      |           1 |              1 |     19599.00 |
| 手机数码      | Apple      |           1 |              1 |      8899.00 |
| 手机配件      | Apple      |           1 |              2 |      3798.00 |
+---------------+------------+-------------+----------------+--------------+
```
このようなクエリでは、`product_id`を使用して製品に関する他の情報を頻繁に取得する必要があり、これは本質的にKVルックアップ操作を伴います。

キーバリューペアの関係を設定し、対応する辞書Tableを事前に構築することで、以前のJOIN操作を完全により軽量なキーバリュールックアップに変換でき、それによりSQLの実行効率を向上させることができます：

```sql
-- Create product information dictionary
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
    'data_lifetime'='300'  -- Considering the frequency of changes in product information, set the update interval to 5 minutes.
);
```
元のクエリは、JOIN操作を辞書Tableを使用した`dict_get`関数ルックアップに変換します。これはより軽量なKVルックアップ操作です：

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
+---------------+------------+-------------+----------------+--------------+
| category_name | brand_name | order_count | total_quantity | total_amount |
+---------------+------------+-------------+----------------+--------------+
| 电脑办公      | Apple      |           1 |              1 |     19599.00 |
| 手机数码      | Apple      |           1 |              1 |      8899.00 |
| 手机配件      | Apple      |           1 |              2 |      3798.00 |
+---------------+------------+-------------+----------------+--------------+
```
## Dictionary Table Definition

### 基本文法

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
以下のうち：

- `<dict_name>`: 辞書Tableの名前
- `<source_table>`: ソースデータTable
- `<key_column>`: キーとして機能するソースTable内のカラム名
- `<value_column>`: 値として機能するソースTable内のカラム名
- `<layout_type>`: 辞書Tableのストレージレイアウトタイプ、詳細は後述
- `<priority_item_key>`: Tableの特定のプロパティの名前
- `<priority_item_value>`: Tableの特定のプロパティの値

`<key_column>` と `<value_column>` はそれぞれ最低1つ必要です。`<key_column>` は `<value_column>` より前に現れる必要はありません。

### Layout タイプ

現在、2つのレイアウトタイプがサポートされています：

- `HASH_MAP`: ハッシュTableベースの実装で、一般的なキー-値検索シナリオに適しています。

- `IP_TRIE`: Trieツリーベースの実装で、IPアドレスタイプの検索に特化して最適化されています。KeyカラムはIPアドレスをCIDR記法で表現する必要があり、クエリはCIDR記法に従ってマッチングされます。

### Property

|Property名|値のタイプ|意味|必須|
|-|-|-|-|
|`date_lifetime`|整数、単位は秒|データの有効期間。この辞書の最終更新からの経過時間がこの値を超え、ソースTableにデータ変更がある場合、自動的にインポートを開始します。インポートロジックの詳細は[Automatic Import](#automatic-import)を参照|はい|
|`skip_null_key`|Boolean|辞書への読み込み時にKeyカラムにnull値が含まれている場合、値が`true`であれば該当行をスキップし、そうでなければエラーを発生させます。デフォルト値は`false`|いいえ|
|`memory_limit`|整数、単位はバイト|単一のBE上でこの辞書が占有するメモリの上限。デフォルト値は`2147483648`で、これは2GBに相当します。|いいえ|

### Example

```sql
-- Create source data table
CREATE TABLE source_table (
    id INT NOT NULL,
    city VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(id) BUCKETS 1;

-- Create dictionary table
CREATE DICTIONARY city_dict USING source_table
(
    city KEY,
    id VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```
Tableに基づいて、`source_table`内の`city`値に基づいて対応する`id`をクエリするために、`dict_get`関数を通じて辞書`city_dict`を使用できます。

### 使用制限

1. Keyカラム

   - IP_TRIE型辞書のKeyカラムはVarcharまたはString型である必要があり、**Keyカラムの値はCIDR形式である必要があります**。
   - IP_TRIE型の辞書は1つのKeyカラムのみを許可します。
   - HASH_MAP型辞書のKeyカラムはすべての単純型をサポートします（つまり、Map、Arrayなどのすべてのネストされた型を除く）。
   - Keyカラムとして、**ソースTableに重複する値があってはならず**、そうでなければ辞書データのインポート時にエラーが報告されます。

2. Null値の処理

   - 辞書内のすべてのカラムはnull許可カラムにできますが、Keyカラムには実際にはnull値が現れるべきではありません。現れた場合、動作は[Property](#property)の`skip_null_key`に依存します。

## 使用と管理

### データのインポート（リフレッシュ）

辞書は自動および手動インポートをサポートします。「インポート」はここでは「リフレッシュ」とも呼ばれます。

#### 自動インポート

自動インポートは以下の場合に発生します：

1. 辞書の作成後
2. 辞書データの有効期限切れ時（[Property](#property)を参照）
3. BEステータスが辞書データの不足を示す時（新しいBEのオンライン化、または古いBEの再起動など）

Dorisは`dictionary_auto_refresh_interval_seconds`秒ごとにすべての辞書データの有効期限を確認します。辞書が`data_lifetime`秒以上更新されておらず、前回のインポートと比較してソースTableデータが変更されている場合、Dorisはその辞書のインポートを自動的に送信します。

一部のBEでデータが不足しており、前回のインポートと比較してソースTableデータが変更されていない場合、Dorisは対応するBEの現在のバージョンのデータのみを補完し、すべてのBEに対してリフレッシュタスクを送信せず、辞書のバージョンは変更されません。

#### 手動インポート

Dorisは以下のコマンドによる辞書データの手動リフレッシュをサポートします：

```sql
REFRESH DICTIONARY <dict_name>;
```
これらの中で、`<dict_name>`はインポートする辞書の名前です。

#### インポートの注意点

1. データをインポートした辞書のみクエリできます。
2. インポート時にKeyカラムに重複した値がある場合、インポートトランザクションは失敗します。
3. その時点で既に進行中のインポートトランザクションがある場合（辞書のStatusが`LOADING`）、手動インポートは失敗します。進行中のインポートが完了するまで待ってから実行してください。
4. インポートする辞書のサイズが設定された`memory_limit`を超える場合、インポートトランザクションは失敗します。

### 辞書のクエリ

単一のKey、Valueリストおよび複数のKey、Valueリストの辞書Tableクエリには、それぞれ`dict_get`および`dict_get_many`関数を使用できます。

辞書への最初のクエリを実行する前に、辞書がインポートされるまで待ってください。

#### 構文

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```
Among:

- `<db_name>` は辞書が配置されているデータベースの名前です。
- `<dict_name>` は辞書の名前です
- `<query_column>` はクエリ対象の値列の列名で、タイプは `VARCHAR` です。**定数である必要があります**
- `<query_columns>` はクエリ対象のすべての値列の列名で、タイプは `ARRAY<VARCHAR>` です。**定数である必要があります**。
- `<query_key_value>` はクエリで使用されるキー列のデータです
- `<query_key_values>` は辞書でクエリ対象となるデータのすべてのキー列を含むSTRUCTです。

`dict_get` の戻り値の型は、`<query_column>` に対応する辞書列の型です。
`dict_get_many` の戻り値の型は、`<query_columns>` 内の各辞書列の型に対応する [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT) です。

#### クエリ例

このステートメントは `test_db` データベース内の辞書 `city_dict` をクエリし、`key` 列の値が「Beijing」の場合に対応する `id` 値を取得します：

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```
この文は、`test_db`データベース内の辞書`single_key_dict`に対して、`key`列の値が1の場合の`k1`と`k3`の対応する値を照会します：

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```
このステートメントは、`test_db`データベース内の辞書`multi_key_dict`に対してクエリを実行し、2つのキー列の値が順番に2と'ABC'である場合の対応する`k2`と`k3`列の値を取得します：

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```
例えば、Table作成文は以下の通りです：

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
次に上記の文

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```
`STRUCT<float, varchar>`の型を返します。

#### クエリの注意点

1. クエリのKeyデータが辞書Tableに存在しない場合、**またはKeyデータがnullの場合**、nullを返します。
2. IP_TRIE型のクエリでは、**`<query_key_value>`の型は`IPV4`または`IPV6`である必要があります**。
3. IP_TRIE型辞書を使用する場合、Keyカラム`<key_column>`のデータとクエリに使用される`<query_key_value>`の両方が`IPV4`および`IPV6`形式のデータをサポートします。
4. 新規起動や再起動などの理由により、特定のBEが辞書データを欠いている場合、そのBEで対応する辞書を使用したクエリの実行は失敗します。クエリがそのBEにスケジュールされるかどうかは様々な要因に依存します。FE Masterに大きな負荷がかかっていない場合、設定項目`dictionary_auto_refresh_interval_seconds`の値を小さくすることで、辞書が利用できない時間を短縮できます。

### 辞書管理

辞書Tableは以下の管理および表示ステートメントをサポートします：

1. 現在のデータベース内のすべての辞書Tableのステータスを確認します。

    ```sql
    SHOW DICTIONARIES [LIKE <LIKE_NAME>];
    ```
2. 特定の辞書の定義を確認する

    ```sql
    DESC DICTIONARY <dict_name>;
    ```
3. 辞書Tableの削除

    ```sql
    DROP DICTIONARY <dict_name>;
    ```
辞書Tableを削除した後、削除された辞書がBEからすぐに削除されない場合があります。

#### Config Item

辞書Tableは以下の設定項目をサポートしており、すべてFE CONFIGです：

1. `dictionary_task_queue_size` —— 辞書内のすべてのタスクに対するスレッドプールのキュー長で、動的調整はできません。デフォルト値は1024で、通常調整する必要はありません。
2. `job_dictionary_task_consumer_thread_num` —— 辞書内のすべてのタスクに対するスレッドプールのスレッド数で、動的調整はできません。デフォルト値は3です。
3. `dictionary_rpc_timeout_ms` —— 辞書内のすべての関連RPCのタイムアウト時間で、動的調整が可能です。デフォルトは5000（つまり5秒）で、通常調整する必要はありません。
4. `dictionary_auto_refresh_interval_seconds` —— すべての辞書データが最新かどうかを自動的にチェックする間隔で、デフォルトは5（秒）で、動的調整が可能です。

### Status Display

`SHOW DICTIONARIES`ステートメントを使用することで、辞書に対応するベースTable、現在のデータバージョン番号、およびFEとBEでの対応するステータスを確認できます：

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
各項目の詳細:

1. `Version` はデータバージョン番号を表し、データがインポートされるたびに1ずつ増加します。

2. `Status` は辞書の状態を表し、意味は以下の通りです:

    |Status Name|意味|
    |-|-|
    |NORMAL|辞書は現在正常です|
    |LOADING|辞書は現在インポート中です|
    |OUT_OF_DATE|現在の辞書データは期限切れです|

    辞書がインポート中の場合、再度インポートすることはできません。

3. `DataDistribution` は各BEの現在の状態を表し、バージョン番号とメモリ使用量サイズ (KB) が含まれます。

4. `LastUpdateResult` は最後のインポート結果（自動および手動を含む）を示し、例外がある場合は詳細なエラーメッセージがここに表示されます。

辞書Tableの列定義を確認するには、`DESC DICTIONARY` を使用できます。例:

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | タイプ        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```
## 注意事項

1. データ整合性

   - 辞書の更新のたびに新しいバージョンが生成されます。クエリ時にBEレコードのバージョンとFEバージョンが一致しない場合、クエリは失敗します。
   - Dorisは辞書TableとベースTable間で強いデータ整合性を維持しません。ユーザーは辞書の`data_lifetime`を適切に設定して自動更新を実現し、ビジネスロジックに基づいて必要に応じて手動更新する必要があります。
   - ソースTableが何らかの方法で削除された場合、対応する辞書Tableも自動的に削除されます。

2. パフォーマンスに関する考慮事項

   - 辞書Tableは、ディメンションTableデータなどの比較的静的なデータに適しています。

   - 辞書Tableは純粋なインメモリTableで、すべてのBEのメモリに完全なデータが格納され、大量のメモリを占有する可能性があるため、メモリ使用量とクエリパフォーマンスを考慮して辞書を派生させる適切なTableを選択する必要があります。

3. ベストプラクティス

   1. キーバリュー列の合理的な選択：

      - 適度なカーディナリティを持つ列をキーとして選択する

   2. レイアウト選択：

      - 一般的なシナリオではHASH_MAPレイアウトを使用する
      - IPアドレス範囲マッチングシナリオではIP_TRIEレイアウトを使用する

   3. 状態管理：

      - 辞書Tableのメモリ使用量を定期的に監視する
      - 適切なデータ更新間隔を選択し、ビジネス側でデータが期限切れになった際に辞書を手動で更新する
      - 辞書Tableを使用する際は、BEメモリ監視に注意して、辞書Tableが多すぎたり大きすぎたりして過度にメモリを占有し、BE状態の異常を引き起こすことを防ぐ

## 完全な例

1. HASH_MAP

    ```sql
    -- Create source data table
    CREATE TABLE cities (
        city_id INT NOT NULL,
        city_name VARCHAR(32) NOT NULL,
        region_code VARCHAR(32) NOT NULL
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(city_id) BUCKETS 1;

    INSERT INTO cities VALUES
    (1, 'Beijing', 'BJ'),
    (2, 'Shanghai', 'SH'),
    (3, 'Guangzhou', 'GZ');

    -- Create dictionary table
    CREATE DICTIONARY city_code_dict USING cities
    (
        city_name KEY,
        region_code VALUE
    )
    LAYOUT(HASH_MAP)
    PROPERTIES('data_lifetime' = '600');

    -- Query using a dictionary table
    SELECT dict_get("test_refresh_dict.city_code_dict", "region_code", "Beijing");
    ```
    ```text
    +------------------------------------------------------------------------+
    | dict_get('test_refresh_dict.city_code_dict', 'region_code', 'Beijing') |
    +------------------------------------------------------------------------+
    | BJ                                                                     |
    +------------------------------------------------------------------------+
    ```
2. IP_TRIE

    ```sql
    CREATE TABLE ip_locations (
        ip_range VARCHAR(30) NOT NULL,
        country VARCHAR(64) NOT NULL,
        region VARCHAR(64) NOT NULL,
        city VARCHAR(64) NOT NULL
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(ip_range) BUCKETS 1;

    INSERT INTO ip_locations VALUES
    ('1.0.0.0/24', 'United States', 'California', 'Los Angeles'),
    ('1.0.1.0/24', 'China', 'Beijing', 'Beijing'),
    ('1.0.4.0/24', 'Japan', 'Tokyo', 'Tokyo');

    -- Create an IP address dictionary table
    CREATE DICTIONARY ip_location_dict USING ip_locations
    (
        ip_range KEY,
        country VALUE,
        region VALUE,
        city VALUE
    )
    LAYOUT(IP_TRIE)
    PROPERTIES('data_lifetime' = '600');

    -- Query the location information corresponding to the IP address, based on CIDR matching.
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
3. マルチキー / マルチバリューを持つHASH_MAP

    ```sql
    -- Product SKU Dimension Table: Includes basic product attributes
    CREATE TABLE product_sku_info (
        product_id INT NOT NULL COMMENT "商品ID",
        color_code VARCHAR(32) NOT NULL COMMENT "颜色编码",
        size_code VARCHAR(32) NOT NULL COMMENT "尺码编码",
        product_name VARCHAR(128) NOT NULL COMMENT "商品名称",
        color_name VARCHAR(32) NOT NULL COMMENT "颜色名称",
        size_name VARCHAR(32) NOT NULL COMMENT "尺码名称",
        stock INT NOT NULL COMMENT "库存",
        price DECIMAL(10,2) NOT NULL COMMENT "价格",
        update_time DATETIME NOT NULL COMMENT "更新时间"
    )
    DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

    -- Order Details Table: Records actual sales data
    CREATE TABLE order_details (
        order_id BIGINT NOT NULL COMMENT "订单ID",
        product_id INT NOT NULL COMMENT "商品ID",
        color_code VARCHAR(32) NOT NULL COMMENT "颜色编码",
        size_code VARCHAR(32) NOT NULL COMMENT "尺码编码",
        quantity INT NOT NULL COMMENT "购买数量",
        order_time DATETIME NOT NULL COMMENT "下单时间"
    )
    DISTRIBUTED BY HASH(`order_id`) BUCKETS 10;

    -- Insert product SKU data
    INSERT INTO product_sku_info VALUES
    (1001, 'BLK', 'M', 'Nike运动T恤', '黑色', 'M码', 100, 199.00, '2024-02-23 10:00:00'),
    (1001, 'BLK', 'L', 'Nike运动T恤', '黑色', 'L码', 80, 199.00, '2024-02-23 10:00:00'),
    (1001, 'WHT', 'M', 'Nike运动T恤', '白色', 'M码', 90, 199.00, '2024-02-23 10:00:00'),
    (1001, 'WHT', 'L', 'Nike运动T恤', '白色', 'L码', 70, 199.00, '2024-02-23 10:00:00'),
    (1002, 'RED', 'S', 'Adidas运动裤', '红色', 'S码', 50, 299.00, '2024-02-23 10:00:00'),
    (1002, 'RED', 'M', 'Adidas运动裤', '红色', 'M码', 60, 299.00, '2024-02-23 10:00:00'),
    (1002, 'BLU', 'S', 'Adidas运动裤', '蓝色', 'S码', 55, 299.00, '2024-02-23 10:00:00'),
    (1002, 'BLU', 'M', 'Adidas运动裤', '蓝色', 'M码', 65, 299.00, '2024-02-23 10:00:00');

    -- Insert order data
    INSERT INTO order_details VALUES
    (10001, 1001, 'BLK', 'M', 2, '2024-02-23 12:01:00'),
    (10002, 1001, 'WHT', 'L', 1, '2024-02-23 12:05:00'),
    (10003, 1002, 'RED', 'S', 1, '2024-02-23 12:10:00'),
    (10004, 1001, 'BLK', 'L', 3, '2024-02-23 12:15:00'),
    (10005, 1002, 'BLU', 'M', 2, '2024-02-23 12:20:00');

    -- Create a multi-key multi-value dictionary
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

    -- Query example using dict_get_many: Retrieve order details and SKU information
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
    +----------+---------------------+-----------------+------------+-----------+----------+------------+--------------+---------------+
    | order_id | order_time          | product_name    | color_name | size_name | quantity | unit_price | total_amount | current_stock |
    +----------+---------------------+-----------------+------------+-----------+----------+------------+--------------+---------------+
    |    10001 | 2024-02-23 12:01:00 | Nike运动T恤     | 黑色       | M码       |        2 |     199.00 |       398.00 |           100 |
    |    10002 | 2024-02-23 12:05:00 | Nike运动T恤     | 白色       | L码       |        1 |     199.00 |       199.00 |            70 |
    |    10003 | 2024-02-23 12:10:00 | Adidas运动裤    | 红色       | S码       |        1 |     299.00 |       299.00 |            50 |
    |    10004 | 2024-02-23 12:15:00 | Nike运动T恤     | 黑色       | L码       |        3 |     199.00 |       597.00 |            80 |
    |    10005 | 2024-02-23 12:20:00 | Adidas运动裤    | 蓝色       | M码       |        2 |     299.00 |       598.00 |            65 |
    +----------+---------------------+-----------------+------------+-----------+----------+------------+--------------+---------------+
    ```
## トラブルシューティング

1. クエリで "can not find dict name" エラーが報告される

    まず、`SHOW DICTIONARIES`を使用して辞書の存在を確認してください。存在する場合は、対応する辞書データを更新してください。

2. クエリで "dict_get() only support IP type for IP_TRIE" エラーが報告される

    IP_TRIE型辞書のKeyカラムがCIDR形式の要件を厳密に満たしているかどうかを確認してください。

3. インポートで "Version ID is not greater than the existing version ID for the dictionary." エラーが報告される

    `DROP DICTIONARY`コマンドを使用して対応する辞書を削除し、再作成してからデータをインポートしてください。

4. `SHOW DICTIONARIES`の結果で、辞書がFEバージョンよりも大きいBEバージョンになっている

    `DROP DICTIONARY`コマンドを使用して対応する辞書を削除し、再作成してからデータをインポートしてください。

5. インポートで "Dictionary `X` commit version `Y` failed" エラーが報告される

    辞書を再更新してください。

6. 緊急時対応策

    大部分のエラーメッセージに対して、通常の操作が失敗した場合、`DROP`後に辞書を再構築することで問題を解決できます。
