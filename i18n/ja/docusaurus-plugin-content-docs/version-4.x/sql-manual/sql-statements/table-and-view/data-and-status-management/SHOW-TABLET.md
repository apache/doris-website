---
{
    "title": "SHOW TABLET",
    "language": "ja",
    "description": "タブレット情報を確認します。ID で単一のタブレットを特定するか、テーブルまたはパーティション内の全タブレットについて、レプリカの配置、バージョン、データサイズを一覧表示します。",
    "keywords": [
        "SHOW TABLET",
        "SHOW TABLETS FROM",
        "Doris のタブレット情報",
        "レプリカの配置",
        "LocalDataSize",
        "RemoteDataSize",
        "CompactionStatus",
        "VersionCount",
        "タブレットのトラブルシューティング"
    ]
}
---

## 説明

`SHOW TABLET` はタブレット情報を確認するための管理者専用コマンドで、次の 2 つの形式があります。

- `SHOW TABLET <tablet_id>`: タブレット ID から、そのタブレットが属するデータベース、テーブル、パーティション、インデックスを調べます。
- `SHOW TABLETS FROM <table_name>`: テーブル全体または指定したパーティション内の各タブレットについて、レプリカの配置、バージョン、データサイズ、コンパクションの状態を一覧表示します。

これらを組み合わせて使うこともできます。最初の形式でタブレットを特定し、次の形式で同じパーティション内のほかのレプリカを確認します。

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Replica status troubleshooting / Data skew analysis / Compaction troubleshooting -->

:::info Note

どちらの文も Internal Catalog のテーブルのみをサポートします。External Catalog はサポートしません。

:::

## 構文

```sql
-- Inspect a single tablet by its id
SHOW TABLET <tablet_id>

-- List every tablet of a table
SHOW TABLETS FROM <table_name>
    [ PARTITIONS ( <partition_name> [, ... ] ) ]
    [ WHERE <where_condition> ]
    [ ORDER BY <column_name> [ ASC | DESC ] [, ... ] ]
    [ LIMIT [ <offset>, ] <row_count> ]
```

## パラメータ

### SHOW TABLET

**1. `<tablet_id>`**

> 必須。問い合わせるタブレットの ID です。

### SHOW TABLETS FROM

**1. `<table_name>`**

> 必須。テーブル名です。`db_name.table_name` 形式も使用できます。

**2. `PARTITIONS ( <partition_name> [, ... ] )`**

> 任意。結果を指定したパーティションに限定します。省略すると、テーブルの全パーティションを確認します。

**3. `WHERE <where_condition>`**

> 任意。フィルタ条件です。次の 3 つのフィールドに対する等価比較のみをサポートし、`AND` で組み合わせることができます。
>
> | フィールド | 型 | 説明 |
> | --- | --- | --- |
> | `Version` | 整数 | レプリカのバージョンで絞り込みます |
> | `BackendId` | 整数 | レプリカをホストする BE ノードの ID で絞り込みます |
> | `State` | 文字列 | レプリカの状態で絞り込みます: `NORMAL`、`ROLLUP`、`CLONE`、`DECOMMISSION` |
>
> ほかのフィールド、等価比較以外の比較、および `OR` を使用すると、いずれもエラーになります。
>
> ```text
> Where clause should looks like: Version = "version", or state = "NORMAL|ROLLUP|CLONE|DECOMMISSION", or BackendId = 10000 or compound predicate with operator AND
> ```

**4. `ORDER BY <column_name>`**

> 任意。結果の列で並べ替えます。並べ替えに使う列は、以下の「戻り値」に記載された列のいずれかである必要があります。
>
> `ORDER BY` を指定すると、Doris はすべてのタブレットを収集してから並べ替えるため、結果は**全体を通した順序**での Top-N になります。

**5. `LIMIT [ <offset>, ] <row_count>`**

> 任意。返す行数を制限します。タブレットが多いテーブルでは指定を推奨します。
>
> `LIMIT` と `OFFSET` は並べ替えの後に適用されます。`ORDER BY` がない場合は、必要な行数が集まった時点でスキャンを停止し、結果は `(TabletId, ReplicaId)` 順の先頭部分になります。

