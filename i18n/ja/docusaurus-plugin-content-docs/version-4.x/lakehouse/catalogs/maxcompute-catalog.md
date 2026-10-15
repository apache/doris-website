---
{
    "title": "MaxCompute Catalog",
    "language": "ja",
    "description": "Apache Doris の MaxCompute Catalog は、Alibaba Cloud MaxCompute のデータに対する連携クエリをサポートします。データを移行せずに、データ統合や書き戻しを伴う複数データソース間の分析を行えます。"
}
---

[MaxCompute](https://help.aliyun.com/zh/maxcompute/) は、Alibaba Cloud が提供する企業向け SaaS（Software as a Service）型のクラウドデータウェアハウスです。MaxCompute が提供する Open Storage SDK を通じて、Doris は MaxCompute のテーブル情報を取得し、クエリと書き込みを実行できます。

## 適用シナリオ

| シナリオ | 説明 |
| ---- | ---- |
| データ統合 | MaxCompute のデータを読み取り、Doris の内部テーブルに書き込みます。 |
| データの書き戻し | INSERT コマンドを使用して MaxCompute テーブルにデータを書き込みます（バージョン 4.1.0 以降でサポート）。 |

## 使用上の注意

1. バージョン 2.1.7 以降の MaxCompute Catalog は、[Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) を基に開発されています。それより前のバージョンでは、Tunnel API を基に開発されていました。

2. Open Storage SDK の使用にはいくつかの制限があります。詳しくは、`Usage Limitations` セクションについて[こちらのドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)を参照してください。

3. Doris バージョン 3.1.3 より前は、MaxCompute の Project が Doris の Database に対応します。バージョン 3.1.3 では、`mc.enable.namespace.schema` パラメータを使用して MaxCompute の Schema 階層を導入できます。

## Catalog の設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'max_compute',
    {McAuthProperties},
    {McRequiredProperties},
    {McOptionalProperties},
    {CommonProperties}
);
```

* `{McAuthProperties}`

    これらのプロパティは、クエリ操作と書き込み操作の両方で Doris が MaxCompute に認証する方法を制御します。

    > バージョンに関する注意: `mc.auth.type`、`mc.ram_role_arn`、`mc.ecs_ram_role` は **4.0.4** 以降でサポートされます。

    | プロパティ名 | デフォルト値 | 説明 | 必須条件 | サポートする Doris のバージョン |
    | --- | --- | --- | --- | --- |
    | `mc.auth.type` | `ak_sk` | 認証方式。指定できる値は `ak_sk`、`ram_role_arn`、`ecs_ram_role` です。 | いいえ | 4.0.4 以降 |
    | `mc.access_key` | なし | Alibaba Cloud の AccessKey。 | `mc.auth.type` が `ak_sk`（デフォルト）または `ram_role_arn` の場合に必須。 | |
    | `mc.secret_key` | なし | Alibaba Cloud の SecretKey。 | `mc.auth.type` が `ak_sk`（デフォルト）または `ram_role_arn` の場合に必須。 | |
    | `mc.ram_role_arn` | なし | Alibaba Cloud の RAM ロールの ARN。 | `mc.auth.type` が `ram_role_arn` の場合に必須。 | 4.0.4 以降 |
    | `mc.ecs_ram_role` | なし | インスタンスに付与された Alibaba Cloud の ECS RAM ロール名。 | `mc.auth.type` が `ecs_ram_role` の場合に必須。 | 4.0.4 以降 |

    `mc.auth.type` に指定できる値:

    | 値 | 説明 |
    | --- | --- |
    | `ak_sk` | Alibaba Cloud の AccessKey と SecretKey を直接使用します。 |
    | `ram_role_arn` | `mc.access_key` と `mc.secret_key` を元の認証情報として STS の `AssumeRole` を呼び出し、返された一時認証情報で MaxCompute にアクセスします。 |
    | `ecs_ram_role` | ECS メタデータサービスから一時認証情報を取得します。MaxCompute にアクセスする Doris の FE ノードと BE ノードが、`mc.ecs_ram_role` で指定したロールを使用できるようにしてください。 |

    検証ルール:

    1. `mc.auth.type` を省略した場合、Doris は `ak_sk` を使用します。
    2. `mc.auth.type` が `ram_role_arn` の場合、`mc.access_key`、`mc.secret_key`、`mc.ram_role_arn` を設定する必要があります。
    3. `mc.auth.type` が `ecs_ram_role` の場合、`mc.ecs_ram_role` を設定する必要があります。
    4. `mc.access_key` と `mc.secret_key` を使用する場合は、両方を設定する必要があります。

    認証方式ごとの SQL の例については、[基本例](#basic-example)を参照してください。

* `{McRequiredProperties}`

    | プロパティ名 | 説明 | サポートする Doris のバージョン |
    | --- | --- | --- |
    | `mc.default.project` | アクセスする MaxCompute プロジェクトの名前。[MaxCompute プロジェクト一覧](https://maxcompute.console.aliyun.com/cn-beijing/project-list)でプロジェクトを作成、管理できます。 | |
    | `mc.region` | MaxCompute を有効化したリージョン。Endpoint から対応する Region を確認できます。 | 2.1.7 未満 |
    | `mc.endpoint` | MaxCompute を有効化したリージョン。設定方法は、以下の「Endpoint と Quota の取得方法」セクションを参照してください。 | 2.1.7 以降 |

* `{McOptionalProperties}`

    | プロパティ名 | デフォルト値 | 説明 | サポートする Doris のバージョン |
    | --- | --- | --- | --- |
    | `mc.tunnel_endpoint` | なし | 付録の「カスタムサービスアドレス」を参照してください。 | 2.1.7 未満 |
    | `mc.odps_endpoint` | なし | 付録の「カスタムサービスアドレス」を参照してください。 | 2.1.7 未満 |
    | `mc.quota` | `pay-as-you-go` | Quota 名。設定方法は、以下の「Endpoint と Quota の取得方法」セクションを参照してください。 | 2.1.7 以降 |
    | `mc.split_strategy` | `byte_size` | Split の分割方法を設定します。バイトサイズで分割する `byte_size`、または行数で分割する `row_count` を指定できます。 | 2.1.7 以降 |
    | `mc.split_byte_size` | `268435456` | 各 Split が読み取るファイルサイズ（バイト単位）。デフォルトは 256 MB です。`"mc.split_strategy" = "byte_size"` の場合のみ有効です。 | 2.1.7 以降 |
    | `mc.split_row_count` | `1048576` | 各 Split が読み取る行数。`"mc.split_strategy" = "row_count"` の場合のみ有効です。 | 2.1.7 以降 |
    | `mc.split_cross_partition` | `false` | 生成される Split がパーティションをまたぐかどうか。 | 2.1.8 以降 |
    | `mc.connect_timeout` | `10s` | MaxCompute への接続タイムアウト。 | 2.1.8 以降 |
    | `mc.read_timeout` | `120s` | MaxCompute からの読み取りタイムアウト。 | 2.1.8 以降 |
    | `mc.retry_count` | `4` | タイムアウト後の再試行回数。 | 2.1.8 以降 |
    | `mc.datetime_predicate_push_down` | `true` | `timestamp/timestamp_ntz` 型の述語プッシュダウンを許可するかどうか。Doris はこれら二つの型を同期する際に精度が低下します（9 桁から 6 桁）。そのため、元データの精度が 6 桁を超える場合、述語プッシュダウンによって結果が不正確になる可能性があります。 | 2.1.9/3.0.5 以降（両バージョンを含む） |
    | `mc.account_format` | `name` | Alibaba Cloud の国際サイトと中国サイトではアカウント体系が異なります。国際サイトのユーザーが `user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account` のようなエラーに遭遇した場合は、このパラメータを `id` に設定できます。 | 3.0.9/3.1.1 以降（両バージョンを含む） |
    | `mc.enable.namespace.schema` | `false` | MaxCompute の Schema 階層をサポートするかどうか。参照先: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3 以降 |
    | `mc.max_field_size_bytes` | `8388608` (8 MB) | 書き込みセッションで一つのフィールドに許容される最大バイト数。大きな文字列型やバイナリ型のフィールドを含むデータを書き込む場合、フィールドサイズがこの値を超えると書き込みに失敗することがあります。実際のデータに応じて値を増やせます。 | 4.1.0 以降 |
    | `test_connection` | `false` | Catalog の作成時に接続を検証するかどうか。`true` に設定すると、Doris は AK/SK、Endpoint、`mc.project` にアクセスできることを確認します。`mc.enable.namespace.schema` が有効な場合は、Schema 一覧にもアクセスできる必要があります。確認に失敗すると、`CREATE CATALOG` は直ちに失敗します。 | 4.1.4 以降 |

    > バージョン 4.1.4 以降、`mc.connect_timeout`、`mc.read_timeout`、`mc.retry_count` は基盤となる REST クライアントに実際に適用されます。それより前のバージョンでは、これら三つのプロパティを設定できても効果はありませんでした。

    - `mc.max_field_size_bytes`

        MaxCompute では、デフォルトでフィールドあたり最大 8 MB が許容されます。書き込むデータに大きな文字列型やバイナリ型のフィールドが含まれる場合、書き込みに失敗することがあります。

        この上限を調整するには、まず MaxCompute コンソールの SQL エディターで次のコマンドを実行します。

        `setproject odps.sql.cfile2.field.maxsize=262144;`

        これにより、フィールドごとの最大バイト数を調整します。単位は KB で、最大値は 262144 です。

        次に、Doris Catalog のプロパティで `mc.max_field_size_bytes` を対応するバイト単位の値に設定します（この値が MaxCompute 側の設定値を超えないようにしてください）。

* `{CommonProperties}`

    CommonProperties セクションには共通プロパティを指定します。詳しくは、[Catalog 概要](../catalog-overview.md)の「共通プロパティ」セクションを参照してください。

## メタデータキャッシュ {#meta-cache}

外部データソースへのアクセス性能を向上させるため、Apache Doris は MaxCompute のメタデータをキャッシュします。メタデータには、テーブル構造（Schema）とパーティション一覧が含まれます。

:::tip
Doris 4.1.x より前のバージョンでは、メタデータキャッシュは主に FE の設定項目によってグローバルに制御されます。詳しくは、[メタデータキャッシュ](../meta-cache.md)を参照してください。
Doris 4.1.x 以降、MaxCompute Catalog の外部メタデータキャッシュは、共通の `meta.cache.*` キーを使用して設定します。
:::

### キャッシュプロパティの設定（4.1.x 以降） {#meta-cache-unified-model}

MaxCompute のキャッシュエントリには、`meta.cache.maxcompute.<entry>.{enable,ttl-second,capacity}` 形式の設定キーを使用します。MaxCompute のエントリには現在、件数による上限が適用され、エントリ単位の `max-weight` は指定できません。詳しくは、[外部メタデータキャッシュのメモリ管理](../external-meta-cache-memory-management)を参照してください。

| プロパティ | 例 | 意味 |
|---|---|---|
| `enable` | `true/false` | このキャッシュモジュールを有効にするかどうか。 |
| `ttl-second` | `600`, `0`, `-1` | `0` はキャッシュを無効化します（直ちに反映され、最新データの確認に利用できます）。`-1` は無期限、その他の正の整数はアクセス時刻を基準とした TTL（秒単位）を表します。 |
| `capacity` | `10000` | キャッシュエントリの最大件数。`0` は無効化を意味します。 |

**有効化の条件:** モジュールのキャッシュが有効になるのは、`enable=true`、`ttl-second != 0`、`capacity > 0` のすべてを満たす場合だけです。

### キャッシュモジュール {#meta-cache-unified-modules}

MaxCompute Catalog には、次のキャッシュモジュールがあります。

| モジュール（`<entry>`） | プロパティキーのプレフィックス | キャッシュされる内容と影響 |
|---|---|---|
| `schema` | `meta.cache.maxcompute.schema.` | テーブル構造をキャッシュします。影響: テーブルのカラム情報が見えるタイミング。無効にすると、クエリごとに最新の Schema を取得します。 |
| `partition_values` | `meta.cache.maxcompute.partition_values.` | パーティション値の一覧をキャッシュします。影響: パーティションのプルーニングと列挙。無効にすると、新しい外部パーティションをリアルタイムで確認できます。 |

### 旧パラメータとの対応と変換 {#meta-cache-mapping}

バージョン 4.1.x 以降では、共通キーの使用を推奨します。旧 Catalog プロパティと 4.1.x 以降の共通キーとの対応は次のとおりです。

| 旧プロパティキー | 4.1.x 以降の共通キー | 説明 |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.maxcompute.schema.ttl-second` | テーブル構造キャッシュの有効期限 |

