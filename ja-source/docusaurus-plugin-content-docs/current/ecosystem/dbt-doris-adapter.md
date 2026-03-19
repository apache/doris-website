---
{
  "title": "DBT Doris アダプター",
  "language": "ja",
  "description": "DBT（Data Build Tool）は、ELT（extraction, loading, transformation）におけるT（Transform）の実行に特化したコンポーネントです"
}
---
# DBT Dorisアダプター

[DBT(Data Build Tool)](https://docs.getdbt.com/docs/introduction)は、ELT（extraction, loading, transformation）におけるT（Transform）の実行に特化したコンポーネントです - "transformation data"リンク
`dbt-doris`アダプターは`dbt-core`をベースに開発されており、`mysql-connector-python`ドライバーに依存してデータをdorisに変換します。

git: https://github.com/apache/doris/tree/master/extension/dbt-doris

## バージョン

| doris   | python      | dbt-core | dbt-doris |
|---------|-------------|----------|----------|
| >=1.2.5 | >=3.8,<=3.10| >=1.5.0  | <=0.3    |
| >=1.2.5 | >=3.9       | >=1.8.0  | >=0.4    |


## dbt-dorisアダプター手順

### dbt-dorisアダプターのインストール
pip installを使用：

```shell
pip install dbt-doris
```
バージョンを確認:

```shell
dbt --version
```
コマンドが見つからない場合: dbt:

```shell
ln -s /usr/local/python3/bin/dbt /usr/bin/dbt
```
### dbt-doris アダプタープロジェクトの初期化

```shell
dbt init 
```
ユーザーは dbt プロジェクトを init するために以下の情報を準備する必要があります

| name     | default | meaning                                                                                                                                   |  
|----------|---------|-------------------------------------------------------------------------------------------------------------------------------------------|
| project  |         | プロジェクト名                                                                                                                              | 
| database |         | adapter を選択するために対応する番号を入力してください                                                                                      | 
| host     |         | doris ホスト                                                                                                                                | 
| port     | 9030    | doris MySQL Protocol Port                                                                                                                 |
| schema   |         | dbt-doris では database と同等です、データベース名                                                                                 |
| username |         | doris ユーザー名                                                                                                                            |
| password |         | doris パスワード                                                                                                                            |
| threads  | 1       | dbt-doris での並列度（クラスターの能力に適合しない並列度を設定すると dbt の実行失敗のリスクが高まります） |


### dbt-doris adapter run
dbt run のドキュメントについては、[こちら](https://docs.getdbt.com/docs/get-started/run-your-dbt-projects)を参照してください。
プロジェクトディレクトリに移動し、デフォルトの dbt モデルを実行してください：

```shell
dbt run 
```
model：`my_first_dbt_model`と`my_second_dbt_model`

これらはそれぞれ`table`と`view`としてマテリアライズされます。
その後、dorisにログインして`my_first_dbt_model`と`my_second_dbt_model`のデータ結果とテーブル作成ステートメントを確認してください。
### dbt-doris adapter Materialization
dbt-doris Materializationは3つをサポートしています：
1. view
2. table
3. incremental

#### View

Materializationとして`view`を使用すると、Modelはcreate view asステートメントを通じて実行される度にviewとして再構築されます。（デフォルトでは、dbtのmaterialization方法はviewです）

``` 
Advantages: No extra data is stored, and views on top of the source data will always contain the latest records.
Disadvantages: View queries that perform large transformations or are nested on top of other views are slow.
Recommendation: Usually start with the view of the model and only change to another materialization if there are performance issues. Views are best suited for models that do not undergo major transformations, such as renaming, column changes.
```
config：

```yaml
models:
  <resource-path>:
    +materialized: view
```
または model ファイルに記述してください

```jinja
{{ config(materialized = "view") }}
```
#### Table

`table` materialization モードを使用する場合、モデルは各実行時に `create table as select` ステートメントでテーブルとして再構築されます。
dbt の tablet materialization に対して、dbt-doris はデータ変更のアトミック性を保証するために以下のステップを使用します：
1. まず一時テーブルを作成します：`create table this_table_temp as {{ model sql}}`。
2. `this_table` が存在しないかどうか、つまり初回作成かどうかを判定し、`rename` を実行して一時テーブルを最終テーブルに変更します。
3. 既に存在する場合は、`alter table this_table REPLACE WITH TABLE this_table_temp PROPERTIES('swap' = 'False')` を実行します。この操作によりテーブル名を交換し、`this_table_temp` 一時テーブルを削除できます。[this](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE.md) は Doris のトランザクション機構を通じてこの操作のアトミック性を保証します。

``` 
Advantages: table query speed will be faster than view.
Disadvantages: The table takes a long time to build or rebuild, additional data will be stored, and incremental data synchronization cannot be performed.
Recommendation: It is recommended to use the table materialization method for models queried by BI tools or models with slow operations such as downstream queries and conversions.
```
config:

```yaml
models:
  <resource-path>:
    +materialized: table
    +duplicate_key: [ <column-name>, ... ],
    +replication_num: int,
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int | 'auto',
    +properties: {<key>:<value>,...}
```
または、modelファイルに記述してください：

```jinja
{{ config(
    materialized = "table",
    duplicate_key = [ "<column-name>", ... ],
    replication_num = "<int>"
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "<int>" | "auto",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```
上記の設定項目の詳細は以下の通りです：

| item                 | description                                                | Required? |
|---------------------|------------------------------------------------------------|-----------|
| `materialized`      | テーブルのマテリアライズ形式（Doris Duplicateテーブル）              | Required  |
| `duplicate_key`     | Doris Duplicate key                                        | Optional  |
| `replication_num`   | テーブルレプリカ数                                              | Optional  |
| `partition_by`      | テーブルパーティション列                                          | Optional  |
| `partition_type`    | テーブルパーティションタイプ、`range`または`list`（デフォルト：`RANGE`）    | Optional  |
| `partition_by_init` | 初期化されたテーブルパーティション                                    | Optional  |
| `distributed_by`    | テーブル分散列                                                | Optional  |
| `buckets`           | バケットサイズ                                                | Optional  |
| `properties`        | Dorisテーブルプロパティ                                         | Optional  |




#### Incremental

dbtの前回実行のincrementalモデル結果に基づいて、レコードがテーブルにインクリメンタルに挿入または更新されます。
dorisのincrementを実現する方法は2つあります。`incremental_strategy`には2つのインクリメンタル戦略があります：
* `insert_overwrite`：doris `unique`モデルに依存します。インクリメンタル要件がある場合、モデルのデータを初期化する際にマテリアライゼーションをincrementalとして指定し、集約列を指定して集約することでインクリメンタルデータの上書きを実現します。
* `append`：doris `duplicate`モデルに依存し、インクリメンタルデータのみを追加し、履歴データの変更は一切行いません。そのためunique_keyを指定する必要はありません。

``` 
Advantages: Significantly reduces build time by only converting new records.
Disadvantages: incremental mode requires additional configuration, which is an advanced usage of dbt, and requires the support of complex scenarios and the adaptation of corresponding components.
Recommendation: The incremental model is best for event-based scenarios or when dbt runs become too slow
```
config:

```yaml
models:
  <resource-path>:
    +materialized: incremental
    +incremental_strategy: <strategy>
    +unique_key: [ <column-name>, ... ],
    +replication_num: int,
    +partition_by: [ <column-name>, ... ],
    +partition_type: <engine-type>,
    +partition_by_init: [<pertition-init>, ... ]
    +distributed_by: [ <column-name>, ... ],
    +buckets: int | 'auto',
    +properties: {<key>:<value>,...}
```
または、modelファイルに記述してください：

```jinja
{{ config(
    materialized = "incremental",
    incremental_strategy = "<strategy>"
    unique_key = [ "<column-name>", ... ],
    replication_num = "<int>"
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "<int>" | "auto",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```
上記の設定項目の詳細は以下の通りです：

| item                 | description                                                       | Required? |
|----------------------------|-------------------------------------------------------------------|-----------|
| `materialized`             | テーブルのマテリアライズ形式（Doris Duplicate/Unique table）         | Required  |
| `incremental_strategy`     | Incremental_strategy                                              | Optional  |
| `unique_key`               | Doris Unique key                                                  | Optional  |
| `replication_num`          | テーブルレプリカの数                                                  | Optional  |
| `partition_by`             | テーブルパーティションカラム                                            | Optional  |
| `partition_type`           | テーブルパーティションタイプ、`range` または `list`（デフォルト：`RANGE`） | Optional  |
| `partition_by_init`        | 初期化されたテーブルパーティション                                       | Optional  |
| `distributed_by`           | テーブル分散カラム                                                   | Optional  |
| `buckets`                  | バケットサイズ                                                      | Optional  |
| `properties`               | Doris table properties                                            | Optional  |



### dbt-doris adapter seed

[`seed`](https://docs.getdbt.com/faqs/seeds/build-one-seed) はcsvなどのデータファイルを読み込むために使用される機能モジュールです。これはファイルをライブラリに読み込み、モデル構築に参加させる方法ですが、以下の注意点があります：
1. Seedsは生データの読み込みに使用すべきではありません（例えば、本番データベースからの大きなCSVエクスポートなど）。
2. Seedsはバージョン管理されるため、ビジネス固有のロジックを含むファイルに最も適しています。例えば、国コードのリストや従業員のユーザーIDなどです。
3. dbtのseed機能を使用したCSVの読み込みは、大きなファイルに対してはパフォーマンスが良くありません。これらのCSVをdorisに読み込む場合は`streamload`の使用を検討してください。

ユーザーはdbtプロジェクトディレクトリの下にあるseedsディレクトリを確認し、その中にcsvファイルとseed設定ファイルをアップロードして実行できます

```shell
 dbt seed --select seed_name
```
一般的なseed設定ファイルの記述方法では、列タイプの定義をサポートしています：

```yaml
seeds:
  seed_name: 
    config: 
      schema: demo_seed 
      full_refresh: true
      replication_num: 1
      column_types:
        id: bigint
        phone: varchar(32)
        ip: varchar(15)
        name: varchar(20)
        cost: DecimalV3(19,10)
```
## 使用例

### View Model サンプル参照

```sql
{{ config(materialized='view') }}

select
    u.user_id,
    max(o.create_time) as create_time,
    sum (o.cost) as balance
from {{ ref('sell_order') }} as o
left join {{ ref('sell_user') }} as u
on u.account_id=o.account_id
group by u.user_id
order by u.user_id
```
### Table Modelサンプルリファレンス

```sql
{{ config(materialized='table') }}

select
    u.user_id,
    max(o.create_time) as create_time,
    sum (o.cost) as balance
from {{ ref('sell_order') }} as o
left join {{ ref('sell_user') }} as u
on u.account_id=o.account_id
group by u.user_id
order by u.user_id
```
### インクリメンタルモデルサンプルリファレンス（duplicate mode）

duplicate mode でテーブルを作成し、データ集計なし、unique_key を指定しない

```sql
{{ config(
    materialized='incremental', 
    replication_num=1
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select * from source_data
```
### インクリメンタルモデルサンプルリファレンス（uniqueモード）

uniqueモードでテーブルを作成する場合、データ集約時にunique_keyを指定する必要があります

```sql
{{ config(
materialized='incremental', 
unique_key=['account_id','create_time']
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select * from source_data
```
### インクリメンタルモデルのフルリフレッシュサンプルリファレンス

```sql
{{ config(
    materialized='incremental', 
    full_refresh = true
)}}

select * from
 {{ source('dbt_source', 'sell_user') }}
```
### bucketing ルールの設定例

ここで、buckets は auto または正の整数を設定できます。これらはそれぞれ自動bucketing と固定のbucket数の設定を表します。

```sql
{{ config(
    materialized='incremental', 
    unique_key=['account_id',"create_time"], 
    distributed_by=['account_id'], 
    buckets='auto' 
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where
    create_time > (select max(create_time) from {{this}})
{% endif %}
```
### レプリカ数の設定例リファレンス

```sql
{{ config(
    materialized='table', 
    replication_num=1
)}}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select * from source_data
```
### Dynamic partition サンプルリファレンス

```sql
{{ config(
    materialized='incremental', 
    partition_by = 'create_time',
    partition_type = 'range', 
        -- The properties here are the properties in the create table statement, which contains the configuration related to dynamic partitioning    
    properties = {
        "dynamic_partition.time_unit":"DAY",
        "dynamic_partition.end":"8",
        "dynamic_partition.prefix":"p",
        "dynamic_partition.buckets":"4",
        "dynamic_partition.create_history_partition":"true",
        "dynamic_partition.history_partition_num":"3"
    }
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where    
    create_time = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
{% endif %}
```
### 従来のパーティションサンプルリファレンス

```sql
{{ config(
    materialized='incremental', 
    partition_by = 'create_time',
    partition_type = 'range',  
        -- partition_by_init here refers to the historical partitions for creating partition tables. The historical partitions of the current doris version need to be manually specified.    
    partition_by_init = [
        "PARTITION `p20240601` VALUES [(\"2024-06-01\"),  (\"2024-06-02\"))",
        "PARTITION `p20240602` VALUES [(\"2024-06-02\"),  (\"2024-06-03\"))"
    ]
 )}}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where
    -- If the my_date variable is provided, use this path (via the dbt run --vars '{"my_date": "\"2024-06-03\""}' command). If the my_date variable is not provided (directly using dbt run), use the day before the current date. For the incremental selection here, it is recommended to directly use doris's CURDATE() function, which is also a common path in production environments.
    create_time = {{ var('my_date' , 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)') }} 

{% endif %}
```
### バッチ日付設定パラメータサンプルリファレンス

```sql
{{ config(
    materialized='incremental', 
    partition_by = 'create_time',
    partition_type = 'range',
    ...
)}}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where
    -- If the my_date variable is provided, use this path (via the dbt run --vars '{"my_date": "\"2024-06-03\""}' command). If the my_date variable is not provided (directly using dbt run), use the day before the current date. For the incremental selection here, it is recommended to directly use doris's CURDATE() function, which is also a common path in production environments.
    create_time = {{ var('my_date' , 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)') }} 

{% endif %}
```
### テーブルデータの列の型と精度をカスタマイズするサンプルリファレンス

`schema.yaml`ファイルは、`models`内の`columns`に対して以下のように`data_type`を設定します：

```yaml
models:
  - name: sell_user
    description: "A dbt model named sell_user"
    columns:
      - name: user_id
        data_type: BIGINT
      - name: account_id
        data_type: VARCHAR(12)
      - name: status
      - name: cost_sum
        data_type: DECIMAL(38,9)
      - name: update_time
        data_type: DATETIME
      - name: create_time
        data_type: DATETIME
```
### カタログサンプルリファレンスへのアクセス

[Data Catalog](../lakehouse/catalog-overview.md)は、Dorisデータレイク機能内の異なるデータソースへの参照であり、Databaseの上位レイヤーに配置されます。
dbt-doris組み込みMacros: `catalog_source`を通じてアクセスすることを推奨します。

```sql
{{ config(materialized='table', replication_num=1) }}

select *
--  use macros 'catalog_source' not macros 'source'
--  catalog name is 'mysql_catalog'
--  database name is 'dbt_source'
--  table name is 'sell_user'
from {{ catalog_source('mysql_catalog', 'dbt_source', 'sell_user') }}
```
