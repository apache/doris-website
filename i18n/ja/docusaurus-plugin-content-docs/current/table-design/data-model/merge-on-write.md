---
{
    "title": "Merge-on-Write（書き込み時マージ）",
    "language": "ja",
    "description": "Doris の Unique Key モデルがキーの一意性を保証する仕組みを説明します。Merge-on-Write と Merge-on-Read の実装、性能上のトレードオフ、選択基準を取り上げます。"
}
---

**Merge-on-Write** と **Merge-on-Read** は、[Unique Key モデル](./unique)の二つのストレージ実装です。どちらもキー列の一意性を保ち、同じクエリ結果を返します。ただし、重複するキーを解決するタイミングが異なるため、読み取りと書き込みの性能に違いが生じます。Merge-on-Write はデフォルトであり、ほとんどのワークロードに適しています。

<!-- Knowledge type: Concept -->
<!-- Applicable scenarios: Choosing a Unique Key implementation -->

## 比較

| 実装 | マージのタイミング | 書き込み性能 | クエリ性能 | 適したシナリオ |
| --- | --- | --- | --- | --- |
| Merge-on-Write（デフォルト） | 書き込み時 | 中程度 | 高い | クエリ性能と書き込み性能のバランスが必要な、ほとんどのシナリオ |
| Merge-on-Read | クエリ時またはコンパクション時 | 高い | 低い | 書き込みが多く、読み取りが少ないシナリオ |

## Merge-on-Write の仕組み

Merge-on-Write では、Doris はデータの書き込み時に重複するキーを解決します。入力される各行について、キーがすでに存在するかを確認し、以前のバージョンがあれば削除ビットマップで削除済みとしてマークします。クエリはビットマップを使ってマークされた行をスキップするため、最新のバージョンだけを読み取ります。その後、コンパクションによってこれらの行がディスクから削除されます。

重複を書き込み時に解決するため、次の特性があります。

- クエリはキーごとに一つのバージョンだけを読み取り、読み取り時のマージは不要です。
- Doris はフィルターをストレージ層までプッシュダウンできるため、条件に一致しないデータのスキャンを省けます。
- 過去の更新が蓄積しても、読み取り性能は低下しません。

その分、書き込み側にコストがかかります。各 upsert では主キーを検索して以前のバージョンを見つけ、マークするため、Merge-on-Read と比べて書き込みのオーバーヘッドが増えます。ほとんどのワークロードではこのトレードオフに見合うため、Merge-on-Write がデフォルトです。

## Merge-on-Read の仕組み

Merge-on-Read では、書き込み時にはデータを追加するだけです。Doris はキーのすべてのバージョンを保持し、クエリ時またはコンパクション時にそれらをマージして、最新のバージョンを返します。

重複を読み取り時に解決するため、次の特性があります。

- 主キーの検索を省くため、書き込み処理は軽量です。
- 各クエリでキーごとのバージョンをマージする必要があり、Doris はフィルターをプッシュダウンできないため、クエリは遅くなります。
- コンパクションの間にバージョンが蓄積するにつれて、クエリのレイテンシーが増加します。

書き込みスループットがクエリ速度より重要な、書き込みが多く読み取りが少ないパイプラインに適しています。

## 選択基準

- **Merge-on-Write（デフォルト）を使用する**: リアルタイム更新、ディメンションデータの同期、クエリ性能が重要なケースを含む、ほとんどのワークロードに適しています。また、部分列更新などの機能も利用できます。
- **Merge-on-Read を使用する**: 読み取りより書き込みがはるかに多く、書き込みのオーバーヘッドを最小限に抑える必要がある場合に限ります。

実装はテーブル作成時に決まり、**後からスキーマ変更で切り替えることはできません**。テーブルを作成する前に選択してください。

## 各実装を有効にする方法

テーブルプロパティ `enable_unique_key_merge_on_write` で実装を制御します。

Merge-on-Write（デフォルト）:

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
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

Merge-on-Read（プロパティを `false` に設定）:

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
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false"
);
```

## Merge-on-Write が必要な機能

[部分列更新](../../data-operate/update/update-of-unique-model)には Merge-on-Write が必要です。この機能では、行全体を書き直さずに、一部の列を更新します。

## 関連項目

- [Unique Key モデル](./unique)
- [部分列更新](../../data-operate/update/update-of-unique-model)
