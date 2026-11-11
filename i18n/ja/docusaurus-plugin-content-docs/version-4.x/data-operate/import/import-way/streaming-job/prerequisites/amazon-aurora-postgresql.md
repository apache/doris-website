---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "ja",
    "description": "Doris のストリーミング取り込みの前提条件を満たすために、Amazon Aurora PostgreSQL で論理レプリケーションを有効にし、同期ユーザーを設定する方法。",
    "keywords": [
        "Amazon Aurora PostgreSQL",
        "Logical Replication",
        "rds.logical_replication",
        "Doris streaming ingestion",
        "Publication",
        "dbz_publication",
        "CDC prerequisites"
    ]
}
---

:::caution 試験的な機能

Doris の継続的なデータロードは試験的な機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris のストリーミング取り込みでは、**Amazon Aurora PostgreSQL-Compatible Edition 14 以降**からのデータ同期をサポートします。同期を開始する前に、Aurora クラスター側で論理レプリケーションを有効にし、必要な権限を付与する必要があります。このドキュメントは DBA とデータエンジニアを対象に、前提条件を満たすための設定手順をすべて説明します。

### 前提条件のチェックリスト {#prerequisite-checklist}

設定を始める前に、以下を確認してください。

| 確認項目 | 要件 |
| --- | --- |
| Aurora PostgreSQL のバージョン | 14 以降 |
| 操作権限 | AWS RDS コンソールでクラスターパラメータグループを変更する権限 |
| データベース権限 | ユーザーの作成、権限の付与、Publication の作成を行う権限 |
| メンテナンス時間帯 | Aurora のライターインスタンスを再起動できること（論理レプリケーションのパラメータを変更した後は再起動が必要） |

### 設定の流れ {#configuration-workflow}

設定は次の 5 つのステップで行います。

1. 現在の論理レプリケーションの設定状態を確認する
2. クラスターパラメータグループを設定する
3. クラスターパラメータグループを適用し、インスタンスを再起動する
4. Doris の同期ユーザーを作成し、権限を付与する
5. Publication を作成する

ステップ 1 で論理レプリケーションがすでに有効であることを確認できた場合は、**ステップ 4** に進んで同期ユーザーを作成できます。

## ステップ 1：現在の設定を確認する {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**目的：** Aurora クラスターで論理レプリケーションが有効かどうかを確認し、パラメータグループの変更が必要か判断します。

Aurora のライターインスタンスに接続し、次の SQL を実行します。

```sql
SHOW rds.logical_replication;
```

返された値に応じて、次の操作を選択してください。

