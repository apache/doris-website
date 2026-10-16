---
{
    "title": "メタデータキャッシュ",
    "language": "ja",
    "description": "外部データソースへのアクセス性能を向上させるため、Apache Doris は外部データソースのメタデータをキャッシュします。"
}
---

:::tip
このドキュメントは 4.1.x より前のバージョンに適用されます。
Doris 4.1.x 以降では、外部メタデータキャッシュが統一された設定キー `meta.cache.*` を使用するように再設計されています。各 [Catalog](./catalog-overview.md) ドキュメントの「メタデータキャッシュ」セクションを参照してください。
:::

外部データソースへのアクセス性能を向上させるため、Apache Doris は外部データソースの**メタデータ**をキャッシュします。

メタデータには、データベース、テーブル、カラム、パーティション、スナップショット、ファイル一覧などの情報が含まれます。

この記事では、従来のバージョン（4.1 より前）でキャッシュされるメタデータの種類、キャッシュ戦略、関連するパラメータ設定について詳しく説明します。

**データキャッシュ**については、[データキャッシュのドキュメント](./data-cache.md)を参照してください。

外部メタデータキャッシュのメモリ制限については、[外部メタデータキャッシュのメモリ管理](./external-meta-cache-memory-management)を参照してください。

## キャッシュ戦略

ほとんどのキャッシュには、次の三つの戦略を示す指標があります。

- キャッシュの最大件数

    キャッシュに保持できるオブジェクトの最大数です。たとえば、最大 1000 個のテーブルをキャッシュできます。キャッシュの件数がしきい値を超えると、LRU（Least-Recent-Used）戦略によって一部のキャッシュが削除されます。

- 有効期限

    - バージョン 3.0.6 以前（このバージョンを含む）：

        キャッシュオブジェクトが書き込まれてから一定時間が経過すると、そのオブジェクトはキャッシュから自動的に削除されます。次回のアクセス時には、データソースから最新情報を再取得してキャッシュを更新します。

        たとえば、ユーザーが 08:00 に初めてテーブル A にアクセスし、キャッシュに書き込んだとします。有効期限が 4 時間の場合、容量の問題によって置き換えられない限り、08:00-14:00 の間はキャッシュ内のテーブル A に直接アクセスします。14:00 を過ぎると、キャッシュは削除されます。ユーザーが再びテーブル A にアクセスすると、データソースから最新情報を取得してキャッシュを更新します。

    - バージョン 3.0.7 以降（このバージョンを含む）：

        バージョン 3.0.7 から、この戦略は、キャッシュオブジェクトが**書き込まれてから**一定時間後ではなく、**アクセスされてから**一定時間後に自動的に削除される方式に変更されました。キャッシュオブジェクトにアクセスするたびにタイマーがリセットされ、頻繁にアクセスされるオブジェクトはキャッシュに保持されます。

        たとえば、ユーザーが 08:00 に初めてテーブル A にアクセスし、キャッシュに書き込んだとします。有効期限が 4 時間の場合、容量の問題によって置き換えられない限り、08:00-14:00 の間はキャッシュ内のテーブル A に直接アクセスします。ユーザーが 09:00 にこのオブジェクトに再びアクセスすると、キャッシュの有効期限は 09:00 から再計算され、15:00 になります。

- 最短更新時間

    キャッシュオブジェクトが書き込まれてから一定時間が経過すると、更新が自動的にトリガーされます。

    たとえば、ユーザーが 08:00 に初めてテーブル A にアクセスし、キャッシュに書き込んだとします。最短更新時間が 10 分の場合、容量の問題によって置き換えられない限り、08:00-8:10 の間はキャッシュ内のテーブル A に直接アクセスします。08:10 にキャッシュオブジェクトは［更新待ち］とマークされます。その後、ユーザーがこのキャッシュオブジェクトに再びアクセスすると、現在のオブジェクトが返されると同時に、キャッシュの更新がトリガーされます。キャッシュの更新に 1 分かかる場合、その 1 分後に再びキャッシュにアクセスすると、更新済みのキャッシュオブジェクトを取得できます。

    キャッシュの更新がトリガーされるのは、［最短更新時間を超えた後にキャッシュオブジェクトに初めてアクセスしたとき］であり、更新は非同期で行われます。したがって、たとえば最短更新時間が 10 分であっても、10 分後に必ず最新のオブジェクトを取得できるわけではありません。

    この戦略は［有効期限］とは異なり、主にキャッシュの鮮度を調整するために使用します。キャッシュを非同期で更新することで、現在の操作がブロックされるのを防ぎます。

