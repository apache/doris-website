---
{
  "title": "組み込みAuthorization",
  "language": "ja",
  "description": "認可とは、ユーザーIDがDorisリソースへのアクセスと操作において制限される仕組みを指します。"
}
---
## 主要概念

認可とは、Dorisリソースへのアクセスと操作においてユーザーアイデンティティを制限するメカニズムを指します。

Dorisは権限管理にRole-Based Access Control (RBAC)モデルを使用しています。

### 権限

権限はノード、カタログ、データベース、またはテーブルに適用されます。異なる権限は異なる操作の許可を表します。

#### 全権限

| 権限       | オブジェクトタイプ | 説明                                                                                                                                                                  |
|----------------| --------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv     | Global      | スーパー管理者権限。                                                                                                                                                               |
| Node_priv      | Global      | ノード変更権限。FE、BE、BROKERノードの追加、削除、廃止を含みます。                                                                                                                              |
| Grant_priv     | Global, カタログ, Db, table, Resource, Workload Group | 権限変更権限。ユーザー/ロールの付与、取り消し、追加/削除/変更などの操作を許可します。 <br>他のユーザー/ロールに権限を付与する際、バージョン2.1.2以前では、現在のユーザーは対応するレベルのGrant_priv権限のみが必要でした。バージョン2.1.2以降では、現在のユーザーは付与したいリソースの権限も必要です。 <br>他のユーザーにロールを割り当てるには、GlobalレベルのGrant_priv権限が必要です。 |
| Select_priv    | Global, カタログ, Db, table, Column | Select権限。データのクエリを許可します。                                                                                                                                                 |
| Load_priv      | Global, カタログ, Db, table | Load権限。Load、Insert、Deleteなどを含みます。                                                                                                                            |
| Alter_priv     | Global, カタログ, Db, table | Alter権限。データベース/テーブルの名前変更、列の追加/削除/変更、パーティションの追加/削除などを含みます。                                                                                                                  |
| Create_priv    | Global, カタログ, Db, table | Create権限。カタログ、データベース、テーブル、ビューの作成を許可します。                                                                                                                                                 |
| Drop_priv      | Global, カタログ, Db, table | Drop権限。カタログ、データベース、テーブル、ビューの削除を許可します。                                                                                                                                                 |
| Usage_priv     | Resource, Workload Group | ResourcesとWorkload Groupsの使用権限。                                                                                                                                    |
| Show_view_priv | Global, カタログ, Db, table | SHOW CREATE VIEW実行権限。                                                                                                                                            |

### ロール

Dorisはカスタム名のロールの作成を許可します。ロールは権限の集合として見ることができます。新しいユーザーにロールを割り当てると、そのロールの権限が自動的に付与されます。その後のロールの権限変更も、そのロールに属するすべてのユーザーの権限に影響します。

#### 組み込みロール

組み込みロールはDorisによって作成されるデフォルトのロールで、operatorとadminを含むデフォルト権限を持ちます。

- operator: Admin_privとNode_privを持ちます
- admin: Admin_privを持ちます

### ユーザー

Dorisでは、`user_identity`がユーザーを一意に識別します。`user_identity`は`user_name`と`host`の2つの部分から構成され、`username`はユーザー名です。`host`はユーザーが接続するホストアドレスを識別します。

## 認可メカニズム

DorisのPermission設計はRBAC (Role-Based Access Control)モデルに基づいており、ユーザーとロール、ロールと権限を関連付け、ユーザーはロールを通じて間接的に権限と関連付けられます。

ロールが削除されると、ユーザーは自動的にそのロールのすべての権限を失います。

ユーザーとロールの関連付けが解除されると、ユーザーは自動的にそのロールのすべての権限を失います。

ロールの権限が追加または削除されると、ユーザーの権限も変更されます。

```
┌────────┐        ┌────────┐         ┌────────┐
│  user1 ├────┬───►  role1 ├────┬────►  priv1 │
└────────┘    │   └────────┘    │    └────────┘
              │                 │
              │                 │
              │   ┌────────┐    │
              │   │  role2 ├────┤
┌────────┐    │   └────────┘    │    ┌────────┐
│  user2 ├────┘                 │  ┌─►  priv2 │
└────────┘                      │  │ └────────┘
                  ┌────────┐    │  │
           ┌──────►  role3 ├────┘  │
           │      └────────┘       │
           │                       │
           │                       │
┌────────┐ │      ┌────────┐       │ ┌────────┐
│  userN ├─┴──────►  roleN ├───────┴─►  privN │
└────────┘        └────────┘         └────────┘
```
上記のように:

user1とuser2の両方がrole1を通じてpriv1権限を持っています。

userNはrole3を通じてpriv1権限を持ち、roleNを通じてpriv2とprivN権限を持っているため、userNはpriv1、priv2、privN権限を持っています。

### 注意事項

- 便宜上、ユーザーに直接権限を付与することができます。内部的には、各ユーザーに対してデフォルトロールが作成され、ユーザーへの権限付与はデフォルトロールへの権限付与と同等です。
- デフォルトロールは削除できず、他のユーザーに割り当てることもできず、ユーザーが削除されると自動的に削除されます。

## 関連コマンド

- ロール付与/割り当て: [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- ロール取り消し/剥奪: [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
- ロール作成: [CREATE ROLE](../../../sql-manual/sql-statements/account-management/CREATE-ROLE)
- ロール削除: [DROP ROLE](../../../sql-manual/sql-statements/account-management/DROP-ROLE)
- ロール変更: [ALTER ROLE](../../../sql-manual/sql-statements/account-management/ALTER-ROLE)
- 現在のユーザー権限とロールを表示: [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- 全ユーザーの権限とロールを表示: [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- 作成されたロールを表示: [SHOW ROLES](../../../sql-manual/sql-statements/account-management/SHOW-ROLES)
- サポートされている権限を表示: [SHOW PRIVILEGES](../../../sql-manual/sql-statements/account-management/SHOW-PRIVILEGES)

## ベストプラクティス

Dorisの権限システムを使用する例をいくつか示します。

1. シナリオ1

   Dorisクラスターのユーザーは管理者（Admin）、開発エンジニア（RD）、ユーザー（Client）に分かれています。管理者はクラスター全体に対するすべての権限を持ち、主にクラスターのセットアップやノード管理などを担当します。開発エンジニアはビジネスモデリングを担当し、データベースやテーブルの作成、データのインポートや変更などを行います。ユーザーは異なるデータベースやテーブルにアクセスしてデータを取得します。

   このシナリオでは、管理者にはADMINまたはGRANT権限を付与できます。RDには任意の、または指定されたデータベースとテーブルに対するCREATE、DROP、ALTER、LOAD、SELECT権限を付与できます。Clientには任意の、または指定されたデータベースとテーブルに対するSELECT権限を付与できます。同時に、異なるロールを作成して複数ユーザーの権限管理を簡素化できます。

2. シナリオ2

   1つのクラスターに複数のビジネスがあり、各ビジネスは1つまたは複数のデータセットを使用する場合があります。各ビジネスは独自のユーザーを管理する必要があります。このシナリオでは、管理者は各データベースに対してDATABASEレベルのGRANT権限を持つユーザーを作成できます。このユーザーは指定されたデータベースに対してのみ権限を付与できます。
