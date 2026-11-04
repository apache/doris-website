---
{
    "title": "Amazon RDS PostgreSQL",
    "language": "ja",
    "description": "Amazon RDS PostgreSQL で論理レプリケーションを有効にし、同期ユーザーと Publication を設定して、Doris ストリーミング取り込みの準備を行います。",
    "keywords": [
        "Amazon RDS PostgreSQL",
        "Doris streaming ingestion",
        "Logical Replication",
        "rds.logical_replication",
        "rds_replication",
        "Publication",
        "dbz_publication",
        "publication_name",
        "CDC sync"
    ]
}
---

:::caution 実験的機能

Doris の継続ロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris ストリーミング取り込みは、**Amazon RDS PostgreSQL 14 以降**からのデータ同期をサポートします。同期タスクを開始する前に、RDS インスタンスで **Logical Replication** を有効にし、同期ユーザー、権限、Publication の設定を完了する必要があります。

このドキュメントは RDS PostgreSQL インスタンス管理者を対象とし、Doris ストリーミング取り込みに必要な前提手順について説明します。

### 事前確認チェックリスト {#pre-check-checklist}

設定を開始する前に、次の条件を確認してください。

| 確認項目 | 要件 |
| --- | --- |
| RDS PostgreSQL バージョン | 14 以降 |
| 操作権限 | パラメータグループの変更とインスタンスの再起動を行える AWS 権限 |
| データベース権限 | ユーザーの作成、権限付与、Publication の作成を行える権限 |
| メンテナンスウィンドウ | オフピーク時間帯を計画済み（論理レプリケーションパラメータの変更にはインスタンスの再起動が必要） |

### 構成フローの概要 {#configuration-flow-overview}

全体の構成フローは次のとおりです。

1. `rds.logical_replication` の現在の状態を確認する
2. カスタムパラメータグループを作成して設定する（有効になっていない場合）
3. パラメータグループをインスタンスに適用して再起動する
4. Doris 同期ユーザーを作成して権限を付与する
5. Doris のバージョンに基づいて Publication を設定する

---

## ステップ 1: 現在の構成を確認 {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**目的**: RDS インスタンスで論理レプリケーションが現在有効かどうかを確認し、パラメータグループを変更する必要があるか判断します。

RDS インスタンスに接続したら、次の SQL を実行します。

```sql
SHOW rds.logical_replication;
```

結果に基づいて、次の手順を選択します。