### ベストプラクティス {#meta-cache-best-practices}

* **最新データへのリアルタイムアクセス**: 各クエリで MaxCompute テーブルのパーティションや Schema の最新の変更を確認したい場合は、`ttl-second` を `schema` または `partition_values` に対して `0` に設定できます。
  ```sql
  -- Disable partition value cache to detect the latest partitions in MaxCompute tables
  ALTER CATALOG mc_ctl SET PROPERTIES ("meta.cache.maxcompute.partition_values.ttl-second" = "0");
  ```
* **注意**: Doris 4.1.4 以降、Catalog プロパティの変更に成功すると、Catalog の実行コンテキストがリセットされ、その Catalog を経由する各メタデータキャッシュエンジンの初期化済みエントリがクリアされます。次回のアクセス時に、新しいコンテキストと設定を使用して再構築されます。実行中のクエリには影響しません。

### 可観測性 {#meta-cache-unified-observability}

キャッシュのメトリクスは、`information_schema.catalog_meta_cache_statistics` システムテーブルで確認できます。

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'mc_ctl' AND engine_name = 'maxcompute'
ORDER BY entry_name;
```

このシステムテーブルの詳細は、[catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)を参照してください。

### サポートする MaxCompute のバージョン

MaxCompute のパブリッククラウド版のみをサポートします。プライベートクラウド版のサポートについては、Doris コミュニティのサポート窓口にお問い合わせください。

### サポートする MaxCompute のテーブル

* パーティションテーブル、クラスターテーブル、マテリアライズドビューの読み取りをサポートします。

* MaxCompute の外部テーブル、論理ビュー、Delta Tables の読み取りはサポートしません。

## 階層の対応関係

- `mc.enable.namespace.schema` が `false` の場合

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | N/A |
  | Database | Project |
  | Table | Table |

- `mc.enable.namespace.schema` が `true` の場合

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | Project |
  | Database | Schema |
  | Table | Table |

## カラム型の対応関係

| MaxCompute の型 | Doris の型 | 備考 |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| boolean | boolean | |
| tiny | tinyint | |
| tinyint | tinyint | |
| smallint | smallint | |
| int | int | |
| bigint | bigint | |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | 1 <= P <= 38, 0 <= S <= 18 |
| char(N) | char(N) | |
| varchar(N) | varchar(N) | |
| string | string | |
| date | date | |
| datetime | datetime(3) | 常に精度 3 に対応します。`SET [GLOBAL] time_zone = 'Asia/Shanghai'` でタイムゾーンを指定できます。 |
| timestamp_ntz | datetime(6) | MaxCompute の `timestamp_ntz` の精度は 9 桁ですが、Doris の DATETIME の最大精度は 6 桁のため、読み取り時に余分な桁が切り捨てられます。 |
| timestamp | datetime(6) | 2.1.9/3.0.5 以降でサポートされます。MaxCompute の `timestamp` の精度は 9 桁ですが、Doris の DATETIME の最大精度は 6 桁のため、読み取り時に余分な桁が切り捨てられます。 |
| array | array | |
| map | map | |
| struct | struct | |
| other | UNSUPPORTED | |

## 基本例 {#basic-example}

デフォルトの `ak_sk` 認証:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'AKxxxxx',
    'mc.secret_key' = 'SKxxxxx',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

`ram_role_arn` 認証（4.0.4 以降）:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.auth.type' = 'ram_role_arn',
    'mc.access_key' = 'AKxxxxx',
    'mc.secret_key' = 'SKxxxxx',
    'mc.ram_role_arn' = 'acs:ram::<your_account_id>:role/<your_role_name>',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

`ecs_ram_role` 認証（4.0.4 以降）:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.auth.type' = 'ecs_ram_role',
    'mc.ecs_ram_role' = '<your_ecs_ram_role_name>',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

2.1.7 未満のバージョンを使用する場合は、次のステートメントを使用してください（2.1.8 以降へのアップグレードを推奨します）。

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com'
);
```

