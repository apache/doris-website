---
{
    "title": "dbtアダプター",
    "sidebar_label": "dbtアダプター",
    "language": "ja",
    "description": "dbt-for-apache-doris 1.1.1をインストールし、モデル、External Catalogのソース、Icebergのターゲット、非同期マテリアライズドビューを設定します。",
    "keywords": [
        "Apache Doris dbt",
        "dbt Dorisアダプター",
        "dbt-for-apache-doris",
        "dbt Dorisプロファイル",
        "Dorisデータ変換",
        "Dorisインクリメンタルモデル",
        "Doris insert_overwrite",
        "Doris microbatch",
        "Dorisソースの鮮度",
        "Doris非同期マテリアライズドビュー",
        "dbt External Catalog",
        "dbt debug接続エラー"
    ]
}
---

<!-- Knowledge Type: Integration Guide / Capability Definition -->
<!-- Use Case: Apache Doris data transformation with dbt / ELT modeling -->

[dbt](https://docs.getdbt.com/docs/introduction)は、ELT（抽出、ロード、変換）ワークフローの変換段階を管理します。`dbt-for-apache-doris`アダプターはdbtモデルをDoris SQLにコンパイルし、Doris Frontend（FE）のMySQLクエリポートを通じて、テーブル作成、変換、テスト、ドキュメント生成を実行します。

ソースデータは、Internal Catalogのテーブルまたは設定済みのExternal Catalogを通じて、Dorisから照会できる状態である必要があります。アダプターはデータを変換しますが、ソースデータの取り込みや同期は行いません。

:::caution

`dbt-for-apache-doris`はVeloDBが提供・保守しています。Apache Dorisプロジェクトの一部ではなく、Apache Dorisコミュニティがリリースまたは推奨するものでもありません。本番環境で使用する前にアダプターを評価し、パッケージとリリース情報の完全性を確認して、サードパーティープロジェクトのライセンスに従ってください。アダプターの問題は[`dbt-for-apache-doris`プロジェクト](https://github.com/velodb/dbt-for-apache-doris/issues)に報告してください。

:::

<!-- Knowledge Type: Version Requirements / Environment Requirements / Released Versions -->
<!-- Use Case: Pre-installation version check / Environment preparation / Release lookup -->

## 環境要件

| コンポーネント | 要件 |
| --- | --- |
| Python | 3.10以降 |
| dbt Core | 1.12.x（アダプターとともにインストール） |

## リリース済みバージョン

| バージョン |
| --- |
| [1.1.1](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.1) |
| [1.1.0](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0) |

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Adapter installation / Installation verification -->

## インストール

以下のコマンドでは、公開されている[`v1.1.1`リリース](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.1)をインストール例として使用します。別のリリースをインストールする場合は、`pip`の要件指定に含まれるバージョンを置き換えてください。

分離されたPython環境にPyPIからアダプターをインストールします。

```shell
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.1"
dbt --version
```

Windows PowerShellの場合:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.1"
dbt --version
```

この例では、`Plugins`セクション（`dbt --version`の出力）に`doris: 1.1.1`が含まれるはずです。dbt CoreとMySQL Connector/Pythonは依存パッケージとしてインストールされます。

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Connect dbt to Doris / Validate an end-to-end model build -->

## 接続の設定

dbtプロジェクトを作成します。

```shell
dbt init doris_demo
cd doris_demo
```

`~/.dbt/profiles.yml`にDorisの出力設定を追加します。認証情報はバージョン管理の対象外にしてください。この例では、環境変数からパスワードを読み取ります。

```yaml
doris_demo:
  target: dev
  outputs:
    dev:
      type: doris
      host: 127.0.0.1
      port: 9030
      username: dbt_user
      password: "{{ env_var('DORIS_PASSWORD') }}"
      schema: analytics
      threads: 4
```

| 設定 | 推奨値 | 動作 |
| --- | --- | --- |
| `type` | `doris`を指定 | Dorisアダプターを選択します |
| `host` | Doris FEのアドレスを明示的に指定 | 省略すると基となる認証情報の設定では`127.0.0.1`が使用されます。`dbt init`の入力にはデフォルト値がありません |
| `port` | 通常は`9030` | 省略すると`9030`が使用されます。これはFEのクエリポートであり、HTTPポートではありません |
| `username` | 専用のDorisユーザーを明示的に指定 | 省略すると基となる認証情報の設定では`root`が使用されます。`dbt init`の入力にはデフォルト値がありません |
| `password` | 環境変数から読み取る | デフォルトは空文字列です |
| `schema` | ターゲットのDorisデータベースを指定 | `dbt init`のプロンプトのデフォルトは`dbt`、基となる認証情報の設定のデフォルトは`None`です |
| `threads` | FEとワークロードの処理能力に合わせて設定 | `dbt init`のプロンプトのデフォルトは`1`です |
| `database` | Internal Catalogでは省略し、外部ターゲットでは既存のDoris Catalogを指定 | v1.1.1ではDoris Catalogに対応します |

v1.1.1では、dbtの`database.schema.identifier`はDorisの`catalog.database.table`に対応します。Internal Catalogを使用する場合は`database`を省略し、`schema`にDorisデータベースを指定します。外部ターゲットの場合は、`database`に既存のDoris Catalogを、`schema`にそのCatalog内のデータベースを指定します。Catalogが対応していれば、アダプターは存在しないターゲットデータベースの作成を試みることができます。dbtの実行アカウントには、ソースの読み取りと、ターゲットオブジェクトの作成、変更、削除、書き込みの権限が必要です。External Catalogへの書き込み可否はDorisコネクターにも依存します。

`dbt_project.yml`が同じプロファイルを参照していることを確認します。

```yaml
name: doris_demo
version: "1.0.0"
config-version: 2
profile: doris_demo

model-paths: ["models"]

models:
  doris_demo:
    +materialized: view
```

macOSまたはLinuxでは、次のコマンドで接続を検証します。

```shell
export DORIS_PASSWORD='your_password'
dbt debug
```

Windows PowerShellの場合:

```powershell
$env:DORIS_PASSWORD = 'your_password'
dbt debug
```

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Validate an end-to-end model build -->

## 最初のモデルの構築

次のSQLは、この例で使用するソーステーブルを作成します。レプリカ数`1`が適しているのは、単一BEの開発用クラスターに限られます。

```sql
CREATE DATABASE IF NOT EXISTS raw;

CREATE TABLE IF NOT EXISTS raw.orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_time DATETIME,
    amount DECIMAL(18, 2),
    status VARCHAR(20),
    updated_at DATETIME,
    is_valid BOOLEAN
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO raw.orders VALUES
    (1, 101, '2026-08-01 10:00:00', 20.00, 'PAID', '2026-08-01 10:05:00', true),
    (2, 102, '2026-08-01 11:00:00', 35.00, 'PAID', '2026-08-01 11:05:00', true);
```

`models/sources.yml`でソースを宣言します。

```yaml
version: 2

sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
```

`models/fct_daily_sales.sql`を作成します。

```sql
{{
  config(
    materialized='table',
    duplicate_key=['order_date'],
    distributed_by=['order_date'],
    buckets=1,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as order_date,
    sum(amount) as sales_amount
from {{ source('raw', 'orders') }}
group by cast(order_time as date)
```

`models/schema.yml`にデータテストを追加します。

```yaml
version: 2

models:
  - name: fct_daily_sales
    description: Daily sales summary
    columns:
      - name: order_date
        description: Order date
        data_tests:
          - not_null
          - unique
      - name: sales_amount
        description: Daily sales amount
        data_tests:
          - not_null
```

モデルとテストを実行します。

```shell
dbt build --select fct_daily_sales
```

ビルドが成功すると、`analytics.fct_daily_sales`が作成されます。本番環境のレプリカ数とバケット数は、クラスターの構成に合わせて設定してください。

ソースが別のDorisデータベースにある場合は、`schema`を直接指定することを推奨します。

```yaml
sources:
  - name: finance
    schema: finance_raw
    tables:
      - name: payments
```

v1.1.1では、ソースの`database`はDoris Catalogの名前を表します。Internal Catalog内の別のデータベースから読み取るには、上記のように`schema`のみを設定します。v1.1.0でデータベースをまたぐソースに`database: finance_raw`を使用していたプロジェクトでは、アップグレード前にその値を`schema`へ移してください。

## v1.1.1でのExternal Catalog

アダプターはExternal Catalog内のソースを読み取り、`dbt docs generate`用にそのテーブルと列を検出できます。先にDorisでCatalogを作成し、その名前をソースの`database`フィールドに指定します。

```yaml
sources:
  - name: lakehouse
    database: hive_catalog
    schema: ods
    tables:
      - name: orders
```

`{{ source('lakehouse', 'orders') }}`は`hive_catalog.ods.orders`に解決されます。`schema`フィールドは、そのCatalog内のデータベース名です。アダプターはCatalog名を含むリレーション名に対応していますが、Dorisで実行できるDDLと書き込み操作は各Catalogコネクターによって決まります。

Icebergのターゲットを作成するには、まず[書き込み可能なIceberg Catalogを設定](../../lakehouse/catalogs/iceberg-catalog)します。既存のプロファイル出力設定に次のフィールドを指定します。

```yaml
database: iceberg_catalog
schema: analytics
```

`models/iceberg_sample.sql`を作成します。

```sql
{{ config(materialized='table', engine='iceberg') }}

select cast(1 as int) as id
```

明示的に`INT`へキャストすることで、Icebergの列型として使用できない`TINYINT`として推論されるのを防ぎます。

`dbt run --select iceberg_sample`を実行します。`iceberg_catalog.analytics.iceberg_sample`が作成されます。Catalogは存在している必要があり、そのデータベースは既存かdbtによって作成可能で、ターゲットは書き込み可能である必要があります。`engine='iceberg'`は明示的なエンジン句を出力します。`engine`を省略すると、DorisがターゲットCatalogから推論します。Catalogに基づく推論はDoris 4.1.3で検証されています。以前のDorisリリースでは、明示的なエンジン指定が必要な場合があります。

| Icebergのターゲット | v1.1.1での動作 |
| --- | --- |
| `table` | Icebergテーブルを作成します。再実行時はバックアップと名前変更によって置き換えます |
| `incremental` | 以下で説明する`append`、`merge`、`insert_overwrite`、`microbatch`に対応します |
| SeedとSnapshot | 対応しています。Snapshotの公開とSeedの全件更新には、バックアップと名前変更を使用します。通常の再ロードでは、非パーティションテーブルにINSERT OVERWRITE、パーティションテーブルにネイティブMERGEを使用し、後者はV2以降が必要です。V1のパーティション化されたSeedには`dbt seed --full-refresh`を使用してください |
| `view`と`materialized_view` | ターゲットはInternal Catalogに置く必要があります。Internal CatalogのビューとMVはExternal Catalogのソースを照会できます |

Icebergの`merge`、`microbatch`、パーティション化されたSeedの再ロードには、ネイティブのIceberg `MERGE INTO`に対応するDorisリリースと、Iceberg V2以降のテーブルが必要です。これらの処理経路はDoris 4.1.3で検証されています。[DorisのドキュメントではIceberg MERGEは4.1.0以降、実験的機能とされています](../../lakehouse/catalogs/iceberg-catalog#merge-into)。外部テーブルの置き換えはアトミックではありません。名前変更の間は一時的に元の名前でアクセスできなくなり、失敗すると旧テーブルがバックアップ名で残る場合があります。本番環境で使用する前に、分離されたテストプロジェクトでDorisのリリース、Catalogコネクター、復旧手順を検証してください。

アダプターは、Table、View、Incremental、MVのターゲットを書き込む前に、モデルまたは列の`constraints`宣言を拒否します。モデルコントラクトでは引き続き列名と型を検査します。書き込み後のデータ検証には`data_tests`を使用してください。たとえば`not_null`を指定できます。これらはデータベースが強制する制約を作成しません。

[実行可能な五つのDorisデモ](https://github.com/velodb/dbt-for-apache-doris/tree/3fb9cc75f9dcdd756b472847728bbdf42fb3b128/examples/doris-demos)では、モデル、テスト、データベースをまたぐソース、インクリメンタル処理、スナップショット、非同期マテリアライズドビューを扱います。デモのセットアップではデフォルトで`dbt-for-apache-doris==1.1.1`を使用します。

<!-- Knowledge Type: Capability Reference / Configuration Parameters / Architecture Decision -->
<!-- Use Case: Materialization selection / Incremental processing / Materialized views -->

## マテリアライゼーション

`dbt-for-apache-doris`は、主に次のマテリアライゼーションに対応します。

| マテリアライゼーション | Dorisのオブジェクトまたは動作 | 用途 |
| --- | --- | --- |
| `view` | Internal CatalogのDorisビュー | 常に最新のソースデータを読み取る軽量な変換 |
| `table` | 毎回全件再構築するInternal CatalogのDuplicate Keyテーブル、または書き込み可能なIcebergテーブル | 安定したクエリ性能を必要とする、結果の規模が限定された処理 |
| `incremental` | 戦略に応じてデータを追加、アップサート、または上書き | 大規模テーブルのインクリメンタル処理 |
| `materialized_view` | Internal CatalogのDoris非同期マテリアライズドビュー | Dorisが管理する更新と透過的なクエリ書き換え |
| `ephemeral` | 下流モデルでCTEにコンパイル | Dorisオブジェクトを作成せずにSQLを再利用 |

SeedとSnapshotでもDorisテーブルを作成できます。現時点でアダプターには独自の`partition`マテリアライゼーションはありません。パーティションの置き換えには、インクリメンタルの`insert_overwrite`を使用します。以下の例では、単一BEの開発用クラスターでも実行できるよう`replication_num=1`を使用しています。実際の本番環境では、適切なレプリカ数を使用してください。

### ビュー

```sql
{{ config(materialized='view') }}

select order_id, customer_id, amount
from {{ source('raw', 'orders') }}
where status = 'PAID'
```

実行のたびにビュー定義が更新されます。ビューはデータを保存しません。クエリのコストはビューのSQLと下流のクエリによって決まります。

### テーブル

```sql
{{
  config(
    materialized='table',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202608 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as event_date,
    order_id as event_id,
    status as event_type
from {{ source('raw', 'orders') }}
```

Internal Catalogのターゲットでは、`table`マテリアライゼーションはDuplicate Keyテーブルを作成し、以降の実行時にそのテーブルを全件置き換えます。Icebergのターゲットでは、DorisのOLAPキーやデフォルトの分散設定を使用しません。テーブルモデルでは、次のテーブル作成設定を指定できます。

| 設定 | 型とデフォルト | 説明 |
| --- | --- | --- |
| `duplicate_key` | 文字列またはリスト。省略可能 | Duplicate Keyの列 |
| `partition_by` | 文字列またはリスト。省略可能 | パーティション列 |
| `partition_type` | `RANGE`または`LIST`。デフォルトは`RANGE` | `partition_by`とともに使用するパーティション方式 |
| `partition_by_init` | 文字列のリスト。省略可能 | テーブル作成時に`partition_by`とともに使用するDorisのパーティション定義 |
| `distributed_by` | 文字列またはリスト。省略可能 | ハッシュ分散の列 |
| `buckets` | 正の整数。ハッシュ分散を出力する場合のデフォルトは`10` | ハッシュバケット数。`distributed_by`とともに指定した場合のみ使用 |
| `replication_num` | 正の整数または数値文字列。省略可能 | レプリカ数。トップレベルの設定は`properties`内の同じキーより優先されます |
| `properties` | 辞書。省略可能 | Dorisの`PROPERTIES`として出力するキーと値のペア |

Duplicate Key列、パーティション列、分散列はモデルの出力に含まれ、Dorisのテーブル作成ルールを満たす必要があります。アダプターは`partition_by_init`と`properties`を`CREATE TABLE`文に出力し、Dorisがパーティション定義、プロパティ名、値を検証します。`duplicate_key`や`distributed_by`などのOLAP固有のオプションはIcebergのターゲットには適しません。通常の`table`モデルでは、現時点でAggregate Keyや独立したUnique Keyの設定は公開されていません。Unique Keyによるアップサートには、インクリメンタルの`merge`を使用します。

### インクリメンタル

`append`、`merge`、`insert_overwrite`を使用するインクリメンタルモデルは、次の二つの要素で構成されます。

- モデルSQL（通常は`is_incremental()`を使用）が、今回の実行で返すソース行を決定します。
- `incremental_strategy`が、そのバッチをターゲットに書き込む方法を決定します。

Microbatchではこのフィルタリング方式を使用しません。dbt Coreがバッチのコンテキストと上流リソースに設定された`event_time`を基に時間フィルターを挿入します。

| 戦略 | Dorisのターゲットと動作 | 主な要件 |
| --- | --- | --- |
| `append` | OLAPのDuplicate Keyテーブルまたは書き込み可能なIcebergテーブルに`INSERT INTO` | `unique_key`を設定しないでください |
| `merge` | OLAPのUnique Keyテーブルには全列の`INSERT INTO`によるアップサート、Icebergにはネイティブの`MERGE INTO` | `unique_key`が必要です。IcebergではネイティブMERGEへの対応とV2以降のテーブルも必要です |
| `insert_overwrite` | OLAPではテーブル全体、名前を指定したパーティション、または動的パーティションの上書き。Icebergではテーブル全体、動的または静的なパーティションの上書き | `unique_key`は指定できません。Icebergの静的な対象範囲には列と値のマッピングを使用します |
| `microbatch` | OLAPでは正確に対応するRANGEパーティションを上書きし、IcebergではネイティブMERGEで一つのUTCウィンドウを置き換えます | `event_time`、`batch_size`、`begin`を設定します。IcebergではネイティブMERGEへの対応とV2以降のテーブルが必要です |

戦略を設定しない場合、`unique_key`があれば`merge`が選ばれ、なければ`append`が使用されます。アダプターは`on_schema_change`の四つのモード（`ignore`、`fail`、`append_new_columns`、`sync_all_columns`）すべてに対応します。

`delete+insert`と`delete_insert`は拒否されます。DorisのUnique Keyによるアップサートには`merge`を使用してください。OLAPのターゲットでは、`merge`はDorisのUnique Keyのセマンティクスに従い、全列の`INSERT INTO`を使用します。Icebergのターゲットでは、ネイティブの`MERGE INTO`を生成し、書き込み前にソースキーの重複を拒否します。各バッチで、`unique_key`の各値に対応する行は最大一行でなければなりません。Sequence Columnを使用するには、`function_column.sequence_col`で可視列を`properties`内に指定し、引き続き`merge`を使用します。単独の`sequence_col`設定と、`function_column.sequence_type`を隠し列`__DORIS_SEQUENCE_COL__`とともに使う方法には現時点で対応していません。

次の例では、`order_id`をキーとして全列をアップサートします。

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key=['order_id'],
    distributed_by=['order_id'],
    buckets=16,
    properties={'replication_num': '1'},
    on_schema_change='append_new_columns'
  )
}}

select
    order_id,
    customer_id,
    amount,
    updated_at
from {{ source('raw', 'orders') }}

{% if is_incremental() %}
where updated_at >= (
    select coalesce(max(updated_at), '1970-01-01 00:00:00')
    from {{ this }}
)
{% endif %}
```

名前を指定したInternal CatalogのDorisパーティションを上書きするには、次のようにします。

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202607 VALUES LESS THAN ('2026-07-01')",
      "PARTITION p202607 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    overwrite_partitions=['p202607', 'p202608'],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select event_date, event_id, event_type
from (
    select
        cast(order_time as date) as event_date,
        order_id as event_id,
        status as event_type,
        order_time
    from {{ source('raw', 'orders') }}
) events

{% if is_incremental() %}
where order_time >= '2026-07-01'
  and order_time < '2026-09-01'
{% endif %}
```

初回の実行ではCTASによってターゲットを作成し、`INSERT OVERWRITE`は実行しません。このため、この例では`partition_by_init`を使用して必要なターゲットパーティションをすべて作成します。ターゲットの作成後は、`overwrite_partitions`が上書き範囲を制御します。

- 省略した場合: テーブル全体を上書きします。
- パーティション名のリスト: 指定したパーティションのみを上書きします。
- `'*'`: バッチが対象とするパーティションをDorisが動的に上書きします。

動的なOLAP上書きでは、空のバッチからクリアすべきパーティションを推論できません。ソースのバッチが空でもターゲットデータを削除する必要がある場合は、パーティション名を指定してください。

Icebergのターゲットでは、`overwrite_partitions`を省略すると、パーティション化されたテーブルでネイティブの動的上書きが使用されます。一つの静的な範囲を置き換えるには、`overwrite_partitions={'dt': '2025-01-25'}`のように、空でない列と値のマッピングを指定します。モデルは、その範囲のすべての行を返す必要があります。パーティション化されていないターゲットでは、モデルは置き換え後の全データを返す必要があり、結果が空ならテーブルがクリアされます。静的な範囲でも、結果が空ならその範囲がクリアされます。`NULL`を含むマッピングではネイティブMERGEを使用し、Iceberg V2以降が必要です。

### マイクロバッチ

`microbatch`はdbt Coreのバッチコンテキストを使用します。次の例はInternal CatalogのOLAPテーブルをターゲットにし、各UTCウィンドウに正確に対応する一つのRANGEパーティションを上書きします。直接参照する各上流リソースとターゲットモデルに`event_time`フィールドを設定してください。上記の最初のモデルの例で作成した`raw.orders`ソースについては、既存のテーブル宣言に次の設定を追加します。

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          event_time: order_time
```

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='microbatch',
    event_time='event_time',
    batch_size='day',
    begin=modules.datetime.datetime(2026, 8, 1, 0, 0, 0),
    duplicate_key=['event_id', 'event_time'],
    partition_by=['event_time'],
    partition_type='RANGE',
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    order_id as event_id,
    order_time as event_time,
    status as event_type
from {{ source('raw', 'orders') }}
```

Internal CatalogのOLAPターゲットでは、`event_time`は引用符で囲まない列名で、`partition_by`と同じ単一列を指す必要があります。`batch_size`は`hour`、`day`、`month`、`year`に対応します。ターゲットはDuplicate Keyテーブルです。`duplicate_key`はDorisのテーブルキーを設定するもので、dbtの`unique_key`ではありません。`unique_key`、`overwrite_partitions`、`partition_by_init`は設定しないでください。アダプターが現在のバッチからパーティション境界と上書き対象を導き出します。上流の`ref()`または`source()`にも`event_time`が設定されていれば、dbt Coreはその入力を現在のウィンドウに絞り込みます。Microbatchの各バッチは順次実行され、空のバッチでも該当パーティションを上書きするため、そのウィンドウから削除された行もクリアされます。

次のプロパティを設定し、アダプターの検証に合格する場合、Internal CatalogのMicrobatchでDorisのDynamic Partitionも使用できます。

- `dynamic_partition.enable='true'`。
- `dynamic_partition.time_unit`が`batch_size`と一致し、`dynamic_partition.time_zone`が`UTC`、`Etc/UTC`、`+00:00`のいずれかであること。
- `dynamic_partition.create_history_partition='true'`であり、`dynamic_partition.start`または`dynamic_partition.history_partition_num`のいずれかを指定すること。
- `dynamic_partition.prefix`が有効な識別子であり、`dynamic_partition.end`が正の整数であること。
- 月単位のバッチでは、`dynamic_partition.start_day_of_month`を設定する場合、その値が`1`であること。

DorisではDynamic Partitionテーブルの作成時に`dynamic_partition.buckets`の値も正である必要があります。このプロパティはアダプターではなくDorisが検証します。保持期間には、`begin`、`lookback`、手動でのバックフィル範囲が含まれている必要があります。既存のターゲットについては、アダプターが検証する物理プロパティがモデル設定と一致する必要があります。一致しない場合は設定を合わせるか、`--full-refresh`を実行してください。

:::caution

`append`、`merge`、パーティション単位の`insert_overwrite`では、アダプターは新規または変更されたソース行を自動検出しません。モデルSQLが意図したバッチを返す必要があります。テーブル全体を対象にした`insert_overwrite`では、ターゲットの全データを返す必要があります。各`merge`バッチ内の`unique_key`の値は一意でなければなりません。dbt Coreは`event_time`を設定した上流リソースからMicrobatch用のフィルタリングを行うため、Microbatchモデルで`is_incremental()`は不要です。キー、パーティション、または物理レイアウトに互換性のない変更を加えた後は、`dbt run --full-refresh`を実行してください。IcebergのMicrobatchでは、`unique_key`、`overwrite_partitions`（列と値のマッピングを含む）、`partition_by_init`、OLAPのDynamic Partitionプロパティを省略します。`partition_by`を設定する場合は`partition_type='LIST'`を指定します。空のウィンドウも含め、各UTCウィンドウはネイティブMERGEで置き換えられます。

:::

### 非同期マテリアライズドビュー

dbtユーザーは標準の`materialized='materialized_view'`を設定します。アダプターはDorisの[非同期マテリアライズドビュー](../../query-acceleration/materialized-view/async-materialized-view/overview)を使用して実装します。

:::note

このマテリアライゼーションに対するFEのバージョン判定では、Doris 2.xの2.1.5以降、Doris 3.x（3.0.0を除く）、Doris 4.x以降、および`doris-0.0.0-<git-sha>`として報告される識別可能なソースビルドが許可されます。ソースビルドは開発テスト専用です。これらはコード上で受け入れる条件であり、許可されたすべてのバージョンで互換性テストに合格した証拠ではありません。

:::

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='immediate',
    refresh_method='auto',
    refresh_trigger='manual',
    duplicate_key=['order_date'],
    distribution_type='hash',
    distributed_by=['order_date'],
    buckets=8,
    wait_for_refresh=true,
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

| 設定 | デフォルト | 対応する値または形式 |
| --- | --- | --- |
| `build_mode` | `immediate` | `immediate`, `deferred` |
| `refresh_method` | `auto` | `auto`ではDorisが更新範囲を決定し、`complete`ではすべてのパーティションを更新します |
| `refresh_trigger` | `manual` | `manual`, `schedule`, `commit` |
| `refresh_schedule` | - | `schedule`で必須。正の`interval`、`minute/hour/day/week`のいずれかの単位、省略可能な`start_time`を含みます |
| `wait_for_refresh` | `true` | `BUILD IMMEDIATE`による初回の構築、またはアダプターが送信した手動更新の完了を待つかどうか |
| `refresh_wait_timeout` | `300` | 更新タスクのタイムアウト（秒）。正の整数 |
| `refresh_poll_interval` | `1` | 更新タスクのポーリング間隔（秒）。タイムアウト以下の正の整数 |
| `duplicate_key` | - | 非同期マテリアライズドビューのDuplicate Key列。文字列またはリスト |
| `partition_by` | - | Dorisのパーティション列またはパーティション関数式を一つ指定。文字列または単一要素のリスト |
| `distribution_type` | 自動選択 | `hash`（`distributed_by`を設定した場合）、それ以外は`random` |
| `distributed_by` | - | ハッシュ分散の列 |
| `buckets` | `auto` | 正の整数または`auto` |
| `replication_num` | - | レプリカ数を簡単に指定するための設定。`properties`内の同じキーより優先されます |
| `properties` | `{}` | Doris非同期マテリアライズドビューのプロパティ |
| `on_configuration_change` | `apply` | `apply`, `continue`, `fail` |

`BUILD IMMEDIATE`は、定義の作成時または置き換え時に初回の構築を開始します。アダプターは一時的な名前で新しい定義を作成し、デフォルトでは初回の構築を待ってからターゲット名で公開します。追加の`REFRESH MATERIALIZED VIEW`は送信しません。`BUILD DEFERRED`は初回の構築を行わずに定義を作成します。

定義が変わっていない場合、更新動作は`refresh_trigger`だけで制御されます。現時点で`refresh_on_run`設定はありません。

- `manual`では、`REFRESH MATERIALIZED VIEW ... AUTO|COMPLETE`を後続の`dbt run`でモデルが選択されたときに送信し、デフォルトでは成功するまで待ちます。
- `schedule`と`commit`では、後続のdbt実行から更新を送信しません。Dorisがスケジュールまたはベーステーブルへのコミットを契機に更新します。

たとえば、日次スケジュールは次のように設定します。

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='deferred',
    refresh_method='auto',
    refresh_trigger='schedule',
    refresh_schedule={
      'interval': 1,
      'unit': 'day'
    },
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

`wait_for_refresh=false`はタスクのポーリングを無効にしますが、更新リクエストは抑止しません。dbt側の待機がタイムアウトしても、送信済みのDorisタスクはキャンセルされません。アダプターは、送信前後のDoris MVタスクIDを比較して新しいタスクを識別します。そのため、同じターゲットに対する手動更新を並行して実行しないでください。

モデルSQLまたはDDL設定が変わった場合、デフォルトの`on_configuration_change=apply`は一時的な非同期マテリアライズドビューを構築し、既存の定義をアトミックに置き換えます。`continue`は手動更新を送信せずに既存の定義を維持し、`fail`は実行を停止します。`--full-refresh`は定義の再デプロイを強制します。

<!-- Knowledge Type: Capability Reference / Configuration Parameters -->
<!-- Use Case: Seeds / Snapshots / Source freshness / Grants -->

## その他のdbt機能

| 機能 | 対応状況 |
| --- | --- |
| Seed | `seeds/`にバージョン管理された小さなCSVファイルを配置し、`dbt seed`を実行します。型推論、`column_types`、`ref`に対応します |
| Snapshot | `check`または`timestamp`戦略を`snapshots/`で定義し、`dbt snapshot`を実行します。ハードデリートとスキーマの変更に対応します。Internal Catalogでの置き換えはアトミックですが、Icebergではバックアップと名前変更を使用します |
| データテスト | YAMLでGeneric Testを設定するか、`tests/`にSingular Testを記述します。ephemeralと`store_failures`の処理経路に対応します |
| ユニットテスト | モデルのYAMLに行を直接記述するかCSVのフィクスチャーを指定し、`dbt test --select test_type:unit`を実行します |
| モデルコントラクト | `contract.enforced: true`を設定し、Table、View、Incrementalモデルの列名と型を宣言します。`constraints`宣言は拒否され、データテストはデータベースの制約を作成しません |
| 永続化されたドキュメント | `persist_docs`を有効にして、主要なリレーション型にリレーションと列のコメントを設定します |
| ソースの鮮度 | `loaded_at_field`または`loaded_at_query`を`freshness`とともに設定し、`dbt source freshness`を実行します |
| 権限付与 | 標準の`grants`設定をDorisの`user`および`user@host`のテーブル権限に使用します。ロールをプリンシパルにすることは現時点でできません |
| フック | `pre_hook`と`post_hook`を使用して、マテリアライゼーションの前後にDoris SQLを実行します。フックの副作用はトランザクションでロールバックされません |
| ドキュメントとリネージ | 説明を記述して`dbt docs generate`を実行し、Internal Catalogの非同期マテリアライズドビューを含むInternal CatalogとExternal Catalogのリレーション・列のメタデータを生成します |

Seedは国コードやステータスの対応表など、バージョン管理される小規模なデータに適しています。大量の業務データの取り込みには適しません。大きなファイルにはDoris Stream Load、Broker Load、またはDoris Connectorを使用してください。

Snapshotのソースにある`unique_key`の値は`NULL`以外で、各バッチ内で一意でなければなりません。`timestamp`戦略では、`updated_at`も`NULL`以外で、そのキーの現在の履歴バージョンより前の値にすることはできません。

テーブルと列の説明を永続化するには、次のようにします。

```yaml
models:
  - name: fct_daily_sales
    description: Daily sales summary
    config:
      persist_docs:
        relation: true
        columns: true
    columns:
      - name: order_date
        description: Order date
      - name: sales_amount
        description: Daily sales amount
```

### ソースの鮮度

ソースの鮮度は、タイムスタンプを明示的に指定する二つの方法に対応します。一般的なタイムスタンプ列を使う場合は`loaded_at_field`を使用します。

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_field: updated_at
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

鮮度を判定するタイムスタンプにカスタムSQLまたは集約が必要な場合は、`loaded_at_query`を使用します。

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_query: |
            select max(updated_at)
            from {{ this }}
            where is_valid = 1
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

`loaded_at_field`を使用する場合は、鮮度評価の対象行を絞り込むため、`filter`を`freshness`の下に設定します。たとえば`filter: is_valid = 1`を指定します。`loaded_at_field`と`loaded_at_query`を同時に設定しないでください。現時点でアダプターはDorisのテーブルメタデータからロード時刻を推論しません。フィールドまたはクエリを明示的に指定してください。

アダプターは現在時刻として`utc_timestamp()`を使用します。これはタイムゾーン情報のない鮮度判定用タイムスタンプをUTCとして評価するdbt Coreの慣例に沿っています。

### 権限付与

宣言的な権限付与ではDorisユーザーをプリンシパルとして使用します。

```yaml
models:
  doris_demo:
    +grants:
      select:
        - analyst
        - reporter@10.0.0.%
```

`@host`を含まない名前は`username@%`として扱われます。権限の対応は、`select`が`SELECT_PRIV`、`insert`が`LOAD_PRIV`、`alter`が`ALTER_PRIV`、`create`が`CREATE_PRIV`、`drop`が`DROP_PRIV`、`show_view`が`SHOW_VIEW_PRIV`です。Dorisのロールは現時点で`grants`に対応していないため、具体的なユーザーを設定してください。dbtの実行アカウントには、プリンシパルの確認とターゲットオブジェクトの権限調整ができる必要があります。

<!-- Knowledge Type: Command Reference -->
<!-- Use Case: dbt project development / Execution / Testing / Documentation generation -->

## よく使うコマンド

| コマンド | 目的 |
| --- | --- |
| `dbt debug` | プロジェクト設定とDorisへの接続を検証します |
| `dbt parse` | SQLを実行せずにプロジェクトを解析します |
| `dbt compile` | モデルをコンパイルし、生成されたDoris SQLを確認します |
| `dbt run` | 選択したモデルを構築します |
| `dbt test` | データテストとユニットテストを実行します |
| `dbt build` | 依存関係の順序に従ってSeed、モデル、Snapshot、テストを実行します |
| `dbt seed` | SeedのCSVファイルをロードします |
| `dbt snapshot` | Snapshotを更新します |
| `dbt source freshness` | ソースの鮮度を評価します |
| `dbt docs generate` | カタログ、ドキュメント、リネージのメタデータを生成します |

よく使うセレクター:

```shell
# Run one model
dbt run --select fct_daily_sales

# Run the model and all upstream dependencies
dbt build --select +fct_daily_sales

# Run the model and all downstream dependencies
dbt build --select fct_daily_sales+

# Fully rebuild an incremental model
dbt run --select fct_orders --full-refresh
```

<!-- Knowledge Type: Limitations / Architecture Decision -->
<!-- Use Case: Version evaluation / Production readiness review -->

## 現在の制限事項

- 現時点でアダプターは、Aggregate Keyテーブルのモデリングとセカンダリインデックスの設定に対応していません。
- External Catalogへの書き込み動作はDorisコネクターに依存します。Catalogs V2とコネクター固有の書き込み保証には対応していません。
- 現時点でアダプターは、SSLの設定、タイムアウトとリトライ、複数FEのフェイルオーバー、サーバー側でのキャンセル、完全なクエリテレメトリーを実装していません。
- 一部のTable、View、MVの型変更では、無停止で切り替わるのではなく、正規の名前が短時間利用できなくなります。

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Connection errors / Catalog and database lookup -->

## トラブルシューティング

### `dbt debug`で接続できない

`host`と`port`が到達可能なFEのMySQLクエリポートを指していることを確認し、ユーザー名、パスワード、ネットワークポリシーを確認してください。クエリポートのデフォルトは`9030`です。`8030`は通常、FEのHTTPポートです。

### Catalogまたはデータベースが見つからない

v1.1.1では、プロファイルとソースの`database`の値はDoris Catalogを、`schema`はその中のデータベースを表します。Internal Catalogを使用する場合は`database`を省略します。古いプロジェクトでソースの`database`をDorisデータベースの指定に使用していた場合は、その値を`schema`に移してください。External Catalogが既に存在し、dbtの実行アカウントから参照できることを確認してください。