:::caution Behavior change (4.1.4)

- 4.1.4 より前は、`ORDER BY` で並べ替えられるのは、スキャンで先に到達した行だけである場合がありました。そのため、結果が全体の正しい Top-N とは限りませんでした。4.1.4 以降は、すべてのタブレットを収集してから並べ替えます。
- 4.1.4 より前は、`OFFSET` を単独で（正の値の `LIMIT` を指定せずに）使用すると無視され、`OFFSET` が総行数より大きい場合は結果全体が空になりました。4.1.4 以降は、`OFFSET` が常に適用されます。

:::

## 戻り値

### SHOW TABLET

| 列        | データ型 | 説明                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | タブレットが属するデータベースの名前。                     |
| TableName     | String   | タブレットが属するテーブルの名前。                        |
| PartitionName | String   | タブレットが属するパーティションの名前。                    |
| IndexName     | String   | タブレットが属するインデックスの名前。                        |
| DbId          | Int      | データベースの ID。                                                |
| TableId       | Int      | テーブルの ID。                                                   |
| PartitionId   | Int      | パーティションの ID。                                               |
| IndexId       | Int      | インデックスの ID。                                                   |
| IsSync        | Boolean  | タブレットがそのレプリカと同期しているかどうか。                       |
| Order         | Int      | インデックス内でのタブレットの順序。                              |
| QueryHits     | Int      | このタブレットに対するクエリのヒット数。                               |
| WindowAccessCount | Int  | スライディング統計ウィンドウ内での、このタブレットへのアクセス回数。 |
| LastAccessTime| Int      | このタブレットへの最終アクセス時刻をミリ秒単位で表したタイムスタンプ。アクセス履歴がない場合は `0`。 |
| DetailCmd     | String   | タブレットの詳細情報を取得するためのコマンド。         |

### SHOW TABLETS FROM

各行は 1 つのレプリカに対応するため、同じ `TabletId` がレプリカごとに 1 回ずつ現れます。

| 列 | データ型 | 説明 |
|---|---|---|
| TabletId | Int | タブレット ID |
| ReplicaId | Int | レプリカ ID |
| BackendId | Int | レプリカをホストする BE ノードの ID |
| SchemaHash | Int | レプリカのスキーマハッシュ |
| Version | Int | レプリカの現在の可視バージョン |
| LstSuccessVersion | Int | 最後に正常にロードされたバージョン |
| LstFailedVersion | Int | 最後に失敗したバージョン。失敗したバージョンがない場合は `-1` |
| LstFailedTime | String | バージョンの最終失敗時刻。失敗がない場合は `\N` |
| LocalDataSize | Int | レプリカのローカルデータサイズ（バイト）。コンピュートとストレージを分離したモードでは通常 `0`。以下の「分離モードでのデータサイズの意味」を参照 |
| RemoteDataSize | Int | レプリカのリモートデータサイズ（バイト） |
| RowCount | Int | レプリカの行数 |
| State | String | レプリカの状態: `NORMAL`、`ROLLUP`、`CLONE`、`DECOMMISSION` |
| LstConsistencyCheckTime | String | 最後の整合性チェックの時刻。チェックされたことがない場合は `\N` |
| CheckVersion | Int | 最後の整合性チェックのバージョン。チェックされたことがない場合は `-1` |
| VisibleVersionCount | Int | レプリカの可視バージョン数 |
| VersionCount | Int | レプリカの総バージョン数。コンパクションが遅れているかどうかの判断に役立ちます |
| QueryHits | Int | このレプリカに対するクエリのヒット数 |
| WindowAccessCount | Int | スライディング統計ウィンドウ内での、このタブレットへのアクセス回数 |
| LastAccessTime | Int | このタブレットへの最終アクセス時刻をミリ秒単位で表したタイムスタンプ。アクセス履歴がない場合は `0` |
| PathHash | Int | レプリカをホストするデータディレクトリのハッシュ |
| Path | String | レプリカをホストする BE のデータルートディレクトリ。解決できない場合は空 |
| MetaUrl | String | レプリカのメタデータを確認するための HTTP アドレス。形式は `http://<be_host>:<be_http_port>/api/meta/header/<tablet_id>` |
| CompactionStatus | String | レプリカのコンパクション状態を確認するための HTTP アドレス。形式は `http://<be_host>:<be_http_port>/api/compaction/show?tablet_id=<tablet_id>` |
| CooldownReplicaId | Int | クールダウンレプリカの ID。階層型ストレージが有効でない場合は `-1` |
| CooldownMetaId | String | クールダウンのメタデータ ID。階層型ストレージが有効でない場合は空 |
| PrimaryBackendId | Int | このタブレットのプライマリ BE ノードの ID。**コンピュートとストレージを分離したモードでのみ返されます** |