Schema をサポートする場合:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com',
    'mc.enable.namespace.schema' = 'true'
);
```

## クエリ操作

### 基本的なクエリ

```sql
-- 1. Switch to Catalog, use database and query
SWITCH mc_ctl;
USE mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. Use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. Use full qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```

### クエリの最適化

- LIMIT クエリの最適化（4.1.0 以降）

    このパラメータは、データの有無を確認するために `LIMIT 1` を頻繁に使用する場合にのみ適しています。

    MaxCompute テーブルへのクエリに、パーティションカラムに対する等値条件（`=` または `IN`）と `LIMIT` 句だけが含まれる場合、セッション変数 `enable_mc_limit_split_optimization` を有効にすると、Split の生成方法を最適化できます。

    有効にすると、すべてのデータに対して Split を生成する代わりに、システムは `row_offset` 方式を使用して必要な行数だけを読み取ります。これにより、Split 数を多数からちょうど一つに減らし、クエリのレイテンシーを大幅に削減できます。

    この最適化は、次のようなクエリに適用されます。

    ```sql
    SELECT * FROM mc_tbl WHERE pt = 'value' LIMIT 100;
    SELECT * FROM mc_tbl WHERE pt IN ('v1', 'v2') LIMIT 100;
    ```

    有効にするには、次を実行します。

    ```sql
    SET enable_mc_limit_split_optimization = true;
    ```

    > このパラメータはデフォルトでは無効です。クエリにパーティションカラム以外へのフィルター、等値以外の述語（`>`、`<`、`!=` など）が含まれる場合、または `LIMIT` 句がない場合、この最適化は適用されません。

## 書き込み操作

バージョン 4.1.0 以降、Doris は MaxCompute テーブルへの書き込み操作をサポートします。標準の INSERT ステートメントを使用して、他のデータソースのデータを Doris 経由で MaxCompute テーブルに直接書き込めます。

:::note
- これはバージョン 4.1.0 以降でサポートされる実験的な機能です。
- パーティションテーブルと非パーティションテーブルの両方への書き込みをサポートします。
- クラスターテーブル、トランザクションテーブル、Delta Tables、外部テーブルへの書き込みはサポートしません。
:::

### INSERT INTO

INSERT 操作は、対象テーブルにデータを追加します。

例:

```sql
INSERT INTO mc_tbl values (val1, val2, val3, val4);
INSERT INTO mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO mc_tbl(col1, col2) values (val1, val2);
INSERT INTO mc_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");

