---
{
    "title": "SHOW TABLET",
    "language": "ja",
    "description": "タブレットの情報を確認します。ID を指定して個々のタブレットを特定するか、テーブルまたはパーティション内の全タブレットについてレプリカの配置、バージョン、データサイズを一覧表示します。",
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

`SHOW TABLET` はタブレットの情報を確認する管理者向けのコマンドで、次の二つの形式があります。

- `SHOW TABLET <tablet_id>`: タブレット ID を指定し、そのタブレットが属するデータベース、テーブル、パーティション、インデックスを調べます。
- `SHOW TABLETS FROM <table_name>`: テーブル全体または指定したパーティション内の各タブレットについて、レプリカの配置、バージョン、データサイズ、コンパクションの状態を一覧表示します。

この二つの形式は組み合わせて使えます。最初の形式でタブレットを特定し、次の形式で同じパーティション内のほかのレプリカを確認します。

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Replica status troubleshooting / Data skew analysis / Compaction troubleshooting -->

:::info 注意

どちらのコマンドも Internal Catalog のテーブルのみをサポートします。External Catalog はサポートしません。

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

> 必須。照会するタブレットの ID。

### SHOW TABLETS FROM

**1. `<table_name>`**

> 必須。テーブル名。`db_name.table_name` 形式も使用できます。

**2. `PARTITIONS ( <partition_name> [, ... ] )`**

> 任意。結果を指定したパーティションに限定します。省略すると、テーブル内の全パーティションを確認します。

**3. `WHERE <where_condition>`**

> 任意。フィルタ条件。次の三つのフィールドに対する等価比較のみをサポートし、条件は `AND` で結合できます。
>
> | フィールド | 型 | 説明 |
> | --- | --- | --- |
> | `Version` | 整数 | レプリカのバージョンで絞り込みます |
> | `BackendId` | 整数 | レプリカを保持する BE ノードの ID で絞り込みます |
> | `State` | 文字列 | レプリカの状態（`NORMAL`、`ROLLUP`、`CLONE`、`DECOMMISSION`）で絞り込みます |
>
> ほかのフィールド、等価比較以外の比較、`OR` はいずれもエラーになります。
>
> ```text
> Where clause should looks like: Version = "version", or state = "NORMAL|ROLLUP|CLONE|DECOMMISSION", or BackendId = 10000 or compound predicate with operator AND
> ```

**4. `ORDER BY <column_name>`**

> 任意。結果の列を指定して並べ替えます。並べ替えに指定する列は、後述の「戻り値」に記載された列のいずれかである必要があります。
>
> `ORDER BY` を指定すると、Doris は並べ替えの前に全タブレットを収集するため、**全体を対象に並べ替えた** Top-N 結果が得られます。

**5. `LIMIT [ <offset>, ] <row_count>`**

> 任意。返す行数を制限します。タブレットが多いテーブルでは使用を推奨します。
>
> `LIMIT` と `OFFSET` は並べ替え後に適用されます。`ORDER BY` がない場合、必要な行数が集まるとスキャンを停止します。`LIMIT` を指定した場合はスキャン順の先頭から行が返され、`LIMIT` がない場合は結果全体が `(TabletId, ReplicaId)` 順に並べられます。

:::caution 動作の変更（4.1.4）

- 4.1.4 より前は、`ORDER BY` がスキャンで先に到達した行だけを並べ替えることがあり、結果が全体の真の Top-N にならない場合がありました。4.1.4 以降は、並べ替えの前に全タブレットを収集します。
- 4.1.4 より前は、`OFFSET` を単独で指定した場合（正の値の `LIMIT` を伴わない場合）は無視され、`OFFSET` が総行数を超えると結果全体が空になっていました。4.1.4 以降は、`OFFSET` が常に適用されます。

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
| IsSync        | Boolean  | タブレットがレプリカと同期しているかどうか。                       |
| Order         | Int      | インデックス内でのタブレットの順序。                              |
| QueryHits     | Int      | このタブレットに対するクエリのヒット数。                               |
| WindowAccessCount | Int  | スライディング統計ウィンドウ内でこのタブレットにアクセスした回数。 |
| LastAccessTime| Int      | このタブレットへの最終アクセス時刻をミリ秒単位で示すタイムスタンプ。アクセス履歴がない場合は `0`。 |
| DetailCmd     | String   | タブレットの詳細情報を取得するためのコマンド。         |

### SHOW TABLETS FROM

各行は一つのレプリカに対応するため、同じ `TabletId` がレプリカごとに一回ずつ表示されます。

| 列 | データ型 | 説明 |
|---|---|---|
| TabletId | Int | タブレット ID |
| ReplicaId | Int | レプリカ ID |
| BackendId | Int | レプリカを保持する BE ノードの ID |
| SchemaHash | Int | レプリカのスキーマハッシュ |
| Version | Int | 現在表示可能なレプリカのバージョン |
| LstSuccessVersion | Int | 最後にロードに成功したバージョン |
| LstFailedVersion | Int | 最後に失敗したバージョン。失敗したバージョンがない場合は `-1` |
| LstFailedTime | String | 最後にバージョンの処理が失敗した時刻。失敗がない場合は `\N` |
| LocalDataSize | Int | レプリカのローカルデータサイズ（バイト）。コンピュートとストレージの分離モードでは通常 `0`。後述の「分離モードにおけるデータサイズの意味」を参照 |
| RemoteDataSize | Int | レプリカのリモートデータサイズ（バイト） |
| RowCount | Int | レプリカの行数 |
| State | String | レプリカの状態: `NORMAL`、`ROLLUP`、`CLONE`、`DECOMMISSION` |
| LstConsistencyCheckTime | String | 最後に整合性をチェックした時刻。チェックしたことがない場合は `\N` |
| CheckVersion | Int | 最後に整合性をチェックしたバージョン。チェックしたことがない場合は `-1` |
| VisibleVersionCount | Int | レプリカの表示可能なバージョンの数 |
| VersionCount | Int | レプリカの全バージョン数。コンパクションの遅れを判断する際に役立ちます |
| QueryHits | Int | このレプリカに対するクエリのヒット数 |
| WindowAccessCount | Int | スライディング統計ウィンドウ内でこのタブレットにアクセスした回数 |
| LastAccessTime | Int | このタブレットへの最終アクセス時刻をミリ秒単位で示すタイムスタンプ。アクセス履歴がない場合は `0` |
| PathHash | Int | レプリカを保持するデータディレクトリのハッシュ |
| Path | String | レプリカを保持する BE のデータルートディレクトリ。特定できない場合は空 |
| MetaUrl | String | レプリカのメタデータを確認するための HTTP アドレス。形式は `http://<be_host>:<be_http_port>/api/meta/header/<tablet_id>` |
| CompactionStatus | String | レプリカのコンパクション状態を確認するための HTTP アドレス。形式は `http://<be_host>:<be_http_port>/api/compaction/show?tablet_id=<tablet_id>` |
| CooldownReplicaId | Int | クールダウンレプリカの ID。階層化ストレージが有効でない場合は `-1` |
| CooldownMetaId | String | クールダウンメタデータの ID。階層化ストレージが有効でない場合は空 |
| PrimaryBackendId | Int | このタブレットのプライマリ BE ノードの ID。**コンピュートとストレージの分離モードでのみ返されます** |

### 分離モードにおけるデータサイズの意味

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

:::caution 動作の変更（4.0.8）

バージョン 4.0.8 以降、コンピュートとストレージの分離モードにおけるレプリカのデータサイズは、**リモート**データとして一貫して報告されます。レプリカの統計でリモートとして記録されていないデータサイズは `RemoteDataSize` に計上され、対応する `LocalDataSize` は `0` として報告されます。そのため、分離構成のクラスタでは通常 `LocalDataSize` が `0` となり、実際のデータサイズは `RemoteDataSize` に表示されます。

4.0.8 より前は、そのデータサイズが `LocalDataSize` に計上されていたため、`SHOW TABLETS`、[`information_schema.partitions`](../../../../admin-manual/system-tables/information_schema/partitions)、[`information_schema.backend_tablets`](../../../../admin-manual/system-tables/information_schema/backend_tablets) の間で、ローカルとリモートの値が矛盾していました。この変更はサイズの報告方法だけを調整するものであり、データの保存場所やデータ量は変わりません。

:::

## アクセス権限の要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限  | 対象   | 説明                                                                                    |
|:-----------|:---------|:-----------------------------------------------------------------------------------------|
| Admin_priv | Global   | どちらのコマンドにもグローバルな `ADMIN` 権限が必要です。権限がない場合は `Access denied` エラーになります。 |

## 例

### ID を指定して単一のタブレットを確認する

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

`SHOW PROC` 文は `DetailCmd` 列に示され、そのタブレットのレプリカをさらに詳しく確認するために使用できます。

### テーブル内の全タブレットを一覧表示する

```sql
SHOW TABLETS FROM example_db.sell_user;
```

### 結果を特定のパーティションに限定する

```sql
SHOW TABLETS FROM example_db.sell_user PARTITIONS(p202601, p202602);
```

### レプリカの状態と配置先ノードで絞り込む

```sql
SHOW TABLETS FROM example_db.sell_user WHERE State = "NORMAL" AND BackendId = 10003;
```

### コンパクションが遅れているタブレットを探す

バージョン数の降順に並べ替えると、コンパクションの負荷が最も高いタブレットを先頭に表示できます。

```sql
SHOW TABLETS FROM example_db.sell_user ORDER BY VersionCount DESC LIMIT 10;
```

結果の `CompactionStatus` 列には HTTP アドレスが表示されます。ブラウザで開くと、そのレプリカのコンパクション状態を詳しく確認できます。

### データの偏りを調べる

データサイズの降順に並べ替えると、ほかより明らかに大きいタブレットをすばやく見つけられます。

```sql
-- Integrated storage-compute mode
SHOW TABLETS FROM example_db.sell_user ORDER BY LocalDataSize DESC LIMIT 10;

-- Compute-storage decoupled mode (data size is reported in RemoteDataSize)
SHOW TABLETS FROM example_db.sell_user ORDER BY RemoteDataSize DESC LIMIT 10;
```
