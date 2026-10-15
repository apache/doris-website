---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "ja",
    "description": "Doris のストリーミング取り込みの前提条件を満たすために、Amazon Aurora PostgreSQL で論理レプリケーションを有効にし、同期ユーザーを設定する方法を説明します。",
    "keywords": [
        "Amazon Aurora PostgreSQL",
        "論理レプリケーション",
        "rds.logical_replication",
        "Doris ストリーミング取り込み",
        "パブリケーション",
        "dbz_publication",
        "publication_name",
        "CDC の前提条件"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris のストリーミング取り込みでは、**Amazon Aurora PostgreSQL 互換エディション 14 以降**からのデータ同期をサポートしています。同期を開始する前に、Aurora クラスター側で論理レプリケーションを有効にし、必要な権限を付与する必要があります。このドキュメントは DBA とデータエンジニアを対象に、前提となる設定手順を説明します。

### 前提条件のチェックリスト {#prerequisite-checklist}

設定を始める前に、以下を確認してください。

| 確認項目 | 要件 |
| --- | --- |
| Aurora PostgreSQL のバージョン | 14 以降 |
| 操作権限 | AWS RDS コンソールでクラスターパラメータグループを変更できる権限 |
| データベース権限 | ユーザーの作成、権限の付与、パブリケーションの作成ができる権限 |
| メンテナンス時間帯 | Aurora のライターインスタンスを再起動できること（論理レプリケーションのパラメータ変更後に再起動が必要） |

### 設定の流れ {#configuration-workflow}

設定は次の 5 ステップで行います。

1. 現在の論理レプリケーション設定を確認する
2. クラスターパラメータグループを設定する
3. クラスターパラメータグループを適用し、インスタンスを再起動する
4. Doris の同期ユーザーを作成し、権限を付与する
5. Doris のバージョンに応じてパブリケーションを設定する

ステップ 1 で論理レプリケーションがすでに有効であることを確認できた場合は、**ステップ 4** に進んで同期ユーザーを作成できます。

## ステップ 1：現在の設定を確認する {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**目的：** Aurora クラスターで論理レプリケーションが有効かを確認し、パラメータグループの変更が必要か判断します。

Aurora のライターインスタンスに接続し、次の SQL を実行します。

```sql
SHOW rds.logical_replication;
```

返された値に応じて、次の操作を選択します。

| 返された値 | 意味 | 次の操作 |
| --- | --- | --- |
| `on` | 論理レプリケーションは有効 | [ステップ 4：同期ユーザーを作成する](#step-4-create-the-sync-user)に進む |
| `off` | 論理レプリケーションは無効 | [ステップ 2：クラスターパラメータグループを設定する](#step-2-configure-the-cluster-parameter-group)に進む |

## ステップ 2：クラスターパラメータグループを設定する {#step-2-configure-the-cluster-parameter-group}

<!-- Knowledge type: Configuration parameters -->

**目的：** 論理レプリケーションを有効にした DB クラスターパラメータグループを作成し、Aurora クラスターで使用します。

手順：

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/)にサインインします。
2. 左側のナビゲーションで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3. タイプに **DB Cluster Parameter Group** を指定し、対応する Aurora PostgreSQL のバージョンファミリーを選択します。
4. 作成したクラスターパラメータグループを編集し、`rds.logical_replication` を検索して、値を `1` に設定します。

    ![PostgreSQL の WAL 設定](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **Save Changes** をクリックして保存します。

主要パラメータの説明：

| パラメータ | 推奨値 | 説明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 論理レプリケーションを有効にする。`0` は無効を意味する |

## ステップ 3：クラスターパラメータグループを適用して再起動する {#step-3-apply-the-cluster-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**目的：** 作成したパラメータグループを対象の Aurora クラスターに関連付け、ライターインスタンスを再起動して設定を反映します。

手順：

1. RDS コンソールで対象の Aurora クラスターを選択し、**Modify** をクリックします。
2. **DB cluster parameter group** で、ステップ 2 で作成したクラスターパラメータグループを選択します。
3. **Apply immediately** を選択します。
4. Aurora のライターインスタンスを再起動し、設定を反映します。

:::caution
`rds.logical_replication` パラメータの変更を反映するには、Aurora のライターインスタンスの再起動が必要です。業務負荷の低い時間帯に実施してください。
:::

## ステップ 4：同期ユーザーを作成する {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure -->

**目的：** Doris のストリーミング取り込み専用のアカウントを作成し、データの読み取りとレプリケーションに必要な最小限の権限を付与します。

1. 専用ユーザーを作成します。

    ```sql
    CREATE USER doris_sync PASSWORD '<password>';
    ```

2. スキーマとテーブルの読み取り権限を付与します（ここでは `public` スキーマを例にしています。必要に応じて置き換えてください）。

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
| `SELECT ON ALL TABLES` | スキーマ内の既存の全テーブルからデータを読み取れるようにする |
| `ALTER DEFAULT PRIVILEGES ... GRANT SELECT` | このスキーマに後から作成されるテーブルへの読み取り権限を自動的に付与する |
| `rds_replication` | Aurora PostgreSQL で論理レプリケーションを実行するために必要なロール |

## ステップ 5：パブリケーションを設定する {#step-5-configure-the-publication}

<!-- Knowledge type: Procedure -->

### Doris 4.0 {#doris-40}

`dbz_publication` という名前のパブリケーションを、`FOR ALL TABLES` を指定して事前に作成する必要があります。

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

同期ユーザーに `rds_superuser` ロールなどのスーパーユーザー権限がある場合、Doris はタスク開始時に `dbz_publication` を自動作成できるため、この SQL を手動で実行する必要はありません。Doris 4.0 は、独自のパブリケーション名や一部のテーブルのみを含むパブリケーションをサポートしていません。

### Doris 4.1.0 以降 {#doris-410-and-later}

デフォルトでは、パブリケーションを手動で作成する必要はありません。`publication_name` を設定しない場合、Doris は同期アカウントを使用して `doris_pub_<job_id>` という名前のパブリケーションを作成し、ジョブの削除時にクリーンアップします。そのため、同期アカウントにはパブリケーションの作成権限が必要です。

ストリーミングジョブの作成時に `publication_name` を明示的に設定する場合は、同じ名前のパブリケーションを事前に作成してください。独自に作成するパブリケーションには、ジョブが同期するすべてのソーステーブルを含める必要があります。また、その管理とクリーンアップはユーザーが行う必要があります。例：

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

ジョブの作成時に `"publication_name" = "doris_pub_custom"` を設定します。名前に使用できるのは小文字、数字、アンダースコアのみです。先頭に数字は使用できず、長さは 63 文字以内です。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1：`SHOW rds.logical_replication;` が `on` を返しました。ほかに必要な作業はありますか？**

クラスターパラメータグループの変更やインスタンスの再起動は不要です。[ステップ 4：同期ユーザーを作成する](#step-4-create-the-sync-user)から始めてください。

**Q2：Aurora PostgreSQL 13 以前のバージョンはサポートされていますか？**

いいえ。Doris のストリーミング取り込みには Aurora PostgreSQL 14 以降が必要です。

**Q3：独自の名前のパブリケーションを使用できますか？**

Doris 4.0 は独自の名前をサポートせず、`dbz_publication FOR ALL TABLES` のみをサポートします。バージョン 4.1.0 以降では、`publication_name` で独自の名前を指定できますが、ジョブの作成前にパブリケーションを作成し、同期するすべてのテーブルが含まれていることを確認する必要があります。

**Q4：同期にスーパーユーザーアカウントは必要ですか？**

いいえ。Doris 4.0 では、通常の同期ユーザーを使う場合、`dbz_publication` を手動で作成する必要があります。ユーザーにスーパーユーザー権限があれば、Doris が自動作成できます。バージョン 4.1.0 以降では、`publication_name` を省略すると、Doris がデフォルトのパブリケーションを自動作成して管理します。事前にパブリケーションを作成する必要があるのは、独自のパブリケーションを使う場合のみです。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Pre-sync prerequisite check failure -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` が引き続き `off` を返す | 新しいパラメータグループがクラスターに関連付けられていないか、ライターインスタンスが再起動されていない | **DB cluster parameter group** が新しいパラメータグループに切り替わっていることを確認し、ライターインスタンスを再起動する |
| ユーザーの作成または権限の付与に失敗する | 現在ログインしているアカウントの権限が不足している | `rds_superuser` または同等の権限を持つアカウントでサインインし、操作を実行する |
| `GRANT rds_replication` でエラーが返る | 現在の Aurora のバージョンが古すぎるか、クラスターが Aurora PostgreSQL ではない | Aurora PostgreSQL 14 以降にアップグレードする |
| Doris 4.0 で `dbz_publication` が存在しないと報告される | `dbz_publication` が作成されておらず、同期アカウントにスーパーユーザー権限もない | `CREATE PUBLICATION dbz_publication FOR ALL TABLES;` を実行するか、必要な権限を持つアカウントを使用する |
| Doris 4.1.0 以降でデフォルトのパブリケーションを作成できない | 同期アカウントにパブリケーションの作成権限がない | 同期アカウントに必要な権限を付与するか、管理者に独自のパブリケーションを事前に作成してもらい、`publication_name` を設定する |
| Doris 4.1.0 以降で独自のパブリケーションが存在しないと報告される | `publication_name` が設定されているが、同じ名前のパブリケーションが作成されていない | [ステップ 5](#step-5-configure-the-publication)の説明に従ってパブリケーションを作成するか、`publication_name` の設定を削除する |