-- Write to specified partition (you can specify only some partition columns, with remaining partitions written dynamically)
INSERT INTO mc_tbl PARTITION(ds='20250201') SELECT id, name FROM source_tbl;
INSERT INTO mc_tbl PARTITION(ds='20250101', region='bj') VALUES (1, 'v1'), (2, 'v2');
```

### INSERT OVERWRITE

INSERT OVERWRITE は、テーブルの既存データを新しいデータで完全に上書きします。

```sql
INSERT OVERWRITE TABLE mc_tbl VALUES(val1, val2, val3, val4);
INSERT OVERWRITE TABLE mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specified partition
INSERT OVERWRITE TABLE mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### CTAS

`CTAS` ステートメントを使用すると、MaxCompute テーブルを作成してデータを書き込めます。

```sql
CREATE TABLE mc_tbl AS SELECT * FROM other_table;
```

## データベースとテーブルの管理

バージョン 4.1.0 以降、Doris は MaxCompute のデータベースとテーブルの作成および削除をサポートします。

:::note
- これはバージョン 4.1.0 以降でサポートされる実験的な機能です。
- パーティションテーブルと非パーティションテーブルの作成および削除をサポートします。
- クラスターテーブル、トランザクションテーブル、Delta Tables、外部テーブルの作成はサポートしません。
:::

