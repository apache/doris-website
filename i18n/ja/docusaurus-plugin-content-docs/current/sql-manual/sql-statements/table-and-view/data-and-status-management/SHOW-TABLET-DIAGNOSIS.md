---
{
  "title": "TABLET診断を表示",
  "language": "ja",
  "description": "このステートメントは指定されたタブレットを診断するために使用されます。結果には、タブレットに関する情報と潜在的な問題が表示されます。"
}
---
## 説明

このステートメントは、指定されたタブレットを診断するために使用されます。結果には、タブレットに関する情報と潜在的な問題が表示されます。


## 構文

```sql
SHOW TABLET DIAGNOSIS <tablet_id>
```
## 必須パラメータ

**1. `<tablet_id>`**

診断対象のタブレットのID。

## 戻り値

| カラム                           | DataType | 備考                                                                                |
|----------------------------------|----------|-------------------------------------------------------------------------------------|
| TabletExist                      | String   | タブレットが存在するかどうかを示します。                                                |
| TabletId                         | String   | タブレットのID。                                                               |
| Database                         | String   | タブレットが属するデータベースとそのID。                              |
| Table                            | String   | タブレットが属するテーブルとそのID。                                 |
| Partition                        | String   | タブレットが属するパーティションとそのID。                             |
| MaterializedIndex                | String   | タブレットが属するマテリアライズドインデックスとそのID。                    |
| Replicas(ReplicaId -> BackendId) | String   | タブレットのレプリカとそれぞれのBEノード。                           |
| ReplicasNum                      | String   | レプリカ数が正しいかどうかを示します。                                |
| ReplicaBackendStatus             | String   | レプリカが配置されているBEノードが正常に機能しているかどうかを示します。 |
| ReplicaVersionStatus             | String   | レプリカのバージョン番号が正しいかどうかを示します。                     |
| ReplicaStatus                    | String   | レプリカのステータスが正常かどうかを示します。                                     |
| ReplicaCompactionStatus          | String   | レプリカのコンパクションステータスが正常かどうかを示します。                   |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限  | オブジェクト   | 備考                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | テーブル、パーティション、システムレベルコマンドの管理を含む、データベースに対する管理操作の実行に必要です。 |

## 例

```sql
SHOW TABLET DIAGNOSIS 10145;
```
```text
+----------------------------------+------------------+------------+
| Item                             | Info             | Suggestion |
+----------------------------------+------------------+------------+
| TabletExist                      | Yes              |            |
| TabletId                         | 10145            |            |
| Database                         | test: 10103      |            |
| Table                            | sell_user: 10143 |            |
| Partition                        | sell_user: 10142 |            |
| MaterializedIndex                | sell_user: 10144 |            |
| Replicas(ReplicaId -> BackendId) | {"10146":10009}  |            |
| ReplicasNum                      | OK               |            |
| ReplicaBackendStatus             | OK               |            |
| ReplicaVersionStatus             | OK               |            |
| ReplicaStatus                    | OK               |            |
| ReplicaCompactionStatus          | OK               |            |
+----------------------------------+------------------+------------+
```
