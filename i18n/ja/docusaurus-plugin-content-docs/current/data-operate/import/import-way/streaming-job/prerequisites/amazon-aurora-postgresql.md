---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "ja",
    "description": "Amazon Aurora PostgreSQL で論理レプリケーションを有効にし、Doris のストリーミング取り込みの前提条件を満たす同期ユーザーを設定する方法。",
    "keywords": [
        "Amazon Aurora PostgreSQL",
        "Logical Replication",
        "rds.logical_replication",
        "Doris streaming ingestion",
        "Publication",
        "dbz_publication",
        "publication_name",
        "CDC prerequisites"
    ]
}
---

:::caution 実験的機能

Doris の継続ロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris のストリーミング取り込みは **Amazon Aurora PostgreSQL-Compatible Edition 14 以降** からのデータ同期をサポートします。同期する前に、Aurora クラスター側で Logical Replication を有効にし、関連する認可を完了する必要があります。本書は DBA とデータエンジニアを対象とし、前提条件の設定手順をすべて説明します。

### 前提条件チェックリスト {#prerequisite-checklist}

設定を開始する前に、次の情報を確認してください：

| チェック項目 | 要件 |
| --- | --- |
| Aurora PostgreSQL のバージョン | 14 以降 |
| 操作権限 | AWS RDS コンソールでクラスター・パラメータグループを変更する権限 |
| データベース権限 | ユーザーの作成、権限付与、Publication の作成を行う権限 |
| メンテナンスウィンドウ | Aurora writer インスタンスの再起動を許容できること（論理レプリケーション・パラメータの変更後に再起動が必要） |

### 設定ワークフロー {#configuration-workflow}

設定全体は 5 つのステップで構成されます：

1. 現在の論理レプリケーション設定の状態を確認する
2. クラスター・パラメータグループを設定する
3. クラスター・パラメータグループを適用してインスタンスを再起動する
4. Doris 同期ユーザーを作成して権限を付与する
5. Doris のバージョンに基づいて Publication を設定する

ステップ 1 で論理レプリケーションがすでに有効になっていることが確認できた場合は、**ステップ 4** に進んで同期ユーザーを作成できます。

## ステップ 1: 現在の設定を確認 {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**目的：** Aurora クラスターで論理レプリケーションが有効になっているか確認し、パラメータグループを変更する必要があるか判断します。

Aurora writer インスタンスに接続し、次の SQL を実行します：

```sql
SHOW rds.logical_replication;
```

返された値に基づいて、次の操作を選択します：

