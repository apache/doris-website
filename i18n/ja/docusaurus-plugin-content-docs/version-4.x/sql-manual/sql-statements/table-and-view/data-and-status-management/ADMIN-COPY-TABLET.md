---
{
    "title": "ADMIN COPY TABLET",
    "language": "ja",
    "description": "指定したタブレットのスナップショットを作成する文です。主に、問題を再現するためにタブレットをローカルに読み込む際に使用します。"
}
---

## 説明

この文は、指定したタブレットのスナップショットを作成します。主に、問題を再現するためにタブレットをローカルに読み込む際に使用します。

## 構文

```sql
ADMIN COPY TABLET <tablet_id> PROPERTIES ("<key>"="<value>" [,...]).
```

## 必須パラメーター

**1. `<tablet_id>`**

コピーするタブレットの ID。

## オプションパラメーター

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

PROPERTIES 句では、次の追加パラメーターを指定できます。

**1. `<backend_id>`**

レプリカが配置されている BE ノードの ID を指定します。指定しない場合は、レプリカがランダムに選択されます。

**2. `<version>`**

スナップショットのバージョンを指定します。指定するバージョンは、レプリカの最大バージョン以下である必要があります。指定しない場合は、最大バージョンが使用されます。

**3. `<expiration_minutes>`**

スナップショットの保持時間を分単位で指定します。デフォルトは 1 時間です。保持時間が経過すると、スナップショットは自動的に削除されます。

## 戻り値

| カラム | データ型 | 説明 |
|---|---|---|
| TabletId | string | スナップショットを作成したタブレットの ID。 |
| BackendId | string | スナップショットが保存されている BE ノードの ID。 |
| Ip | string | スナップショットを保存している BE ノードの IP アドレス。 |
| Path | string | BE ノード上のスナップショットの保存パス。 |
| ExpirationMinutes | string | スナップショットが自動的に削除されるまでの時間（分）。 |
| CreateTableStmt | string | タブレットに対応するテーブルの作成文。元のテーブル作成文ではなく、後でタブレットをローカルに読み込むための簡略化された作成文です。 |

## アクセス権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
|:---|:---|:---|
| Admin_priv | データベース | テーブルやパーティションの管理、システムレベルのコマンドなど、データベースに対する管理操作を実行するために必要です。 |

## 例

- 指定した BE ノード上のレプリカのスナップショットを作成する場合：

  ```sql
  ADMIN COPY TABLET 10020 PROPERTIES("backend_id" = "10003");
  ```

  ```text
           TabletId: 10020
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```

- 指定した BE ノード上のレプリカについて、指定したバージョンのスナップショットを作成する場合：

  ```sql
  ADMIN COPY TABLET 10010 PROPERTIES("backend_id" = "10003", "version" = "10");
  ```

  ```text
           TabletId: 10010
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```
