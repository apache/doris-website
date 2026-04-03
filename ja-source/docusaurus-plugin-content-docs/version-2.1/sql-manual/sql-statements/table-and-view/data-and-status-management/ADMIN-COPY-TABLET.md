---
{
  "title": "ADMIN COPY TABLET",
  "language": "ja",
  "description": "このステートメントは指定されたタブレットのスナップショットを作成するために使用され、主にタブレットをローカルに読み込んで問題を再現するために使用されます。"
}
---
## 説明

このステートメントは、指定されたタブレットのスナップショットを作成するために使用され、主にタブレットをローカルに読み込んで問題を再現するために使用されます。

## 構文

```sql
ADMIN COPY TABLET <tablet_id> PROPERTIES ("<key>"="<value>" [,...]).
```
## 必須パラメータ

**1. `<tablet_id>`**

コピーするタブレットのIDです。

## オプションパラメータ

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```
PROPERTIES句では追加のパラメータを指定できます：

**1. `<backend_id>`**

レプリカが配置されているBEノードのidを指定します。指定されていない場合、レプリカはランダムに選択されます。

**2. `<version>`**

スナップショットのバージョンを指定します。バージョンはレプリカの最大バージョン以下である必要があります。指定されていない場合、最大バージョンが使用されます。

**3. `<expiration_minutes>`**

スナップショットの保持時間。デフォルトは1時間です。タイムアウト後に自動的にクリーンアップされます。単位は分です。

## 戻り値

| Column            | DataType | Note                                                                                                                                                                                                                 |
|-------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TabletId          | string   | スナップショットが作成されたタブレットのID。                                                                                                                                                             |
| BackendId         | string   | スナップショットが保存されているBEノードのID。                                                                                                                                                                  |
| Ip                | string   | スナップショットを保存しているBEノードのIPアドレス。                                                                                                                                                                  |
| Path              | string   | BEノードでスナップショットが保存されているストレージパス。                                                                                                                                                         |
| ExpirationMinutes | string   | スナップショットが自動的に削除されるまでの時間（分単位）。                                                                                                                                    |
| CreateTableStmt   | string   | タブレットに対応するテーブルのテーブル作成文。この文は元のテーブル構築文ではなく、後でタブレットをローカルに読み込むための簡略化されたテーブル構築文です。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | テーブル、パーティション、システムレベルコマンドの管理を含む、データベースでの管理操作を実行するために必要です。 |

## 例

- 指定されたBEノード上のレプリカのスナップショットを取得する

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
- 指定されたBEノード上の指定されたバージョンのレプリカのスナップショットを取得する

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
