---
{
  "title": "ユニークキーテーブル",
  "language": "ja",
  "description": "データ更新が必要な場合は、Unique Key tableを使用してください。"
}
---
データの更新が必要な場合は、**Unique Key table**を使用してください。これはKeyカラムの一意性を保証し、新しいデータが一致するキーを持つ既存のレコードを上書きすることで、最新のレコードのみが維持されることを保証します。このモデルは更新シナリオに理想的であり、データ挿入時にunique-keyレベルでの更新を可能にします。
Unique Key tableには以下の特徴があります：

* **Unique Key UPSERT**：挿入時に、重複するキーを持つレコードは更新され、新しいキーは挿入されます。

* **自動重複除去**：テーブルはキーの一意性を保証し、unique keyに基づいてデータを自動的に重複除去します。

* **高頻度更新の最適化**：更新とクエリパフォーマンスのバランスを取りながら、高頻度の更新を効率的に処理します。

## ユースケース

* **高頻度データ更新**：上流のOLTPデータベースにおいて、ディメンションテーブルが頻繁に更新される場合、Unique Key tableは上流の更新されたレコードを効率的に同期し、効率的なUPSERT操作を実行できます。

* **効率的なデータ重複除去**：広告キャンペーンや顧客関係管理システムなど、ユーザーIDに基づく重複除去が必要なシナリオにおいて、Unique Key tableは効率的な重複除去を保証します。

* **部分カラム更新**：動的タグが頻繁に変更されるユーザープロファイリングや、取引ステータスの更新が必要な注文処理シナリオなどにおいて、Unique Key tableの部分カラム更新機能により、特定のカラムへの変更が可能になります。

## 実装方法

Dorisにおいて、Unique Key tableには2つの実装方法があります：

* **Merge-on-write**：バージョン1.2以降、DorisのUnique Key tableのデフォルト実装はmerge-on-writeモードです。このモードでは、書き込み時に同じKeyに対してデータが即座にマージされ、各書き込み後のデータストレージ状態がunique keyの最終マージ結果となることを保証し、最新の結果のみが格納されます。Merge-on-writeはクエリと書き込みパフォーマンスの良好なバランスを提供し、クエリ時に複数バージョンのデータをマージする必要がなく、ストレージ層への述語プッシュダウンを保証します。merge-on-writeモデルはほとんどのシナリオで推奨されます。

* **Merge-on-read**：バージョン1.2以前、DorisのUnique Key tableはデフォルトでmerge-on-readモードでした。このモードでは、書き込み時にデータはマージされず、増分的に追加され、Doris内で複数のバージョンを保持します。クエリやCompaction時に、データは同じKeyバージョンでマージされます。Merge-on-readは書き込み中心で読み込み頻度が低いシナリオに適していますが、クエリ時に複数のバージョンをマージする必要があり、述語をプッシュダウンできないため、クエリ速度に影響する可能性があります。

DorisにおけるUnique Key tableには、2つのタイプの更新セマンティクスがあります：

* **Full Row Upsert**：Unique Key tableのデフォルトの更新セマンティクスは**full row UPSERT**、すなわちUPDATE OR INSERTです。行のKeyが存在する場合は更新され、存在しない場合は新しいデータが挿入されます。full row UPSERTセマンティクスでは、ユーザーが`INSERT INTO`を使用して特定のカラムにデータを挿入した場合でも、Dorisはプランナー段階で欠損カラムにNULL値またはデフォルト値を入力します。

* **Partial Column Upsert**：ユーザーが特定のフィールドを更新したい場合は、merge-on-write実装を使用し、特定のパラメータを通じて部分カラム更新サポートを有効にする必要があります。[部分カラム更新](../../data-operate/update/update-of-unique-model)のドキュメントを参照してください。

## Merge-on-write

### Merge-on-writeテーブルの作成

Unique Keyテーブルを作成するには、`UNIQUE KEY`キーワードを使用します。`enable_unique_key_merge_on_write`属性を設定してmerge-on-writeモードを有効にします（Doris 2.1以降はデフォルト）：

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
## Merge-on-read

### Merge-on-readテーブルの作成

テーブルを作成する際、`UNIQUE KEY`キーワードを使用してUnique Keyテーブルを指定できます。merge-on-readモードは、`enable_unique_key_merge_on_write`属性を明示的に無効にすることで有効にできます。Dorisバージョン2.1以前では、merge-on-readモードがデフォルトで有効になっていました：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    username        VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, username)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false"
);
```
## データの挿入と保存

Unique Keyテーブルでは、Keyカラムはソートと重複排除の両方の目的で使用されます。新しい挿入では、一致するキーを持つ既存のレコードが上書きされます。

![unique-key-table-insert](/images/table-desigin/unique-key-model-insert.png)

例に示すように、元のテーブルには4行のデータがありました。2つの新しい行を挿入した後、新しく挿入された行はunique keyに基づいて更新されます：

```sql
-- insert into raw data
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- insert into data to update by key
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 27, 1),
(102, 'Jason', 'SH', 28, 1);

-- check updated data
SELECT * FROM example_tbl_unique;
+---------+----------+------+------+------+
| user_id | username | city | age  | sex  |
+---------+----------+------+------+------+
| 101     | Tom      | BJ   |   27 |    1 |
| 102     | Jason    | SH   |   28 |    1 |
| 104     | Olivia   | SZ   |   22 |    2 |
| 103     | Juice    | SH   |   20 |    2 |
+---------+----------+------+------+------+
```
## 注意事項

* Unique Keyテーブルの実装モードは作成時に固定され、スキーマ変更によって変更することはできません。

* 完全行UPSERTセマンティクスでは、挿入時に特定の列が省略された場合、Dorisは計画時にそれらをNULLまたはデフォルト値で埋めます。

* 部分列upsertの場合は、適切なパラメータでmerge-on-writeモードを有効にしてください。ガイダンスについては[Partial Column Updates](../../data-operate/update/update-of-unique-model)を参照してください。

* Uniqueテーブルを使用する場合、データの一意性を確保するためにパーティションキーをKey列に含める必要があります。