データベースやテーブルを作成または削除する際、Doris は対応する MaxCompute API を呼び出して操作を実行します。操作が返った後も、MaxCompute 側のメタデータ変更が後続の操作から完全に見えるまでには少し時間がかかります。

この機能を使用できるのは、`mc.enable.namespace.schema` プロパティを `true` に設定した場合だけです。

### データベースの作成と削除

`SWITCH` ステートメントで対象の Catalog に切り替え、`CREATE DATABASE` ステートメントを実行できます。

```sql
SWITCH mc;
CREATE DATABASE [IF NOT EXISTS] mc_schema;
```

完全修飾名を使用して作成することもできます。

```sql
CREATE DATABASE [IF NOT EXISTS] mc.mc_schema;
```

データベースを削除するには、次を実行します。

```sql
DROP DATABASE [IF EXISTS] mc.mc_schema;
```

:::caution
MaxCompute の Database を削除すると、その下のすべてのテーブルも削除されます。
:::

### テーブルの作成と削除

* **作成**

  Doris は MaxCompute でパーティションテーブルと非パーティションテーブルを作成できます。

  例:

  ```sql
  CREATE TABLE mc_schema.mc_tbl1 (
      bool_col BOOLEAN,
      int_col INT,
      bigint_col BIGINT,
      float_col FLOAT,
      double_col DOUBLE,
      decimal_col DECIMAL(18,6),
      string_col STRING,
      varchar_col VARCHAR(200),
      char_col CHAR(50),
      date_col DATE,
      datetime_col DATETIME,
      arr_col ARRAY<STRING>,
      map_col MAP<STRING, STRING>,
      struct_col STRUCT<f1:STRING, f2:INT>
  );

  CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
  )
  PARTITION BY (ds, region)();
  ```