| 戻り値 | 意味 | 次の操作 |
| --- | --- | --- |
| `on` | 論理レプリケーションが有効 | [ステップ 4：同期ユーザーを作成する](#step-4-create-the-sync-user)に進む |
| `off` | 論理レプリケーションが無効 | [ステップ 2：クラスターパラメータグループを設定する](#step-2-configure-the-cluster-parameter-group)に進む |

## ステップ 2：クラスターパラメータグループを設定する {#step-2-configure-the-cluster-parameter-group}

<!-- Knowledge type: Configuration parameters -->

**目的：** 論理レプリケーションを有効にした DB Cluster Parameter Group を作成し、Aurora クラスターで使用できるようにします。

手順：

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/)にサインインします。
2. 左側のナビゲーションペインで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3. タイプを **DB Cluster Parameter Group** に設定し、該当する Aurora PostgreSQL のバージョンファミリーを選択します。
4. 作成したクラスターパラメータグループを編集します。`rds.logical_replication` を検索し、値を `1` に設定します。

    ![PostgreSQL WAL の設定](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **Save Changes** をクリックして保存します。

主なパラメータ：

| パラメータ | 推奨値 | 説明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 論理レプリケーションを有効にする。`0` は無効を意味する |

## ステップ 3：クラスターパラメータグループを適用して再起動する {#step-3-apply-the-cluster-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**目的：** 新しく作成したパラメータグループを対象の Aurora クラスターに関連付け、ライターインスタンスを再起動して設定を反映します。

手順：

1. RDS コンソールで対象の Aurora クラスターを選択し、**Modify** をクリックします。
2. **DB cluster parameter group** で、ステップ 2 で作成したクラスターパラメータグループを選択します。
3. **Apply immediately** を選択します。
4. 設定を反映するために、Aurora のライターインスタンスを再起動します。

:::caution
`rds.logical_replication` パラメータの変更を反映するには、Aurora のライターインスタンスを再起動する必要があります。この操作は業務負荷の低い時間帯に行ってください。
:::

## ステップ 4：同期ユーザーを作成する {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure -->

**目的：** Doris のストリーミング取り込み専用のアカウントを作成し、データの読み取りとレプリケーションに必要な最小限の権限を付与します。

1. 専用ユーザーを作成します。

    ```sql
    CREATE USER doris_sync PASSWORD '<password>';
    ```

2. スキーマとテーブルの読み取り権限を付与します（以下は `public` スキーマの例です。必要に応じて置き換えてください）。

    ```sql
    GRANT USAGE ON SCHEMA "public" TO doris_sync;
    GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
    ```

3. レプリケーション権限を付与します。

    ```sql
    GRANT rds_replication TO doris_sync;
    ```

権限の説明：

| 権限 | 用途 |
| --- | --- |
| `USAGE ON SCHEMA` | 指定したスキーマへのアクセスを許可する |
| `SELECT ON ALL TABLES` | スキーマ内の既存のすべてのテーブルからデータを読み取れるようにする |
| `ALTER DEFAULT PRIVILEGES ... GRANT SELECT` | このスキーマに後から作成されるテーブルへの読み取り権限を自動的に付与する |
| `rds_replication` | Aurora PostgreSQL で論理レプリケーションを実行するために必要なロール |

## ステップ 5：Publication を作成する {#step-5-create-the-publication}

<!-- Knowledge type: Procedure -->

**目的：** Doris がサブスクライブする Publication を作成します。

次の SQL を実行します。

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

:::caution
現在、Doris がサポートするのは `dbz_publication` という名前で、`FOR ALL TABLES` を指定した Publication のみです。Publication に別の名前を付けたり、一部のテーブルだけを指定したりすることは、まだサポートされていません。
:::

> **注：** 同期ユーザーにスーパーユーザー権限（`rds_superuser` ロールなど）がある場合、Doris が Publication を自動的に作成するため、このステップを手動で実行する必要はありません。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1：`SHOW rds.logical_replication;` が `on` を返します。ほかに何が必要ですか？**

クラスターパラメータグループの変更も、インスタンスの再起動も必要ありません。[ステップ 4：同期ユーザーを作成する](#step-4-create-the-sync-user)から始めてください。

**Q2：Aurora PostgreSQL 13 以前のバージョンはサポートされますか？**

いいえ。Doris のストリーミング取り込みには Aurora PostgreSQL 14 以降が必要です。

**Q3：独自の名前を付けた Publication を使用できますか？**

いいえ。現在、Doris がサポートするのは `dbz_publication` という名前で、`FOR ALL TABLES` を指定した Publication のみです。

**Q4：同期にはスーパーユーザーアカウントが必要ですか？**

いいえ。通常のユーザー `doris_sync` を使用し、このドキュメントに従って権限を付与することを推奨します。Doris が Publication を自動的に作成するのは、アカウントにスーパーユーザー権限（`rds_superuser` など）がある場合だけです。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Pre-sync prerequisite check failure -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` が引き続き `off` を返す | 新しいパラメータグループがクラスターに関連付けられていないか、ライターインスタンスが再起動されていない | **DB cluster parameter group** が新しいパラメータグループに切り替わっていることを確認し、ライターインスタンスを再起動する |
| ユーザーの作成または権限の付与に失敗する | 現在ログインしているアカウントの権限が不足している | `rds_superuser` または同等の権限を持つアカウントでサインインし、操作を実行する |
| `GRANT rds_replication` でエラーが返る | 現在の Aurora のバージョンが古すぎるか、クラスターが Aurora PostgreSQL ではない | Aurora PostgreSQL 14 以降にアップグレードする |
| Publication の作成時に権限エラーが発生する | `doris_sync` ユーザーに Publication を作成する権限がない | スーパーユーザーアカウントで `CREATE PUBLICATION` を手動で実行するか、同期アカウントに必要な権限を一時的に付与する |
| 同期の開始時に Doris が `dbz_publication` が見つからないと報告する | Publication が作成されておらず、同期アカウントにはスーパーユーザー権限がないため自動作成もできない | ステップ 5 の `CREATE PUBLICATION dbz_publication FOR ALL TABLES;` を手動で実行する |