### 分離モードでのデータサイズの意味

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

:::caution Behavior change (4.0.8)

バージョン 4.0.8 以降、コンピュートとストレージを分離したモードでのレプリカのデータサイズは、**リモート**の値として一貫して報告されます。レプリカの統計情報でリモートとして記録されていないデータサイズも `RemoteDataSize` に算入され、対応する `LocalDataSize` は `0` として報告されます。そのため、分離構成のクラスタでは通常、`LocalDataSize` が `0` となり、実際のデータサイズは `RemoteDataSize` に表示されます。

4.0.8 より前は、このデータサイズが `LocalDataSize` に算入されていたため、`SHOW TABLETS`、[`information_schema.partitions`](../../../../admin-manual/system-tables/information_schema/partitions)、[`information_schema.backend_tablets`](../../../../admin-manual/system-tables/information_schema/backend_tablets) の間で、ローカルとリモートの値が一致しませんでした。この変更はサイズの報告方法のみを調整するもので、データの保存場所やデータ量は変わりません。

:::

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限  | 対象   | 説明                                                                                    |
|:-----------|:---------|:-----------------------------------------------------------------------------------------|
| Admin_priv | グローバル   | どちらの文にもグローバルな `ADMIN` 権限が必要です。権限がない場合は `Access denied` エラーが発生します。 |

## 例

### ID で単一のタブレットを確認する

```sql
SHOW TABLET 10145;
```

```text
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| DbName | TableName | PartitionName | IndexName | DbId  | TableId | PartitionId | IndexId | IsSync | Order | QueryHits | WindowAccessCount | LastAccessTime | DetailCmd                                                  |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| test   | sell_user | sell_user     | sell_user | 10103 | 10143   | 10142       | 10144   | true   | 0     | 0         | 0                 | 0              | SHOW PROC '/dbs/10103/10143/partitions/10142/10144/10145'; |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
```

`SHOW PROC` 文は `DetailCmd` 列に示されており、実行するとそのタブレットのレプリカについて、さらに詳しい情報を確認できます。

### テーブル内の全タブレットを一覧表示する

```sql
SHOW TABLETS FROM example_db.sell_user;
```

### 結果を指定したパーティションに限定する

```sql
SHOW TABLETS FROM example_db.sell_user PARTITIONS(p202601, p202602);
```

### レプリカの状態とホストノードで絞り込む

```sql
SHOW TABLETS FROM example_db.sell_user WHERE State = "NORMAL" AND BackendId = 10003;
```

### コンパクションが遅れているタブレットを探す

バージョン数の降順に並べ替えると、コンパクションの負荷が特に高いタブレットが上位に表示されます。

```sql
SHOW TABLETS FROM example_db.sell_user ORDER BY VersionCount DESC LIMIT 10;
```

結果の `CompactionStatus` 列には HTTP アドレスが表示されます。ブラウザで開くと、そのレプリカのコンパクション状態の詳細を確認できます。

### データの偏りを調べる

データサイズの降順に並べ替えると、ほかのタブレットより明らかに大きいタブレットをすばやく見つけられます。

```sql
-- Integrated storage-compute mode
SHOW TABLETS FROM example_db.sell_user ORDER BY LocalDataSize DESC LIMIT 10;

-- Compute-storage decoupled mode (data size is reported in RemoteDataSize)
SHOW TABLETS FROM example_db.sell_user ORDER BY RemoteDataSize DESC LIMIT 10;
```