* **削除**

  `DROP TABLE` ステートメントを使用して MaxCompute テーブルを削除できます。現在、テーブルを削除すると、パーティションデータを含むデータも削除されます。

  例:

  ```sql
  DROP TABLE [IF EXISTS] mc_tbl;
  ```

## FAQ

### Endpoint と Quota の取得方法（Doris 2.1.7 以降）

1. データ転送サービスの専用リソースグループを使用する場合

    「Using Exclusive Data Service Resource Groups」の章の「2. Authorization」セクションについては、[こちらのドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts)を参照して、対応する権限を有効にしてください。「Quota Management」の一覧で対応する `QuotaName` を確認してコピーし、`"mc.quota" = "QuotaName"` を指定します。この場合、VPC とパブリックネットワークのどちらからでも MaxCompute にアクセスできます。ただし、帯域幅が保証される VPC と異なり、パブリックネットワークの帯域幅リソースには制限があります。

2. 従量課金を使用する場合

    [こちらのドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)の「Using Open Storage (Pay-as-you-go)」セクションを参照して、Open Storage（Storage API）のスイッチを有効にし、AK と SK に対応するユーザーに権限を付与してください。この場合、`mc.quota` にはデフォルト値の `pay-as-you-go` が使用されるため、別途指定する必要はありません。従量課金では、MaxCompute へのアクセスには VPC のみ使用でき、パブリックネットワークは使用できません。パブリックネットワーク経由で MaxCompute にアクセスできるのは、プリペイドユーザーのみです。

