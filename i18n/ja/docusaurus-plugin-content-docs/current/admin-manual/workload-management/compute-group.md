---
{
    "title": "コンピュートグループの管理：作成、権限付与、スケーリング",
    "sidebar_label": "コンピュートグループ",
    "language": "ja",
    "description": "ストレージ・コンピュート分離型の構成では、コンピュートグループによってワークロードを物理的に分離でき、グループの作成、権限付与、切り替え、弾力的なスケーリングが可能です。",
    "keywords": ["コンピュートグループ", "ストレージ・コンピュート分離", "コンピュートクラスター", "ワークロード分離", "弾力的なスケーリング", "ワークロード管理", "Compute Cluster", "BE 管理", "デフォルトコンピュートグループ"]
}
---

<!-- Knowledge type: concept + procedure -->
<!-- Applicable scenario: workload isolation and resource management in the storage-compute separation architecture -->

**コンピュートグループ（Compute Group）**は、ストレージ・コンピュート分離型の構成で異なるワークロードを物理的に分離する仕組みです。3.0.2 より前のバージョンでは「Compute Cluster」と呼ばれます。一つ以上の BE ノードで一つのコンピュートグループを構成し、複数のコンピュートグループが共有ストレージ層を介して同じデータにアクセスします。

![コンピュートグループの構成](/images/compute_group_workload_management.png)

**主な特徴**：

- BE ノードはローカルに状態を保持せず、データは共有ストレージに保存されます。
- 複数のコンピュートグループが、レプリカを追加せずに同じデータを共有します。
- コンピュートグループの追加や削除にデータ移行は不要で、クエリ実行時にキャッシュをウォームアップするだけです。

コンピュートグループには、リソースグループと比較して次の利点があります。

| 比較項目 | コンピュートグループ | リソースグループ |
|------|--------------|----------------|
| ストレージコスト | データは共有ストレージに保存されます。コンピュートグループの数はレプリカ数に制約されず、グループを増やしてもストレージコストは増えません。 | レプリカを追加すると、ストレージコストが線形に増加します。 |
| スケーリングの柔軟性 | 新しいコンピュートグループの追加にはキャッシュのウォームアップだけが必要で、データ移行は不要です。 | レプリカの追加には、大量のデータ移行が必要です。 |
| 分離の完全性 | 共有ストレージ層が複数のレプリカを保証します。一つのコンピュートグループ内で BE に障害が発生しても、データロードには影響しません。 | BE に障害が発生すると、データロードが失敗する場合があります。 |

:::caution 注意
3.0.2 より前のバージョンでは、コンピュートグループは「Compute Cluster」と呼ばれます。
:::

## コンピュートグループを表示する {#view-compute-groups}

<!-- Knowledge type: procedure -->

現在のウェアハウスに属するすべてのコンピュートグループを表示します。

```sql
SHOW COMPUTE GROUPS;
```

## コンピュートグループを追加する {#add-a-compute-group}

<!-- Knowledge type: procedure -->

[ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) コマンドを使用して BE ノードを追加し、所属するコンピュートグループを指定します。

**コンピュートグループを指定する場合**：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**コンピュートグループを指定しない場合**（デフォルトで `default_compute_group` に参加します）：

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## コンピュートグループへのアクセス権を管理する {#manage-compute-group-access-permissions}

<!-- Knowledge type: procedure -->

### アクセス権を付与する {#grant-access-permission}

指定したコンピュートグループの使用権限をユーザーに付与します。

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

### アクセス権を取り消す {#revoke-access-permission}

指定したコンピュートグループに対するユーザーの使用権限を取り消します。

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## デフォルトのコンピュートグループを設定する {#set-the-default-compute-group}

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: read/write errors when a user has not configured a default Compute Group -->

### デフォルトのコンピュートグループを設定・確認する {#set-and-view-the-default-compute-group}

| 操作 | コマンド | 必要な権限 |
|------|------|---------|
| 現在のユーザーのデフォルトコンピュートグループを設定する | `SET PROPERTY 'default_compute_group' = '{clusterName}';` | 追加の権限は不要 |
| 別のユーザーのデフォルトコンピュートグループを設定する | `SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';` | Admin 権限が必要 |
| 現在のユーザーのデフォルトコンピュートグループを確認する | `SHOW PROPERTY;` | 追加の権限は不要 |
| 別のユーザーのデフォルトコンピュートグループを確認する | `SHOW PROPERTY FOR {user};` | 対応する参照権限が必要 |

返された結果の `default_compute_group` フィールドの値が、現在のデフォルトコンピュートグループです。

### 権限について {#permission-description}

**管理者ユーザー**（例：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`）：

- 自分自身と他のユーザーのデフォルトコンピュートグループを設定できます。
- 自分自身と他のユーザーの `PROPERTY` を確認できます。

**一般ユーザー**（例：`CREATE USER jack1 IDENTIFIED BY '123456'`）：

- 自分自身のデフォルトコンピュートグループのみ設定できます。
- 自分自身の `PROPERTY` のみ確認できます。
- `SHOW COMPUTE GROUPS` は実行できません（この操作には `GRANT ADMIN` 権限が必要です）。

### よくある質問 {#faq}

#### Q：データの読み書きでエラーが発生する {#q-an-error-occurs-when-performing-data-reads-or-writes}
現在のユーザーにデフォルトのコンピュートグループが設定されていません。`use @cluster` を実行して現在のセッションで使用するコンピュートグループを指定するか、`SET PROPERTY` でデフォルト値を設定してください。

#### Q：デフォルトのコンピュートグループを設定しているのに、読み書きでエラーが発生する {#q-a-default-compute-group-has-been-set-but-reads-and-writes-still-report-errors}
以前指定したコンピュートグループが削除されています。`use @cluster` を実行して再度指定するか、`SET PROPERTY` でデフォルト設定を更新してください。

## デフォルトコンピュートグループの自動選択 {#automatic-selection-of-the-default-compute-group}

<!-- Knowledge type: concept -->

ユーザーがデフォルトのコンピュートグループを明示的に設定していない場合、システムは次の条件を満たすグループを自動的に選択します。

- Active 状態の BE ノードがあること。
- 現在のユーザーがそのグループの使用権限を持っていること。

同じセッション内では、デフォルトのコンピュートグループは変わりません。セッションをまたぐ場合、次の状況でシステムが自動的に再選択します。

| 再選択の条件 | 必ず変更されるか |
|----------|------------|
| 以前選択されたコンピュートグループに対するユーザーの使用権限が失われた場合 | 必ず変更される |
| コンピュートグループが追加または削除された場合 | 必ず変更される |
| 以前選択されたコンピュートグループに Active 状態の BE ノードがなくなった場合 | 変更される場合がある |

## コンピュートグループを切り替える {#switch-compute-groups}

<!-- Knowledge type: procedure -->

ストレージ・コンピュート分離型の構成では、一つの文でデータベースとコンピュートグループを指定できます。

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

データベース名またはコンピュートグループ名に予約語が含まれる場合は、その名前をバッククォート（`` ` ``）で囲んでください。

## コンピュートグループをスケーリングする {#compute-group-scaling}

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: elastic scaling, workload adjustment -->

BE ノードを追加または削除して、コンピュートグループを弾力的にスケーリングします。

- **スケールアウト**：`ALTER SYSTEM ADD BACKEND` で、指定したコンピュートグループに新しい BE を追加します。
- **スケールイン**：`ALTER SYSTEM DECOMMISSION BACKEND` で、コンピュートグループから BE を廃止します。

詳しい操作方法については、[ストレージ・コンピュート分離型の運用](../../install/choosing-deployment-mode)を参照してください。
