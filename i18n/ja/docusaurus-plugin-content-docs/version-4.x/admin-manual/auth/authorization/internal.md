---
{
    "title": "組み込み認可",
    "language": "ja",
    "description": "RBAC モデルに基づき、権限、ロール、ユーザーの三層構造によって Doris のリソースへのアクセスをきめ細かく制御します。"
}
---

<!-- Knowledge type: Concept explanation + Architecture decision -->
<!-- Applicable scenarios: Privilege planning / Access control design / Multi-business isolation -->

Doris の組み込み認可は、**RBAC（ロールベースのアクセス制御）**モデルに基づいています。「権限からロール、ロールからユーザーへ」という三層構造により、ユーザーの ID に応じて、ノード、Catalog、データベース、テーブル、カラム、Resource、Workload Group などのリソースへのアクセスと操作を制限します。

このドキュメントでは、Doris の組み込み認可の基本概念、動作の仕組み、関連する SQL コマンド、代表的な権限設計のシナリオを説明します。

## 適用シナリオ

| シナリオ | 推奨する方法 |
|---------|-------------|
| クラスター運用（管理者） | `Admin_priv` または `Node_priv` を付与し、組み込みの `operator` / `admin` ロールを使用する |
| データ開発（データベースやテーブルの作成、データのロード） | 指定したデータベースやテーブルに `CREATE`、`DROP`、`ALTER`、`LOAD`、`SELECT` 権限を付与する |
| データ照会（読み取り専用アクセス） | 指定したデータベース、テーブル、カラムに `Select_priv` を付与する |
| 複数業務によるマルチテナントの共有クラスター | 業務ごとのデータベースに対するデータベースレベルの `Grant_priv` を持つ「業務管理者」ユーザーを作成し、そのユーザーに各業務のユーザーを管理させる |
| Resource / ワークロードの分離 | `Usage_priv` によって Resource と Workload Group の使用を制御する |
| 機密フィールドの保護（電話番号や ID 番号など） | カラムレベルの `Select_priv` を使用するか、[データアクセス制御](../authorization/data)と組み合わせて行レベルのポリシーを設定する |

## 基本概念

Doris の認可は、次の三つの主要な要素で構成されます。

- **権限（Privilege）**：特定のリソースオブジェクトに対する操作の許可です（読み取り、書き込み、変更など）。
- **ロール（Role）**：ユーザーに付与できる権限の集合です。
- **ユーザー（User）**：操作を実行する主体で、`user_name` と `host` によって一意に識別されます。

### 権限

権限の対象には、ノード、Catalog、データベース、テーブル、カラム、Resource、Workload Group があります。権限の種類によって、許可される操作が異なります。

#### すべての権限項目

<!-- Knowledge type: Configuration parameter -->

| 権限 | オブジェクトの種類 | 説明 |
|------|-------------------|------|
| Admin_priv | Global | スーパー管理者権限。 |
| Node_priv | Global | ノードの変更権限。FE、BE、BROKER ノードの追加、削除、廃止などの操作を含みます。 |
| Grant_priv | Global、Catalog、Db、Table、Resource、Workload Group | 権限の変更権限。権限の付与と取り消し、ユーザーやロールの追加、削除、変更などの操作を許可します。<br />ほかのユーザーやロールに権限を付与する場合、バージョン 2.1.2 より前は、現在のユーザーが該当するレベルの `Grant_priv` を持っていれば十分です。バージョン 2.1.2 以降は、付与対象のリソースに対する、その権限も持っている必要があります。<br />ほかのユーザーにロールを割り当てる場合、現在のユーザーは Global レベルの `Grant_priv` を持っている必要があります。 |
| Select_priv | Global、Catalog、Db、Table、Column | Catalog、データベース、テーブル、カラムに対する読み取り専用権限。 |
| Load_priv | Global、Catalog、Db、Table | Catalog、データベース、テーブルに対する書き込み権限。Load、Insert、Delete などを含みます。 |
| Alter_priv | Global、Catalog、Db、Table | Catalog、データベース、テーブルに対する変更権限。データベースやテーブルの名前変更、カラムの追加・削除・変更、パーティションの追加・削除を含みます。 |
| Create_priv | Global、Catalog、Db、Table | Catalog、データベース、テーブル、ビューを作成する権限。 |
| Drop_priv | Global、Catalog、Db、Table | Catalog、データベース、テーブル、ビューを削除する権限。 |
| Usage_priv | Resource、Workload Group | Resource と Workload Group を使用する権限。 |
| Show_view_priv | Global、Catalog、Db、Table | `SHOW CREATE VIEW` を実行する権限。 |

#### 権限レベル

同じ権限を異なるレベルで付与できます。`GRANT` 文で指定するリソースパスによって、権限の適用範囲が決まります。

| レベル | 付与パスの例 | 適用範囲 |
|--------|--------------|----------|
| Global | `GRANT ... ON *.*.* TO user1` | すべての Catalog 内のすべてのデータベースまたはテーブル |
| Catalog | `GRANT ... ON ctl.*.* TO user1` | 指定した Catalog 内のすべてのデータベースまたはテーブル |
| Database | `GRANT ... ON ctl.db.* TO user1` | 指定したデータベース内のすべてのテーブル |
| Table | `GRANT ... ON ctl.db.tbl TO user1` | 指定したテーブル内のすべてのカラム |
| Column | `GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1` | 指定したテーブルの指定したカラム。現在、カラム権限でサポートされるのは `Select_priv` のみです。 |
| Row | ポリシーに基づいて定義します。[データアクセス制御](../authorization/data)を参照 | ユーザーがアクセスできるデータ行を制御します。 |
| Resource | `GRANT USAGE_PRIV ON RESOURCE '%' TO user1` | Resource の使用。`Usage_priv` と `Grant_priv` のみをサポートします。 |
| Workload Group | `GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1` | Workload Group の使用。`Usage_priv` と `Grant_priv` のみをサポートします。 |