3. `mc.endpoint` は、[Alibaba Cloud の Endpoints ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)の「Region Endpoint Reference Table」に従って設定します。

    VPC 経由でアクセスする場合は、「Regional Endpoint Reference Table (Alibaba Cloud VPC Network Connection Method)」の「VPC Network Endpoint」列に従って `mc.endpoint` を設定します。パブリックネットワーク経由でアクセスする場合は、「Regional Endpoint Reference Table (Alibaba Cloud Classic Network Connection Method)」の「Classic Network Endpoint」列、または「Regional Endpoint Reference Table (External Network Connection Method)」の「External Network Endpoint」列から値を選んで `mc.endpoint` を設定します。

### カスタムサービスアドレス（Doris 2.1.7 より前のバージョン）

Doris 2.1.7 より前のバージョンでは、Tunnel SDK を使用して MaxCompute と通信するため、次の二つの Endpoint プロパティが必要です。

* `mc.odps_endpoint`: MaxCompute の Endpoint。MaxCompute のメタデータ（データベースとテーブルの情報）の取得に使用します。

* `mc.tunnel_endpoint`: Tunnel の Endpoint。MaxCompute のデータの読み取りに使用します。

デフォルトでは、MaxCompute Catalog は `mc.region` と `mc.public_access` に基づいて Endpoint を生成します。

生成される形式は次のとおりです。

| `mc.public_access` | `mc.odps_endpoint` | `mc.tunnel_endpoint` |
| --- | --- | --- |
| `false` | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| `true` | `http://service.{mc.region}.maxcompute.aliyun.com/api` | `http://dt.{mc.region}.maxcompute.aliyun.com` |

`mc.odps_endpoint` と `mc.tunnel_endpoint` を個別に指定してサービスアドレスをカスタマイズすることもできます。これは、プライベート環境にデプロイした MaxCompute に適しています。

MaxCompute Endpoint と Tunnel Endpoint の設定については、[リージョンおよびネットワーク接続方法ごとの Endpoint](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)を参照してください。

### リソース使用量の制御

データ転送サービスの[テーブル単位のリクエスト並列数](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2)は、二つのセッション変数 `parallel_pipeline_task_num` と `num_scanner_threads` を調整することで変更でき、リソース消費を制御できます。対応する並列数は `max(parallel_pipeline_task_num * be num * num_scanner_threads)` です。

注意:

1. この方法で制御できるのは、一つのクエリ内にある一つのテーブルに対する同時リクエスト数だけです。複数の SQL ステートメントにまたがるリソース使用量は制御できません。

2. 並列数を減らすと、クエリの実行時間が長くなります。

### 書き込みのベストプラクティス

- 可能な限り、`INSERT INTO mc_tbl PARTITION(ds='20250201')` のように書き込み先のパーティションを指定することを推奨します。パーティションを指定しない場合、MaxCompute Storage API の制約により、各パーティションのデータを順番に書き込む必要があります。そのため、実行計画はパーティションカラムに基づいてデータをソートします。データ量が多い場合、これによって大量のメモリが消費され、書き込みに失敗する可能性があります。

- パーティションを指定せずに書き込む場合、`SET enable_strict_consistency_dml = false` を設定しないでください。この設定はソートノードを強制的に削除し、パーティションデータが順不同で書き込まれるため、最終的に MaxCompute でエラーが発生します。

- `LIMIT` 句を追加しないでください。`LIMIT` 句を追加すると、Doris は書き込み件数を保証するために一つのスレッドだけを使用して書き込みます。小規模なテストには使用できますが、`LIMIT` の値が大きいと書き込み性能が低下します。

### 書き込みエラー: `Data invalid: ODPS-0020041:StringOutOfMaxLength`

`mc.max_field_size_bytes` の説明を参照してください。
