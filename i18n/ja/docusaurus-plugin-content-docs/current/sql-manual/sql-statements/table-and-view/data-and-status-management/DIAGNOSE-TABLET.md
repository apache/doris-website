---
{
    "title": "DIAGNOSE TABLET",
    "language": "ja",
    "description": "コンピュートとストレージの結合モードで、指定したタブレットを診断するために使用するステートメントです。"
}
---

## 説明

コンピュートとストレージの結合モードで、このステートメントを使用して指定したタブレットを診断します。結果には、タブレットに関する情報と、潜在的な問題が表示されます。

このコマンドは、ストレージ・コンピュート分離モードではサポートされません。

## 構文

```sql
SHOW TABLET DIAGNOSIS <tablet_id>;
```

## 必須パラメータ

<tablet_id>

> 診断するタブレットの ID

## 戻り値

タブレットに関する情報を返します。

- TabletExist

  > タブレットが存在するかどうか

- TabletId

    > タブレットの ID

- Database

  > タブレットが属するデータベースとその ID

- Table

  > タブレットが属するテーブルとその ID

- Partition

  > タブレットが属するパーティションとその ID

- MaterializedIndex

  > タブレットが属するマテリアライズドビューとその ID

- Replicas

  > タブレットのレプリカと、各レプリカに対応する BE

- ReplicasNum

  > レプリカ数が正しいかどうか

- ReplicaBackendStatus

  > レプリカが配置されている BE ノードが正常かどうか

- ReplicaVersionStatus

  > レプリカのバージョン番号が正常かどうか

- ReplicaStatus

  > レプリカの状態が正常かどうか

- ReplicaCompactionStatus

  > レプリカのコンパクション状態が正常かどうか

## 例

1. タブレット ID が 10078 のタブレットを診断します。

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

## アクセス制御要件

この SQL コマンドを実行するには、ADMIN_PRIV 権限が必要です。権限に関するドキュメントを参照してください。

| 権限       | 対象                           | 備考                          |
| :--------- | :----------------------------- | :---------------------------- |
| ADMIN_PRIV | クラスター全体の管理権限       | NODE_PRIV を除くすべての権限 |

## 使用上の注意

1. このコマンドは、ストレージ・コンピュート分離モードではサポートされません。このモードで実行すると、次のようなエラーが発生します。

  ```sql
  show tablet diagnosis 15177;
  ```

  エラーメッセージは次のとおりです。

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```