## キャッシュの種類

以下では、FE レベルの代表的なデフォルト値と従来のキャッシュ設定について説明します。
Doris 4.1.x 以降のキャッシュエントリを網羅した一覧として扱わないでください。

| カテゴリ | スコープ | FE の主なデフォルト設定 | 備考 |
|---|---|---|---|
| データベース名・テーブル名の一覧 | Catalog ごと・データベースごと | `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | `SHOW DATABASES` / `SHOW TABLES` で使用 |
| データベース・テーブルのオブジェクト | Catalog ごと・データベースごと | `max_meta_object_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | オブジェクトキャッシュと名前一覧のキャッシュは一時的に異なる場合がある |
| テーブルスキーマ | Catalog ごと | `max_external_schema_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 従来の Catalog ごとの上書き設定：`schema.cache.ttl-second` |
| Hive パーティション値 | Hive Catalog ごと | `max_hive_partition_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 従来の Catalog ごとの上書き設定：`partition.cache.ttl-second` |
| Hive パーティションのプロパティ | Hive Catalog ごと | `max_hive_partition_cache_num`, `external_cache_expire_time_seconds_after_access` | 従来の Catalog ごとの TTL 上書き設定はない |
| Hive ファイル一覧 | Hive Catalog ごと | `max_external_file_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 従来の Catalog ごとの上書き設定：`file.meta.cache.ttl-second` |
| Hudi / Iceberg / Paimon の従来のテーブルレベルメタデータ | Catalog ごと | `max_external_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Doris 4.1.x 以降では、`fs_view`、`meta_client`、`view`、`manifest` など、現在のキャッシュエントリについて各 Catalog のページを参照 |

### データベース名とテーブル名の一覧

データベース名の一覧は、Catalog 内にあるすべてのデータベース名の一覧です。

テーブル名の一覧は、データベース内にあるすべてのテーブル名の一覧です。

名前の一覧は、`SHOW TABLES` や `SHOW DATABASES` のように、名前を列挙する必要がある操作でのみ使用されます。

各 Catalog にはデータベース名一覧のキャッシュがあります。各データベースにはテーブル名一覧のキャッシュがあります。

- キャッシュの最大件数

    各キャッシュに含まれるエントリは一件だけです。そのため、キャッシュの最大件数は 1 です。

- 有効期限

    86400 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新の名前一覧をより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### データベースとテーブルのオブジェクト

個々のデータベースオブジェクトとテーブルオブジェクトをキャッシュします。クエリや書き込みなど、データベースやテーブルへのアクセス操作では、このキャッシュから対応するオブジェクトを取得します。

このキャッシュ内のオブジェクト一覧は、**データベース名とテーブル名の一覧**のキャッシュと一致しない場合があります。

たとえば、`SHOW TABLES` コマンドで名前一覧のキャッシュからテーブル `A`、`B`、`C` を取得したとします。この時点で外部データソースにテーブル `D` が追加されると、`SELECT * FROM D` でテーブル `D` にアクセスでき、［テーブルオブジェクト］のキャッシュにはテーブル `D` のオブジェクトが追加されます。一方、［テーブル名一覧］のキャッシュはまだ `A`、`B`、`C` のままかもしれません。［テーブル名一覧］のキャッシュが更新されると、初めて `A`、`B`、`C`、`D` になります。

各 Catalog にはデータベースオブジェクトのキャッシュがあります。各データベースにはテーブルオブジェクトのキャッシュがあります。

- キャッシュの最大件数

    FE の設定項目 `max_meta_object_cache_num` で指定します。デフォルトは 1000 です。単一の Catalog 内のデータベース数や、単一のデータベース内のテーブル数に応じて、このパラメータを適切に調整できます。

- 有効期限

    86400 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新のデータベースやテーブルをより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### テーブルスキーマ

カラム名など、テーブルのスキーマ情報をキャッシュします。このキャッシュは主に、アクセスされたテーブルのスキーマを必要に応じて読み込むために使用します。これにより、不要な大量のテーブルスキーマが同期されて FE のメモリを消費するのを防ぎます。

このキャッシュは Catalog ごとに管理されます。

- キャッシュの最大件数

    FE の設定項目 `max_external_schema_cache_num` で指定します。デフォルトは 10000 です。

    Catalog 内のテーブルの総数に応じて、このパラメータを適切に調整できます。

- 有効期限

    86400 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新のスキーマをより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### Hive Metastore テーブルのパーティション一覧

Hive Metastore から同期されたテーブルのパーティション一覧をキャッシュします。この一覧はクエリ時のパーティションプルーニングに使用されます。