| 返された値 | 意味 | 次の手順 |
| --- | --- | --- |
| `on` | 論理レプリケーションが有効 | [ステップ 4: 同期ユーザーを作成](#step-4-create-the-sync-user) に進む |
| `off` | 論理レプリケーションが無効 | [ステップ 2](#step-2-configure-the-parameter-group) に進む |

---

## ステップ 2: パラメータグループを設定 {#step-2-configure-the-parameter-group}

<!-- Knowledge type: Procedure / Configuration parameters -->

**目的**: カスタムパラメータグループを作成し、`rds.logical_replication` を有効に設定します。

手順:

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/) にログインします。
2. 左側のナビゲーションペインで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3. 対象インスタンスに一致する PostgreSQL バージョンファミリーを選択し、新しいパラメータグループを作成します。
4. パラメータグループを編集し、`rds.logical_replication` を検索して、値を `1` に設定します。

    ![PostgreSQL WAL 設定](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **Save Changes** をクリックして保存します。

主なパラメータの説明:

| パラメータ | 値 | 説明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 論理レプリケーションを有効にします。`wal_level` を `logical` に設定するのと同等です |

---

## ステップ 3: パラメータグループを適用して再起動 {#step-3-apply-the-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**目的**: 新しいパラメータグループを RDS インスタンスに関連付け、再起動して構成を有効にします。

手順:

1. RDS コンソールで対象インスタンスを選択し、**Modify** をクリックします。
2. **DB parameter group** で、[ステップ 2](#step-2-configure-the-parameter-group) で作成したパラメータグループを選択します。
3. **Apply immediately** を選択して、変更を直ちに適用します。
4. RDS インスタンスを再起動して、構成を有効にします。

:::caution
`rds.logical_replication` パラメータの変更を有効にするには、RDS インスタンスの再起動が必要です。この操作はオフピーク時間帯に実行してください。
:::

---

## ステップ 4: 同期ユーザーを作成 {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure / Configuration parameters -->

**目的**: Doris ストリーミング取り込み専用のデータベースアカウントを作成し、必要な読み取り権限とレプリケーション権限を付与します。

### 1. ユーザーを作成 {#1-create-the-user}

```sql
CREATE USER doris_sync PASSWORD '<password>';
```

### 2. スキーマへのアクセス権限を付与 {#2-grant-schema-access-privileges}

次の例では `public` スキーマを使用しています。必要に応じて対象スキーマに置き換えてください。

```sql
GRANT USAGE ON SCHEMA "public" TO doris_sync;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
```

### 3. レプリケーション権限を付与 {#3-grant-replication-privileges}

```sql
GRANT rds_replication TO doris_sync;
```

:::tip
Amazon RDS PostgreSQL では、標準 PostgreSQL の `REPLICATION` 属性ではなく、`rds_replication` ロールを使用してレプリケーション権限を付与します。
:::

権限の概要:

| 権限 | 目的 |
| --- | --- |
| `USAGE ON SCHEMA` | 指定したスキーマへのアクセスを許可します |
| `SELECT ON ALL TABLES` | スキーマ内の既存のすべてのテーブルの読み取りを許可します |
| `ALTER DEFAULT PRIVILEGES ... SELECT` | 将来追加されるテーブルに `SELECT` 権限を自動的に付与します |
| `rds_replication` | RDS で論理レプリケーションを実行するために必要なロールです |

---

## ステップ 5: Publication を設定 {#step-5-configure-the-publication}

<!-- Knowledge type: Procedure / Configuration parameters -->

デフォルトでは、Publication を手動で作成する必要はありません。`publication_name` が設定されていない場合、Doris は同期アカウントを使用して `doris_pub_<job_id>` という名前の Publication を作成し、ジョブの削除時にクリーンアップします。そのため、同期アカウントには Publication を作成する権限が必要です。

Streaming Job の作成時に `publication_name` を明示的に設定する場合は、同じ名前の Publication をあらかじめ作成してください。カスタム Publication には、ジョブで同期するすべてのソーステーブルを含める必要があり、その保守とクリーンアップはユーザーが行います。例:

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

ジョブの作成時に `"publication_name" = "doris_pub_custom"` を設定します。名前には小文字、数字、アンダースコアのみを使用でき、数字で始めることはできず、長さは 63 文字以内です。

---

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;` が `on` を返す場合でも、インスタンスを再起動する必要がありますか？**

いいえ。`on` は論理レプリケーションがすでに有効であることを示すため、[ステップ 4: 同期ユーザーを作成](#step-4-create-the-sync-user) に直接進めます。

**Q2: 別の名前の Publication を使用できますか？**

`publication_name` でカスタム名を指定できますが、ジョブを作成する前に Publication を作成し、すべての同期対象テーブルが含まれていることを確認する必要があります。

**Q3: `rds_replication` ロールの使用は必須ですか？**

はい。セキュリティ上の理由から、RDS PostgreSQL では標準 PostgreSQL の `REPLICATION` 属性を使用できません。`GRANT rds_replication` によって権限を付与する必要があります。

**Q4: Publication は手動で作成する必要がありますか？**

`publication_name` を省略すると、Doris がデフォルト Publication を自動的に作成して管理します。カスタム Publication を使用する場合のみ、事前に作成する必要があります。詳細は [ステップ 5](#step-5-configure-the-publication) を参照してください。

---

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 解決策 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` が引き続き `off` を返す | パラメータグループがインスタンスに関連付けられていない、またはインスタンスが再起動されていない | インスタンスが新しいパラメータグループを使用しているか確認し、再起動します |
| ユーザー作成時に権限エラーが発生する | 現在のアカウントに十分な権限がない | ユーザーを作成する権限を持つ管理者アカウントを使用します |
| `GRANT rds_replication` がエラーを返す | 現在のアカウントにこのロールを付与する権限がない | `rds_superuser` アカウント、または付与権限を持つ別のアカウントを使用します |
| デフォルト Publication を作成できない | 同期アカウントに Publication の作成権限がない | 同期アカウントに必要な権限を付与するか、管理者にカスタム Publication をあらかじめ作成してもらい、`publication_name` を設定します |
| カスタム Publication が存在しない | `publication_name` が設定されているが、同じ名前の Publication が作成されていない | [ステップ 5](#step-5-configure-the-publication) の説明に従って Publication を作成するか、`publication_name` を削除して Doris が管理するデフォルト Publication を使用します |
| パラメータの変更が有効にならない | **Apply immediately** が選択されていない、またはインスタンスが再起動されていない | [ステップ 3](#step-3-apply-the-parameter-group-and-restart) を再実行します |
