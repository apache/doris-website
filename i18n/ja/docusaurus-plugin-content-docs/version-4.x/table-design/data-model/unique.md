---
{
  "title": "ユニークキーテーブル",
  "language": "ja",
  "description": "データ更新が必要な場合は、Unique Key Tableを使用してください。"
}
---
データ更新が必要な場合は、**Unique Key Table**を使用します。これはKeyカラムの一意性を保証し、新しいデータが一致するキーを持つ既存のレコードを上書きすることで、最新のレコードのみが維持されるようにします。このテーブルは更新シナリオに最適で、データ挿入時にunique-keyレベルでの更新を可能にします。
Unique Key Tableには以下の特徴があります：

* **Unique Key UPSERT**：挿入時、重複するキーを持つレコードは更新され、新しいキーは挿入されます。

* **自動重複除去**：テーブルはキーの一意性を保証し、unique keyに基づいてデータを自動的に重複除去します。

* **高頻度更新の最適化**：更新とクエリのパフォーマンスのバランスを取りながら、高頻度の更新を効率的に処理します。

## 使用ケース

* **高頻度データ更新**：上流のOLTPデータベースで、ディメンションテーブルが頻繁に更新される場合、Unique Key Tableは上流の更新されたレコードを効率的に同期し、効率的なUPSERT操作を実行できます。

* **効率的なデータ重複除去**：広告キャンペーンや顧客関係管理システムなど、ユーザーIDに基づいた重複除去が必要なシナリオで、Unique Key Tableは効率的な重複除去を保証します。

* **部分カラム更新**：ユーザープロファイリングで動的タグが頻繁に変更される場合や、注文消費シナリオで取引ステータスを更新する必要がある場合など。Unique Key Tableの部分カラム更新機能により、特定のカラムへの変更が可能になります。

## 実装方法

Dorisでは、Unique Key Tableには2つの実装方法があります：

* **Merge-on-write**：バージョン1.2から、DorisのUnique Key Tableのデフォルト実装はmerge-on-writeモードです。このモードでは、書き込み時に同じKeyのデータが即座にマージされ、各書き込み後のデータストレージ状態がunique keyの最終的なマージ結果となり、最新の結果のみが保存されます。Merge-on-writeはクエリと書き込みパフォーマンスの良好なバランスを提供し、クエリ時に複数バージョンのデータをマージする必要がなく、ストレージレイヤーへの述語プッシュダウンを保証します。merge-on-writeテーブルはほとんどのシナリオで推奨されます。

* **Merge-on-read**：バージョン1.2以前、DorisのUnique Key Tableはデフォルトでmerge-on-readモードでした。このモードでは、書き込み時にデータはマージされず、段階的に追加され、Doris内で複数のバージョンが保持されます。クエリやCompaction時に、データは同じKeyバージョンによってマージされます。Merge-on-readは書き込み中心で読み取りが少ないシナリオに適していますが、クエリ時に複数のバージョンをマージする必要があり、述語をプッシュダウンできないため、クエリ速度に影響する可能性があります。

DorisのUnique Key Tableには2種類の更新セマンティクスがあります：

* **Full Row Upsert**：Unique Key Tableのデフォルトの更新セマンティクスは**full row UPSERT**、すなわちUPDATE OR INSERTです。行のKeyが存在する場合は更新され、存在しない場合は新しいデータが挿入されます。full row UPSERTセマンティクスでは、ユーザーが`INSERT INTO`を使用して特定のカラムにデータを挿入した場合でも、Dorisはplannerステージで不足しているカラムをNULL値またはデフォルト値で埋めます。

* **Partial Column Upsert**：ユーザーが特定のフィールドを更新したい場合は、merge-on-write実装を使用し、特定のパラメータを通じて部分カラム更新サポートを有効にする必要があります。[部分カラム更新](../../data-operate/update/update-of-unique-model)のドキュメントを参照してください。

## Merge-on-write

### Merge-on-writeテーブルの作成

Unique Keyテーブルを作成するには、`UNIQUE KEY`キーワードを使用します。`enable_unique_key_merge_on_write`属性を設定してmerge-on-writeモードを有効にします（Doris 2.1以降のデフォルト）：

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

テーブルを作成する際、`UNIQUE KEY`キーワードを使用してUnique Keyテーブルを指定できます。merge-on-readモードは、`enable_unique_key_merge_on_write`属性を明示的に無効にすることで有効化できます。Dorisバージョン2.1以前では、merge-on-readモードがデフォルトで有効でした：

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

Unique Keyテーブルでは、Keyカラムはソートと重複排除の両方に使用されます。新しい挿入は、一致するキーを持つ既存のレコードを上書きします。

![unique-key-model-insert](/images/table-desigin/unique-key-model-insert.png)

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
## Notes

* Unique Key テーブルの実装モードは作成時に固定され、スキーマ変更により変更することはできません。

* 完全行 UPSERT セマンティクスでは、挿入時に特定の列が省略された場合、Doris は計画時にそれらを NULL またはデフォルト値で埋めます。

* 部分列 upsert の場合、適切なパラメータで merge-on-write モードを有効にしてください。ガイダンスについては [Partial Column Updates](../../data-operate/update/update-of-unique-model) を参照してください。

* Unique テーブルを使用する場合、データの一意性を確保するために、パーティションキーを Key 列に含める必要があります。