各 Hive Catalog にこのキャッシュが一つあります。

- キャッシュの最大件数

    FE の設定項目 `max_hive_partition_table_cache_num` で指定します。デフォルトは 1000 です。

    Catalog 内のテーブルの総数に応じて、このパラメータを適切に調整できます。

- 有効期限

    28800 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新のパーティション一覧をより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### Hive Metastore テーブルのパーティションプロパティ

ファイル形式やパーティションのルートパスなど、Hive テーブルの各パーティションのプロパティをキャッシュします。各クエリでは、パーティションプルーニングによってアクセス対象のパーティション一覧を得た後、このキャッシュを通じて各パーティションの詳細なプロパティを取得します。

各 Hive Catalog にこのキャッシュが一つあります。

- キャッシュの最大件数

    FE の設定項目 `max_hive_partition_cache_num` で指定します。デフォルトは 10000 です。

    Catalog 内でアクセスするパーティションの総数に応じて、このパラメータを適切に調整できます。

- 有効期限

    28800 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新のパーティションプロパティをより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### Hive Metastore テーブルのパーティションファイル一覧

Hive テーブルの単一パーティション内のファイル一覧情報をキャッシュします。このキャッシュはファイルシステムの List 操作にかかる負荷を軽減するために使用します。

- キャッシュの最大件数

    FE の設定項目 `max_external_file_cache_num` で指定します。デフォルトは 10000 です。

    アクセスするファイルの数に応じて、このパラメータを適切に調整できます。

- 有効期限

    デフォルトは 28800 秒です。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

    Catalog のプロパティで `file.meta.cache.ttl-second` を設定した場合は、その設定時間が使用されます。

    Hive テーブルのデータファイルが頻繁に変更され、キャッシュの鮮度が要件を満たさない場合があります。このパラメータを 0 に設定すると、このキャッシュを無効にできます。この場合、クエリごとにファイル一覧がリアルタイムで取得されるため、性能が低下する可能性がありますが、ファイル情報の鮮度は向上します。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新のファイル一覧をより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### Hudi テーブルのパーティション

