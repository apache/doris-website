---
{
    "title": "Amazon RDS PostgreSQL",
    "language": "ja",
    "description": "Amazon RDS PostgreSQL で論理レプリケーションを有効にし、同期ユーザーと Publication を設定して、Doris のストリーミング取り込みに備えます。",
    "keywords": [
        "Amazon RDS PostgreSQL",
        "Doris streaming ingestion",
        "Logical Replication",
        "rds.logical_replication",
        "rds_replication",
        "Publication",
        "dbz_publication",
        "CDC sync"
    ]
}
---

:::caution 実験的な機能

Doris の継続的なデータロードは実験的な機能で、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris のストリーミング取り込みは、**Amazon RDS PostgreSQL 14 以降**からのデータ同期に対応しています。同期タスクを開始する前に、RDS インスタンスで**論理レプリケーション（Logical Replication）**を有効にし、同期ユーザー、権限、Publication を設定する必要があります。

このドキュメントは RDS PostgreSQL インスタンスの管理者を対象に、Doris のストリーミング取り込みに必要な事前準備を説明します。

### 事前確認のチェックリスト {#pre-check-checklist}

設定を始める前に、次の条件を確認してください。

| 確認項目 | 要件 |
| --- | --- |
| RDS PostgreSQL のバージョン | 14 以降 |
| 操作権限 | パラメータグループの変更とインスタンスの再起動に必要な AWS 権限 |
| データベース権限 | ユーザーの作成、権限の付与、Publication の作成に必要な権限 |
| メンテナンス時間帯 | 利用が少ない時間帯を確保済みであること（論理レプリケーションのパラメータを変更するにはインスタンスの再起動が必要） |

### 設定手順の概要 {#configuration-flow-overview}

設定は次の順序で進めます。

1. `rds.logical_replication` の現在の状態を確認する
2. 有効になっていない場合は、カスタムパラメータグループを作成して設定する
3. パラメータグループをインスタンスに適用し、再起動する
4. Doris の同期ユーザーを作成し、権限を付与する
5. Doris がサブスクライブする Publication を作成する

---

## ステップ 1: 現在の設定を確認する {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**目的**: RDS インスタンスで論理レプリケーションが有効になっているかを確認し、パラメータグループの変更が必要かどうかを判断します。

RDS インスタンスに接続したら、次の SQL を実行します。

```sql
SHOW rds.logical_replication;
```

結果に応じて、次の手順を選択します。

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
3. 対象インスタンスに対応する PostgreSQL のバージョンファミリーを選択し、新しいパラメータグループを作成します。
4. パラメータグループを編集し、`rds.logical_replication` を検索して、値を `1` に設定します。

    ![PostgreSQL の WAL 設定](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **Save Changes** をクリックして保存します。

主なパラメータの説明:

| パラメータ | 値 | 説明 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 論理レプリケーションを有効にする。`wal_level` を `logical` に設定することに相当 |

---

## ステップ 3: パラメータグループを適用して再起動する {#step-3-apply-the-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**目的**: 新しいパラメータグループを RDS インスタンスに関連付け、再起動して設定を反映します。

手順:

1. RDS コンソールで対象インスタンスを選択し、**Modify** をクリックします。
2. **DB parameter group** で、[ステップ 2](#step-2-configure-the-parameter-group)で作成したパラメータグループを選択します。
3. **Apply immediately** を選択して、変更をすぐに適用します。
4. 設定を反映するため、RDS インスタンスを再起動します。

:::caution
`rds.logical_replication` パラメータの変更を反映するには、RDS インスタンスの再起動が必要です。利用が少ない時間帯に実施してください。
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

次の例では `public` スキーマを使用します。必要に応じて対象のスキーマに置き換えてください。

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
Amazon RDS PostgreSQL では、標準の PostgreSQL の `REPLICATION` 属性ではなく、`rds_replication` ロールを使用してレプリケーション権限を付与します。
:::

権限の概要:

| 権限 | 用途 |
| --- | --- |
| `USAGE ON SCHEMA` | 指定したスキーマへのアクセスを許可する |
| `SELECT ON ALL TABLES` | スキーマ内の既存のすべてのテーブルの読み取りを許可する |
| `ALTER DEFAULT PRIVILEGES ... SELECT` | 今後追加されるテーブルに `SELECT` 権限を自動的に付与する |
| `rds_replication` | RDS で論理レプリケーションを実行するために必要なロール |

---

## ステップ 5: Publication を作成する {#step-5-create-the-publication}

<!-- Knowledge type: Procedure / Configuration parameters -->

**目的**: Doris がサブスクライブする Publication を作成します。

次の SQL を実行します。

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

:::caution
現在、Doris がサポートする Publication は、`FOR ALL TABLES` で作成された `dbz_publication` という名前のものだけです。Publication に別の名前を付けたり、一部のテーブルだけを指定したりすることは、まだサポートされていません。
:::

> **注**: 同期ユーザーにスーパーユーザー権限（`rds_superuser` ロールなど）がある場合、タスクの開始時に Doris がこの Publication を自動的に作成するため、この手順を手動で実行する必要はありません。

---

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;` が `on` を返した場合も、インスタンスを再起動する必要がありますか？**

いいえ。`on` は論理レプリケーションがすでに有効であることを示します。[ステップ 4: 同期ユーザーを作成する](#step-4-create-the-sync-user)に直接進めます。

**Q2: 別の名前の Publication を使用できますか？**

いいえ。現在、Doris がサポートするのは `dbz_publication` という名前の Publication だけで、`FOR ALL TABLES` で作成する必要があります。

**Q3: `rds_replication` ロールを使用する必要がありますか？**

はい。セキュリティ上の理由から、RDS PostgreSQL では標準の PostgreSQL の `REPLICATION` 属性を使用できません。`GRANT rds_replication` を通じて権限を付与する必要があります。

**Q4: Publication を手動で作成する必要がありますか？**

必ずしも必要ではありません。同期ユーザーに `rds_superuser` などのスーパーユーザー権限がある場合、Doris が `dbz_publication` を自動的に作成するため、[ステップ 5](#step-5-create-the-publication)を省略できます。

---

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| `SHOW rds.logical_replication;` が引き続き `off` を返す | パラメータグループがインスタンスに関連付けられていない、またはインスタンスが再起動されていない | インスタンスが新しいパラメータグループを使用しているか確認し、再起動する |
| ユーザー作成時に権限エラーが発生する | 現在のアカウントに十分な権限がない | ユーザー作成権限を持つ管理者アカウントを使用する |
| `GRANT rds_replication` でエラーが発生する | 現在のアカウントにこのロールを付与する権限がない | `rds_superuser` アカウント、または付与権限を持つ別のアカウントを使用する |
| Doris のタスクで Publication が存在しないと報告される | `dbz_publication` が作成されていない、または権限が不足している | [ステップ 5](#step-5-create-the-publication)を手動で実行するか、同期ユーザーにスーパーユーザー権限を付与する |
| パラメータの変更が反映されない | **Apply immediately** が選択されていない、またはインスタンスが再起動されていない | [ステップ 3](#step-3-apply-the-parameter-group-and-restart)を再実行する |
