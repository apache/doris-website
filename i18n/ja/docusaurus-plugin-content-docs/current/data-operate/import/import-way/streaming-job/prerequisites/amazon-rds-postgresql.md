---
{
    "title": "Amazon RDS PostgreSQL",
    "language": "ja",
    "description": "Doris のストリーミング取り込みに向けて、Amazon RDS PostgreSQL で論理レプリケーションを有効にし、同期ユーザーと Publication を設定するための前提手順。",
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

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris のストリーミング取り込みは、**Amazon RDS PostgreSQL 14 以降**からのデータ同期に対応しています。同期タスクを開始する前に、RDS インスタンスで**論理レプリケーション**を有効にし、同期ユーザー、権限、Publication の設定を完了する必要があります。

このドキュメントは RDS PostgreSQL インスタンスの管理者を対象とし、Doris のストリーミング取り込みに必要な前提手順を説明します。

### 事前確認のチェックリスト {#pre-check-checklist}

設定を始める前に、以下の条件を確認してください。

| 確認項目 | 要件 |
| --- | --- |
| RDS PostgreSQL のバージョン | 14 以降 |
| 操作権限 | パラメータグループの変更とインスタンスの再起動に必要な AWS 権限 |
| データベースの権限 | ユーザーの作成、権限の付与、Publication の作成に必要な権限 |
| メンテナンス時間帯 | 利用の少ない時間帯を確保済み（論理レプリケーションのパラメータを変更するにはインスタンスの再起動が必要） |

### 設定手順の概要 {#configuration-flow-overview}

設定は次の順序で行います。

1. `rds.logical_replication` の現在の状態を確認する
2. カスタムパラメータグループを作成して設定する（有効になっていない場合）
3. パラメータグループをインスタンスに適用し、再起動する
4. Doris の同期ユーザーを作成して権限を付与する
5. Doris のバージョンに応じて Publication を設定する

---

## ステップ 1: 現在の設定を確認する {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**目的**: RDS インスタンスで論理レプリケーションが有効かどうかを確認し、パラメータグループを変更する必要があるか判断します。

RDS インスタンスに接続した後、次の SQL を実行します。

```sql
SHOW rds.logical_replication;
```

結果に応じて、次の手順に進んでください。

| 戻り値 | 意味 | 次の手順 |
| --- | --- | --- |
| `on` | 論理レプリケーションは有効 | [ステップ 4: 同期ユーザーを作成する](#step-4-create-the-sync-user)に進む |
| `off` | 論理レプリケーションは無効 | [ステップ 2](#step-2-configure-the-parameter-group)に進む |

---

## ステップ 2: パラメータグループを設定する {#step-2-configure-the-parameter-group}

<!-- Knowledge type: Procedure / Configuration parameters -->

**目的**: カスタムパラメータグループを作成し、`rds.logical_replication` を有効にします。

手順:

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/)にログインします。
2. 左側のナビゲーションペインで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3. 対象インスタンスに一致する PostgreSQL のバージョンファミリーを選択し、新しいパラメータグループを作成します。
4. パラメータグループを編集し、`rds.logical_replication` を検索して値を `1` に設定します。

    ![PostgreSQL の WAL 設定](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **Save Changes** をクリックして保存します。

主なパラメータの説明:

| パラメータ | 値 | 説明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 論理レプリケーションを有効にする。`wal_level` を `logical` に設定することに相当する |

---

## ステップ 3: パラメータグループを適用して再起動する {#step-3-apply-the-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**目的**: 新しいパラメータグループを RDS インスタンスに関連付け、インスタンスを再起動して設定を有効にします。

手順:

1. RDS コンソールで対象インスタンスを選択し、**Modify** をクリックします。
2. **DB parameter group** で、[ステップ 2](#step-2-configure-the-parameter-group)で作成したパラメータグループを選択します。
3. **Apply immediately** を選択し、変更をすぐに適用します。
4. 設定を有効にするため、RDS インスタンスを再起動します。

:::caution
`rds.logical_replication` パラメータの変更を有効にするには、RDS インスタンスの再起動が必要です。この操作は利用の少ない時間帯に行ってください。
:::

---

## ステップ 4: 同期ユーザーを作成する {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure / Configuration parameters -->

**目的**: Doris のストリーミング取り込み専用のデータベースアカウントを作成し、必要な読み取り権限とレプリケーション権限を付与します。

### 1. ユーザーを作成する {#1-create-the-user}

```sql
CREATE USER doris_sync PASSWORD '<password>';
```

### 2. スキーマへのアクセス権限を付与する {#2-grant-schema-access-privileges}

以下では `public` スキーマを例にします。必要に応じて対象のスキーマに置き換えてください。

```sql
GRANT USAGE ON SCHEMA "public" TO doris_sync;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
```

### 3. レプリケーション権限を付与する {#3-grant-replication-privileges}

```sql
GRANT rds_replication TO doris_sync;
```

:::tip
Amazon RDS PostgreSQL では、`rds_replication` ロールを使用してレプリケーション権限を付与します。標準の PostgreSQL の `REPLICATION` 属性は使用しません。
:::

権限の概要:

| 権限 | 用途 |
| --- | --- |
| `USAGE ON SCHEMA` | 指定したスキーマへのアクセスを許可する |
| `SELECT ON ALL TABLES` | スキーマ内の既存のすべてのテーブルの読み取りを許可する |
| `ALTER DEFAULT PRIVILEGES ... SELECT` | 今後追加されるテーブルに `SELECT` 権限を自動的に付与する |
| `rds_replication` | RDS で論理レプリケーションを行うために必要なロール |

---

## ステップ 5: Publication を設定する {#step-5-configure-the-publication}

<!-- Knowledge type: Procedure / Configuration parameters -->

### Doris 4.0 {#doris-40}

`dbz_publication` という名前の Publication を、`FOR ALL TABLES` を指定して事前に作成する必要があります。

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

同期ユーザーが `rds_superuser` ロールなどのスーパーユーザー権限を持つ場合、Doris はタスク開始時に `dbz_publication` を自動で作成できるため、この文を手動で実行する必要はありません。Doris 4.0 は、Publication のカスタム名や、一部のテーブルだけを含む Publication に対応していません。

### Doris 4.1.0 以降 {#doris-410-and-later}

デフォルトでは、Publication を手動で作成する必要はありません。`publication_name` を設定しない場合、Doris は同期アカウントを使用して `doris_pub_<job_id>` という名前の Publication を作成し、ジョブが削除されたときにクリーンアップします。このため、同期アカウントには Publication を作成する権限が必要です。

Streaming Job の作成時に `publication_name` を明示的に設定する場合は、同じ名前の Publication を事前に作成してください。カスタム Publication には、ジョブが同期するすべてのソーステーブルを含める必要があります。また、その保守とクリーンアップはユーザーが行います。例:

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

ジョブを作成するときに `"publication_name" = "doris_pub_custom"` を設定します。名前には小文字の英字、数字、アンダースコアのみを使用でき、先頭に数字は使えません。また、長さは 63 文字以内です。

---

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;` が `on` を返した場合も、インスタンスの再起動は必要ですか？**

いいえ。`on` は論理レプリケーションがすでに有効であることを示します。[ステップ 4: 同期ユーザーを作成する](#step-4-create-the-sync-user)に直接進めます。

**Q2: 別の名前の Publication を使用できますか？**

Doris 4.0 はカスタム名に対応しておらず、`dbz_publication FOR ALL TABLES` のみをサポートします。バージョン 4.1.0 以降は `publication_name` でカスタム名を指定できますが、ジョブを作成する前に Publication を作成し、同期対象のすべてのテーブルが含まれていることを確認する必要があります。

**Q3: `rds_replication` ロールを使用する必要がありますか？**

はい。RDS PostgreSQL では、セキュリティ上の理由から標準の PostgreSQL の `REPLICATION` 属性を使用できません。`GRANT rds_replication` で権限を付与する必要があります。

**Q4: Publication を手動で作成する必要がありますか？**

Doris 4.0 では、通常の同期ユーザーを使用する場合、`dbz_publication` を手動で作成する必要があります。スーパーユーザー権限がある場合は、Doris が自動で作成できます。バージョン 4.1.0 以降では、`publication_name` を省略すると Doris がデフォルトの Publication を自動で作成し、管理します。カスタム Publication を使用する場合のみ、事前の作成が必要です。詳しくは[ステップ 5](#step-5-configure-the-publication)を参照してください。

---

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` が依然として `off` を返す | パラメータグループがインスタンスに関連付けられていない、またはインスタンスが再起動されていない | インスタンスが新しいパラメータグループを使用しているか確認し、再起動する |
| ユーザーの作成時に権限エラーが発生する | 現在のアカウントに十分な権限がない | ユーザー作成権限を持つ管理者アカウントを使用する |
| `GRANT rds_replication` がエラーを返す | 現在のアカウントにこのロールを付与する権限がない | `rds_superuser` アカウント、またはロールの付与権限を持つ別のアカウントを使用する |
| Doris 4.0 で `dbz_publication` が存在しないと報告される | `dbz_publication` が作成されておらず、同期アカウントにスーパーユーザー権限がない | `CREATE PUBLICATION dbz_publication FOR ALL TABLES;` を実行するか、必要な権限を持つアカウントを使用する |
| Doris 4.1.0 以降でデフォルトの Publication の作成に失敗する | 同期アカウントに Publication を作成する権限がない | 同期アカウントに必要な権限を付与するか、管理者がカスタム Publication を事前に作成して `publication_name` を設定する |
| Doris 4.1.0 以降でカスタム Publication が存在しないと報告される | `publication_name` は設定されているが、同じ名前の Publication が作成されていない | [ステップ 5](#step-5-configure-the-publication)の説明に従って Publication を作成するか、`publication_name` を削除して Doris が管理するデフォルトの Publication を使用する |
| パラメータの変更が反映されない | **Apply immediately** が選択されていない、またはインスタンスが再起動されていない | [ステップ 3](#step-3-apply-the-parameter-group-and-restart)を再度実行する |
