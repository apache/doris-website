---
{
    "title": "SHOW TABLET DIAGNOSIS",
    "language": "ja",
    "description": "この文は、指定したタブレットを診断します。結果には、タブレットの情報と、発生している可能性のある問題が表示されます。"
}
---

## 説明

この文は、指定したタブレットを診断します。結果には、タブレットの情報と、発生している可能性のある問題が表示されます。


## 構文

```sql
SHOW TABLET DIAGNOSIS <tablet_id>
```

## 必須パラメーター

**1. `<tablet_id>`**

診断するタブレットの ID。

## 戻り値

| カラム                           | データ型 | 説明                                                                                |
|----------------------------------|----------|-------------------------------------------------------------------------------------|
| TabletExist                      | String   | タブレットが存在するかどうかを示します。                                              |
| TabletId                         | String   | タブレットの ID。                                                                   |
| Database                         | String   | タブレットが属するデータベースとその ID。                                              |
| Table                            | String   | タブレットが属するテーブルとその ID。                                                  |
| Partition                        | String   | タブレットが属するパーティションとその ID。                                             |
| MaterializedIndex                | String   | タブレットが属するマテリアライズドインデックスとその ID。                                  |
| Replicas(ReplicaId -> BackendId) | String   | タブレットのレプリカと、それぞれが配置されている BE ノード。                             |
| ReplicasNum                      | String   | レプリカ数が正しいかどうかを示します。                                                  |
| ReplicaBackendStatus             | String   | レプリカが配置されている BE ノードが正常に稼働しているかどうかを示します。                    |
| ReplicaVersionStatus             | String   | レプリカのバージョン番号が正しいかどうかを示します。                                       |
| ReplicaStatus                    | String   | レプリカの状態が正常かどうかを示します。                                                |
| ReplicaCompactionStatus          | String   | レプリカのコンパクション状態が正常かどうかを示します。                                     |

## アクセス権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限       | 対象           | 備考                                                                                           |
|:-----------|:---------------|:-----------------------------------------------------------------------------------------------|
| Admin_priv | データベース   | テーブルやパーティションの管理、システムレベルのコマンドなど、データベースに対する管理操作を実行するために必要です。 |

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
