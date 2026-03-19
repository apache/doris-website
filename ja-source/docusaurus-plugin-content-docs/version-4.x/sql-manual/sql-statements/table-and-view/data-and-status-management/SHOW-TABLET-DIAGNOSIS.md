---
{
  "title": "SHOW TABLET DIAGNOSIS",
  "description": "この文は指定されたタブレットを診断するために使用されます。結果には、タブレットに関する情報と潜在的な問題が表示されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、指定されたtabletを診断するために使用されます。結果には、tabletに関する情報と潜在的な問題が表示されます。


## 構文

```sql
SHOW TABLET DIAGNOSIS <tablet_id>
```
## 必須パラメータ

**1. `<tablet_id>`**

診断対象のタブレットのIDです。

## 戻り値

| Column                           | DataType | Note                                                                                |
|----------------------------------|----------|-------------------------------------------------------------------------------------|
| TabletExist                      | String   | タブレットが存在するかどうかを示します。                                                |
| TabletId                         | String   | タブレットのIDです。                                                                   |
| Database                         | String   | タブレットが属するデータベースとそのIDです。                                            |
| Table                            | String   | タブレットが属するTableとそのIDです。                                               |
| パーティション                        | String   | タブレットが属するパーティションとそのIDです。                                          |
| MaterializedIndex                | String   | タブレットが属するマテリアライズドインデックスとそのIDです。                              |
| Replicas(ReplicaId -> BackendId) | String   | タブレットのレプリカとそれぞれのBEノードです。                                          |
| ReplicasNum                      | String   | レプリカ数が正しいかどうかを示します。                                                  |
| ReplicaBackendStatus             | String   | レプリカが配置されているBEノードが正常に機能しているかどうかを示します。                   |
| ReplicaVersionStatus             | String   | レプリカのバージョン番号が正しいかどうかを示します。                                     |
| ReplicaStatus                    | String   | レプリカのステータスが正常かどうかを示します。                                          |
| ReplicaCompactionStatus          | String   | レプリカのcompactionステータスが正常かどうかを示します。                               |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege  | Object   | 注釈                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Table、パーティション、システムレベルコマンドの管理を含む、データベースに対する管理操作の実行に必要です。 |

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
| パーティション                        | sell_user: 10142 |            |
| MaterializedIndex                | sell_user: 10144 |            |
| Replicas(ReplicaId -> BackendId) | {"10146":10009}  |            |
| ReplicasNum                      | OK               |            |
| ReplicaBackendStatus             | OK               |            |
| ReplicaVersionStatus             | OK               |            |
| ReplicaStatus                    | OK               |            |
| ReplicaCompactionStatus          | OK               |            |
+----------------------------------+------------------+------------+
```