Hudi のパーティションメタデータキャッシュについての従来の概要です。
Doris 4.1.x 以降の現在の Hudi キャッシュエントリには、`fs_view` と `meta_client` も含まれます。[Hudi Catalog](./catalogs/hudi-catalog.md#meta-cache-unified-modules)を参照してください。

各 Hudi Catalog にこのキャッシュが一つあります。

- キャッシュの最大件数

    FE の設定項目 `max_external_table_cache_num` で指定します。デフォルトは 1000 です。

    Hudi テーブルの数に応じて、このパラメータを適切に調整できます。

- 有効期限

    28800 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新の Hudi パーティションプロパティをより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### Iceberg テーブル情報

Iceberg テーブルのメタデータキャッシュについての従来の概要です。テーブルオブジェクトは Iceberg API を通じて読み込まれ、構築されます。
Doris 4.1.x 以降で現在観測できるキャッシュエントリについては、[Iceberg Catalog](./catalogs/iceberg-catalog.mdx#meta-cache-unified-modules)を参照してください。

各 Iceberg Catalog にこのキャッシュが一つあります。

- キャッシュの最大件数

    FE の設定項目 `max_external_table_cache_num` で指定します。デフォルトは 1000 です。

    Iceberg テーブルの数に応じて、このパラメータを適切に調整できます。

- 有効期限

    28800 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新の Iceberg テーブルプロパティをより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

### Iceberg のスナップショット関連メタデータ

Iceberg テーブルのメタデータから得られるスナップショット関連メタデータについての従来の概要です。
現在の実装では、これを `table`、`view`、`manifest` と並ぶ独立した 4.1.x のキャッシュエントリとして扱わないでください。

- キャッシュの最大件数

    FE の設定項目 `max_external_table_cache_num` で指定します。デフォルトは 1000 です。

    Iceberg テーブルの数に応じて、このパラメータを適切に調整できます。

- 有効期限

    28800 秒に固定されています。バージョン 3.0.7 以降は FE パラメータ `external_cache_expire_time_seconds_after_access` で設定され、デフォルトは 86400 秒です。

- 最短更新時間

    FE の設定項目 `external_cache_expire_time_minutes_after_access` で分単位で指定します。デフォルトは 10 分です。この時間を短くすると、Doris で最新の Iceberg テーブルプロパティをより早く確認できますが、外部データソースへのアクセス頻度が増えます。

    バージョン 3.0.7 以降、設定項目の名前は `external_cache_refresh_time_minutes` に変更されました。デフォルト値は変わりません。

## キャッシュの更新

上記の更新戦略と有効期限のほかに、ユーザーはメタデータを手動またはスケジュールに従って更新することもできます。

### 手動更新

`REFRESH` ステートメントを使用して、Catalog、データベース、またはテーブルのメタデータを無効化します。
現在の構文、権限、例については、[REFRESH](../sql-manual/sql-statements/catalog/REFRESH.md)を参照してください。

動作の概要：

- `REFRESH CATALOG` は Catalog レベルのオブジェクトキャッシュを無効化し、デフォルトでは下位レベルのメタデータキャッシュも無効化します。
- `REFRESH DATABASE` は一つのデータベース配下のメタデータを無効化します。
- `REFRESH TABLE` は一つのテーブルのメタデータを無効化します。
- `REFRESH CATALOG` では、`invalid_cache = false` を指定すると下位レベルのキャッシュを保持し、オブジェクトと名前の一覧のみを更新します。

### スケジュール更新

Catalog の作成時に、定期的な更新を設定できます。

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '3600'
);
```

上の例で、`metadata_refresh_interval_sec` は Catalog が 3600 秒ごとに更新されることを意味します。これは、3600 秒ごとに次のステートメントを自動的に一回実行することと同じです。

`REFRESH CATALOG ctl1;`

## ベストプラクティス

キャッシュを使用すると、メタデータへのアクセス性能を大幅に向上させ、リモートのメタデータへの頻繁なアクセスを避けられます。頻繁なアクセスは性能のばらつきやメタデータサービスへの負荷につながる可能性があります。一方、キャッシュによってデータの鮮度は低下します。たとえば、キャッシュの更新時間が 10 分の場合、その間はキャッシュされたメタデータのみを読み取れます。そのため、状況に応じてキャッシュを適切に設定する必要があります。

### デフォルトの動作

このセクションでは、主にデフォルトのパラメータ設定でユーザーが気にかける可能性のあるキャッシュの動作を説明します。

- 外部データソースに新しいデータベースまたはテーブルが追加された場合、Doris では SELECT を使ってリアルタイムでクエリできます。ただし、SHOW DATABASES や SHOW TABLES には表示されない場合があります。その場合は、キャッシュを手動で更新するか、最大 10 分待つ必要があります。
- 外部データソースに新しいパーティションが追加された場合、新しいパーティションのデータをクエリするには、キャッシュを手動で更新するか、最大 10 分待つ必要があります。
- パーティションのデータファイルが変更された場合、新しいパーティションのデータをクエリするには、キャッシュを手動で更新するか、最大 10 分待つ必要があります。

### スキーマキャッシュを無効にする

すべての種類の External Catalog で最新のテーブルスキーマをリアルタイムに確認したい場合は、スキーマキャッシュを無効にできます。

- 全体で無効にする

    ```text
    -- fe.conf
    max_external_schema_cache_num=0 // Disable Schema cache.
    ```

- 従来の Catalog レベルのプロパティ

    ```text
    -- Catalog property
    "schema.cache.ttl-second" = "0" // Legacy property, supported in 2.1.11 / 3.0.6
    ```

設定後、Doris は最新のテーブルスキーマをリアルタイムに確認できるようになります。ただし、この設定によってメタデータサービスへの負荷が増える可能性があります。

### Hive Catalog のメタデータキャッシュを無効にする

Hive Catalog でキャッシュを無効にして、リアルタイムに更新されたデータをクエリしたい場合は、次のパラメータを設定できます。

- 全体で無効にする

    ```text
    -- fe.conf
    max_external_file_cache_num=0    // Disable file list cache
    max_hive_partition_table_cache_num=0  // Disable partition list cache
    max_hive_partition_cache_num=0   // Disable partition property cache
    ```

- 従来の Catalog レベルのプロパティ

    ```text
    -- Catalog property
    "file.meta.cache.ttl-second" = "0" // Disable file list cache
    "partition.cache.ttl-second" = "0" // Disable partition list cache (supported in 2.1.11 / 3.0.6)
    ```

上記のパラメータを設定すると、次のようになります。

- 外部データソースの新しいパーティションをリアルタイムでクエリできます。
- パーティションのデータファイルの変更をリアルタイムでクエリできます。
- パーティションプロパティの変更を反映するには、パーティションプロパティのキャッシュも無効にする必要があります。

ただし、Hive Metastore や HDFS などの外部データソースへのアクセス負荷が増え、メタデータへのアクセス時間が不安定になるなどの影響が生じる可能性があります。
