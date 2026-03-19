---
{
  "title": "タブレットを診断する",
  "language": "ja",
  "description": "コンピュート・ストレージ結合モードでは、このステートメントは指定されたtabletを診断するために使用されます。"
}
---
## 説明

compute-storage結合モードにおいて、このステートメントは指定されたタブレットを診断するために使用されます。結果には、タブレットに関する情報といくつかの潜在的な問題が表示されます。

このコマンドはcompute-storage結合モードではサポートされていません。

## 構文

```sql
SHOW TABLET DIAGNOSIS <tablet_id>;
```
## 必須パラメータ

<tablet_id>

> 診断対象のタブレットのID

## 戻り値 (Return Value)

タブレットに関する情報を返します

- TabletExist

  > タブレットが存在するかどうか

- TabletId

    > Tablet ID

- Database

  > タブレットが属するDBとそのID

- Table

  > タブレットが属するTableとそのID

- Partition

  > タブレットが属するPartitionとそのID

- MaterializedIndex

  > タブレットが属するマテリアライズドビューとそのID

- Replicas

  > タブレットのレプリカと対応するBE

- ReplicasNum

  > レプリカ数が正しいかどうか

- ReplicaBackendStatus

  > レプリカが配置されているBEノードが正常かどうか

- ReplicaVersionStatus

  > レプリカのバージョン番号が正常かどうか

- ReplicaStatus

  > レプリカのステータスが正常かどうか

- ReplicaCompactionStatus

  > レプリカのコンパクションステータスが正常かどうか

## 例

1. 指定されたtablet id 10078のタブレットの情報を診断する

  ```sql
  show tablet diagnosis 10078;
  +----------------------------------+---------------------------------------------+------------+
  | Item                             | Info                                        | Suggestion |
  +----------------------------------+---------------------------------------------+------------+
  | TabletExist                      | Yes                                         |            |
  | TabletId                         | 10078                                       |            |
  | Database                         | __internal_schema: 10005                    |            |
  | Table                            | audit_log: 10058                            |            |
  | Partition                        | p20241109: 10075                            |            |
  | MaterializedIndex                | audit_log: 10059                            |            |
  | Replicas(ReplicaId -> BackendId) | {"10099":10003,"10116":10002,"10079":10004} |            |
  | ReplicasNum                      | OK                                          |            |
  | ReplicaBackendStatus             | OK                                          |            |
  | ReplicaVersionStatus             | OK                                          |            |
  | ReplicaStatus                    | OK                                          |            |
  | ReplicaCompactionStatus          | OK                                          |            |
  +----------------------------------+---------------------------------------------+------------+
  ```
## アクセス制御要件（Access Control Requirements）

このSQLコマンドを正常に実行するための前提条件は、ADMIN_PRIV権限を持つことです。権限ドキュメントを参照してください。

| 権限（Privilege） | オブジェクト（Object）                      | 注記（Notes）                   |
| :-------------------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV            | クラスター管理権限全体 | NODE_PRIVを除くすべての権限 |

## 使用上の注意（Usage Note）

1. このコマンドはストレージ・コンピューティング分離モードではサポートされていません。このモードで実行するとエラーが発生します。例：

  ```sql
  show tablet diagnosis 15177;
  ```
エラーメッセージは以下の通りです：

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```