:::tip
`Admin_priv` の付与と取り消しは、Global レベルでのみ行えます。
:::

### ロール

ロールは権限の集合です。ユーザーにロールを割り当てると、そのロールのすべての権限を自動的に継承します。その後、ロールの権限を変更した場合も、そのロールを持つすべてのユーザーに変更が反映されます。

#### 組み込みロール

Doris はデフォルトで次の二つの組み込みロールを作成します。

| 組み込みロール | デフォルトの権限 | 主な用途 |
|----------------|------------------|----------|
| operator | `Admin_priv` + `Node_priv` | クラスター運用、ノードの変更 |
| admin | `Admin_priv` | 業務管理、データ管理 |

#### カスタムロール

`CREATE ROLE` で名前付きロールを作成し、よく使う権限をまとめて複数のユーザーに付与できます。これにより、権限の一元管理と取り消しが容易になります。

### ユーザー

Doris では、`user_identity` によってユーザーを一意に識別します。`user_identity` は次の二つの部分で構成されます。

- `user_name`：ユーザー名。
- `host`：ユーザークライアントの接続元ホストアドレス。

## 認可の仕組み

<!-- Knowledge type: Architecture principle -->

Doris の権限システムは RBAC モデルに基づいています。ユーザーはロールに、ロールは権限に関連付けられます。**ユーザーはロールを通じて間接的に権限を持ちます。**

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

上の図が示すとおり、次の関係があります。

- `user1` と `user2` が持つ `priv1` 権限は、どちらも `role1` を通じて付与されます。
- `userN` が持つ `priv1` 権限は `role3` に由来し、`priv2` と `privN` の権限は `roleN` に由来します。したがって、`userN` は `priv1`、`priv2`、`privN` の権限を同時に持ちます。

### 権限の継承と取り消しのルール

- ロールを削除すると、そのロールを持つユーザーは、ロールのすべての権限を**自動的に失います**。
- ユーザーからロールの割り当てを解除すると、そのユーザーはロールのすべての権限を**自動的に失います**。
- ロールの権限を追加または削除すると、そのロールを持つすべてのユーザーの権限が**同時に変わります**。

### 注意事項

- Doris では、利便性のためにユーザーへの権限の直接付与をサポートしています。内部実装では、ユーザーごとに専用の**デフォルトロール**が作成されます。ユーザーに直接権限を付与すると、実際にはそのデフォルトロールに権限が付与されます。
- デフォルトロールは削除できず、ほかのユーザーに割り当てることもできません。ユーザーを削除すると、そのデフォルトロールも自動的に削除されます。

## 関連する SQL コマンド

<!-- Knowledge type: Command reference -->

| 操作の種類 | コマンド |
|------------|----------|
| 権限の付与 / ロールの割り当て | [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) |
| 権限の取り消し / ロールの割り当て解除 | [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM) |
| ロールの作成 | [CREATE ROLE](../../../sql-manual/sql-statements/account-management/CREATE-ROLE) |
| ロールの削除 | [DROP ROLE](../../../sql-manual/sql-statements/account-management/DROP-ROLE) |
| ロールの変更 | [ALTER ROLE](../../../sql-manual/sql-statements/account-management/ALTER-ROLE) |
| 現在のユーザーの権限を表示 | [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| すべてのユーザーの権限を表示 | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| 作成済みロールを表示 | [SHOW ROLES](../../../sql-manual/sql-statements/account-management/SHOW-ROLES) |
| サポートされるすべての権限項目を表示 | [SHOW PRIVILEGES](../../../sql-manual/sql-statements/account-management/SHOW-PRIVILEGES) |

## ベストプラクティス

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Privilege planning / Multi-business isolation -->

以下に、Doris の権限システムを使用する代表的な二つのシナリオを示します。

### シナリオ 1：単一業務のクラスターでロールに基づいて職務を分ける

Doris クラスターのユーザーを、管理者（Admin）、開発エンジニア（RD）、クライアント（Client）に分けます。

- **管理者**：クラスター全体のすべての権限を持ち、クラスターのセットアップやノード管理などを担当します。
- **開発エンジニア（RD）**：データベースやテーブルの作成、データのロードと変更など、業務のモデリングを担当します。
- **クライアント**：各種データベースやテーブルにアクセスし、データを取得します。

推奨する権限付与の計画は次のとおりです。

- 管理者：`Admin_priv` または Global レベルの `Grant_priv` を付与します。
- RD：任意または指定したデータベースやテーブルに `Create_priv`、`Drop_priv`、`Alter_priv`、`Load_priv`、`Select_priv` を付与します。
- クライアント：任意または指定したデータベースやテーブルに `Select_priv` を付与します。

複数のユーザーにまとめて権限を付与するには、異なるロールを作成すると管理が容易になります。

### シナリオ 2：複数業務のクラスターで管理を委任する

単一のクラスターで複数の業務を運用します。各業務は一つ以上のデータベースを使用し、それぞれのユーザーを管理する必要があります。

推奨する権限付与の計画：管理者は業務ごとのデータベースに対して「業務管理者」ユーザーを作成し、対応するデータベースに対するデータベースレベルの `Grant_priv` をそのユーザーに付与します。このユーザーは、権限を与えられたデータベースの範囲内でのみ、ほかのユーザーに権限を付与できます。これにより、業務間で権限を分離し、それぞれが自分のユーザーを管理できます。
