---
{
    "title": "Unique Key モデル",
    "language": "ja",
    "description": "Doris の Unique Key モデルは Key 列の一意性を保証し、UPSERT と重複排除をサポートします。頻繁な更新、ディメンションテーブルの同期、プロファイルへのタグ付けなど、データを更新する用途に適しています。"
}
---

Unique Key モデルでは、Key 列の値が一意に保たれます。行を挿入または更新すると、同じ Key を持つ既存の行が新しいデータで上書きされるため、テーブルには常に最新の行が保持されます。主キーによってデータを更新する場合に使用します。

<!-- Knowledge type: Data model -->
<!-- Applicable scenarios: Data update / High-frequency writes / Primary key deduplication -->

## 使用する場面 {#when-to-use}

Unique Key モデルは、主に次の三つの場面に適しています。

1. **頻繁なデータ更新**: 上流の OLTP データベースからディメンションテーブルをリアルタイムで同期する場合など、効率的な UPSERT 操作が必要な場面。
2. **効率的な重複排除**: 広告配信や顧客関係管理（CRM）などのシステムで、ユーザー ID によってレコードの重複を排除する場面。
3. **一部の列の更新**: 動的なタグが頻繁に変わるプロファイルへのタグ付けや、取引ステータスが変わる注文の処理など、影響を受ける列だけを更新する場面。

## Unique Key テーブルの作成 {#create-a-unique-key-table}

`UNIQUE KEY` キーワードで主キーを宣言します。Merge-on-Write はデフォルトで有効で、ほぼすべてのワークロードに適しているため、追加のプロパティを指定する必要はありません。

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

各行は `(user_id, user_name)` で識別されます。既存の Key を持つ行を書き込むと、その行が上書きされます。新しい Key を持つ行は挿入されます。

## データの UPSERT {#upsert-data}

Doris はロード方法にかかわらず、Key に基づいて UPSERT を行います。既存の Key を持つ行は更新され、新しい Key を持つ行は挿入されます。Doris は Key 列をソートと重複排除の両方に使用します。以下の例では `INSERT` を使用しますが、Stream Load、Broker Load、Routine Load でも同様に動作します。

![Unique Key モデルへの挿入](/images/table-desigin/unique-key-model-insert.png)

次の例では、元のテーブルに 4 行あります。既存の Key を持つ 2 行を再び挿入すると、それらの行が更新されます。

```sql
-- Insert original data
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- Re-insert the same Keys with new values
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 27, 1),
(102, 'Jason', 'SH', 28, 1);

-- Query the updated data
SELECT * FROM example_tbl_unique;
+---------+-----------+------+------+------+
| user_id | user_name | city | age  | sex  |
+---------+-----------+------+------+------+
| 101     | Tom       | BJ   |   27 |    1 |
| 102     | Jason     | SH   |   28 |    1 |
| 104     | Olivia    | SZ   |   22 |    2 |
| 103     | Juice     | SH   |   20 |    2 |
+---------+-----------+------+------+------+
```

行全体を UPSERT する場合、`INSERT INTO` で一部の列だけを指定すると、Doris は残りの列に NULL またはデフォルト値を設定します。

## 一部の列だけを更新する {#update-only-some-columns}

行全体を書き換えずに一部のフィールドを変更するには、部分列更新を使用します。部分列更新には Merge-on-Write（デフォルト）が必要で、パラメータを指定して有効にします。詳しくは、[部分列更新](../../data-operate/update/update-of-unique-model)を参照してください。

## 実装方式の選択 {#choose-an-implementation}

Unique Key モデルには、**Merge-on-Write**（デフォルトで、ほとんどのワークロードに推奨）と **Merge-on-Read**（書き込みが多く、読み取りが少ない処理に適する）の二つのストレージ実装方式があります。実装方式はテーブル作成時に確定し、後からスキーマ変更によって切り替えることはできません。

各方式の仕組み、性能面のトレードオフ、Merge-on-Read の有効化方法については、[Merge-on-Write](./merge-on-write)を参照してください。

## 注意事項 {#notes}

Unique Key モデルを使用する際は、次の制約に注意してください。

1. **実装方式は変更できません**: Merge-on-Write と Merge-on-Read のどちらを使用するかは、テーブル作成時にのみ設定でき、スキーマ変更では切り替えられません。
2. **行全体の UPSERT ではデフォルト値が補完されます**: `INSERT INTO` で一部の列だけを指定した場合でも、Doris は指定されていない列に NULL またはデフォルト値を設定します。
3. **部分列更新には Merge-on-Write が必要です**: 一部の列だけを更新するには、Merge-on-Write を使用し、パラメータを指定して部分列更新を有効にします。詳しくは、[部分列更新](../../data-operate/update/update-of-unique-model)を参照してください。
4. **パーティションキーは Key 列の部分集合である必要があります**: Doris では、データの一意性を保証するためにこの条件が必要です。