| 返された値 | 意味 | 次の操作 |
| --- | --- | --- |
| `on` | 論理レプリケーションは有効 | [ステップ 4: 同期ユーザーの作成](#step-4-create-the-sync-user) に進む |
| `off` | 論理レプリケーションは無効 | [ステップ 2: クラスター・パラメータグループを設定](#step-2-configure-the-cluster-parameter-group) に進む |

## ステップ 2: クラスター・パラメータグループを設定 {#step-2-configure-the-cluster-parameter-group}

<!-- Knowledge type: Configuration parameters -->

**目的：** 論理レプリケーションを有効にした DB Cluster Parameter Group を作成し、Aurora クラスターで使用できるようにします。

手順：

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/) にサインインします。
2. 左側のナビゲーションペインで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3. タイプに **DB Cluster Parameter Group** を設定し、対応する Aurora PostgreSQL のバージョンファミリーを選択します。
4. 作成したクラスター・パラメータグループを編集し、`rds.logical_replication` を検索して値を `1` に設定します：

    ![PostgreSQL WAL 設定](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **Save Changes** をクリックして保存します。

主要パラメータの説明：

| パラメータ | 推奨値 | 説明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 論理レプリケーションを有効化。`0` は無効を示します |

## ステップ 3: クラスター・パラメータグループを適用して再起動 {#step-3-apply-the-cluster-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**目的：** 新しく作成したパラメータグループを対象 Aurora クラスターに関連付け、writer インスタンスを再起動して設定を有効にします。

手順：

1. RDS コンソールで対象 Aurora クラスターを選択し、**Modify** をクリックします。
2. **DB cluster parameter group** で、ステップ 2 で作成したクラスター・パラメータグループを選択します。
3. **Apply immediately** を選択します。
4. Aurora writer インスタンスを再起動して設定を有効にします。

:::caution
`rds.logical_replication` パラメータの変更を有効にするには Aurora writer インスタンスの再起動が必要です。この操作は業務のオフピーク時間帯に実施してください。
:::

## ステップ 4: 同期ユーザーを作成 {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure -->

**目的：** Doris のストリーミング取り込み専用アカウントを作成し、データの読み取りとレプリケーションの実行に必要な最小権限を付与します。

1. 専用ユーザーを作成します：

    ```sql
    CREATE USER doris_sync PASSWORD '<password>';
    ```

2. スキーマとテーブルに読み取り権限を付与します（例として `public` スキーマを使用しています。必要に応じて置き換えてください）：

    ```sql
    GRANT USAGE ON SCHEMA "public" TO doris_sync;
    GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
    ```

3. レプリケーション権限を付与します：

    ```sql
    GRANT rds_replication TO doris_sync;
    ```

権限の説明：

| 権限 | 目的 |
| --- | --- |
| `USAGE ON SCHEMA` | 指定したスキーマへのアクセスを許可します |
| `SELECT ON ALL TABLES` | スキーマ内の既存のすべてのテーブルからのデータ読み取りを許可します |
| `ALTER DEFAULT PRIVILEGES ... GRANT SELECT` | このスキーマで後から作成されるテーブルに読み取り権限を自動的に付与します |
| `rds_replication` | Aurora PostgreSQL で論理レプリケーションを実行するために必要なロールです |

## ステップ 5: Publication を設定 {#step-5-configure-the-publication}

<!-- Knowledge type: Procedure -->

デフォルトでは、Publication を手動で作成する必要はありません。`publication_name` が設定されていない場合、Doris は同期アカウントを使用して `doris_pub_<job_id>` という名前の Publication を作成し、ジョブが削除されるとクリーンアップします。そのため、同期アカウントには Publication を作成する権限が必要です。

Streaming Job の作成時に `publication_name` を明示的に設定する場合は、同じ名前の Publication を事前に作成してください。カスタム Publication には、ジョブで同期するすべてのソーステーブルを含める必要があり、その維持とクリーンアップはユーザーが行います。例：

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

ジョブの作成時に `"publication_name" = "doris_pub_custom"` を設定します。名前には小文字、数字、アンダースコアのみを使用でき、数字で始めることはできず、63 文字以内です。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;` は `on` を返します。ほかに何をする必要がありますか？**

クラスター・パラメータグループを変更したり、インスタンスを再起動したりする必要はありません。[ステップ 4: 同期ユーザーの作成](#step-4-create-the-sync-user) から直接開始してください。

**Q2: Aurora PostgreSQL 13 以前のバージョンはサポートされていますか？**

いいえ。Doris のストリーミング取り込みには Aurora PostgreSQL 14 以降が必要です。

**Q3: カスタム名の Publication を使用できますか？**

`publication_name` でカスタム名を指定できますが、ジョブを作成する前に Publication を作成し、すべての同期対象テーブルが含まれていることを確認する必要があります。

**Q4: 同期に superuser アカウントを使用する必要がありますか？**

いいえ。`publication_name` を省略すると、Doris がデフォルト Publication を自動的に作成して管理します。カスタム Publication を使用する場合にのみ、事前作成が必要です。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Pre-sync prerequisite check failure -->

| 症状 | 考えられる原因 | 解決策 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` が引き続き `off` を返す | 新しいパラメータグループがクラスターに関連付けられていないか、writer インスタンスが再起動されていない | **DB cluster parameter group** が新しいパラメータグループに切り替わっていることを確認し、writer インスタンスを再起動します |
| ユーザーの作成または権限付与に失敗する | 現在のログインアカウントの権限が不足している | `rds_superuser` または同等の権限を持つアカウントでサインインして操作します |
| `GRANT rds_replication` がエラーを返す | 現在の Aurora バージョンが低すぎるか、クラスターが Aurora PostgreSQL ではない | Aurora PostgreSQL 14 以降にアップグレードします |
| デフォルト Publication を作成できない | 同期アカウントに Publication の作成権限がない | 同期アカウントに必要な権限を付与するか、管理者にカスタム Publication を事前作成してもらい、`publication_name` を設定します |
| カスタム Publication が存在しない | `publication_name` が設定されているが、同じ名前の Publication が作成されていない | [ステップ 5](#step-5-configure-the-publication) に従って Publication を作成するか、`publication_name` の設定を削除します |
