---
{
    "title": "Unique モデルにおける複数ストリームからの更新",
    "language": "ja",
    "description": "Doris の Unique モデルの Sequence Mapping 機能を使用し、複数のデータストリームが同じワイドテーブルの異なる列を同時に更新する際のバージョン管理の問題を解決します。"
}
---

<!-- Knowledge type: Feature + Procedure -->
<!-- Applicable scenarios: Concurrent writes from multiple data streams to a wide table / Real-time updates for some columns combined with on-demand updates for others -->

## ビジネスシナリオと課題

データウェアハウスのワイドテーブルでは、同じテーブルの列でも**異なるデータソース**や**異なる処理パイプライン**に由来することがよくあります。一般的な例は次のとおりです。

- **リアルタイムストリーム**: テーブルの一部のフィールド（ユーザーの行動に関する列など）を継続的に更新します。
- **オフラインストリーム（またはオンデマンドストリーム）**: テーブルの他のフィールド（ユーザープロファイルやタグに関する列など）を特定のタイミングで更新します。

このシナリオでは、複数のデータストリームが同じ主キーテーブルに同時に書き込むため、主に次の二つの問題が生じます。

| 課題 | 説明 |
| --- | --- |
| **同時書き込みによる上書き** | データストリームごとに到着時刻が異なります。単純な REPLACE 集約では、各ストリームのデータがバージョン順に更新されることを保証できません。 |
| **データ結合のコストが高い** | すべての列のデータがそろうまで書き込みを待つことは、ほぼ不可能です。待ち時間が非常に長くなる可能性があり、業務上許容できません。 |

Doris の Unique モデルは Sequence 列に基づくバージョン管理を標準でサポートしていますが、**グローバル Sequence 列は一つだけしか定義できません**。そのため、異なるデータストリームが更新する列ごとにバージョンを独立して管理することはできません。この問題に対応するため、Doris は **Sequence Mapping** 機能を提供しています。

## 解決方法: Sequence Mapping

<!-- Knowledge type: One-line definition -->

**Sequence Mapping** は、Doris の Unique モデルがサポートする、複数ストリームからの同時更新の仕組みです。データ列ごとに異なる Sequence 列を指定することで、各データストリームのバージョンを互いに干渉せずに管理できます。

### 動作の仕組み

Unique テーブルに次の列があるとします。

| 列 | A | B | C | D | E | s1 | s2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 役割 | キー | キー | 値 | 値 | 値 | Sequence | Sequence |

- データストリーム 1 は列 `A, B, C, D` に書き込み、`s1` をバージョン管理列として使用します。
- データストリーム 2 は列 `A, B, E` に書き込み、`s2` をバージョン管理列として使用します。

このマッピングでは、次のように動作します。

- `s1` は列 `C, D` のバージョンを管理します。新しいデータの `s1` が既存データの `s1` より大きい場合にのみ、`C, D, s1` が更新されます。
- `s2` は列 `E` のバージョンを管理します。新しいデータの `s2` が既存データの `s2` より大きい場合にのみ、`E, s2` が更新されます。
- 二つのストリームは**互いに干渉せず**、クエリではすべての列の最新データを読み取れます。

## 使用例

### 1. Sequence Mapping に対応するテーブルを作成する

`sequence_mapping.<sequence_col>` プロパティを `PROPERTIES` で使用して、Sequence 列と、その列が管理する Value 列のマッピングを宣言します。

次の例では、列 `c, d` のバージョンを `s1` で管理し、列 `e` のバージョンを `s2` で管理する Unique テーブルを作成します。

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `e`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT "",
    `s2` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d",
    "sequence_mapping.s2" = "e"
);
```

> Sequence 列でサポートされる型は整数型、`DATE`、`DATETIME` です。**列を作成した後に型を変更することはできません。**

作成後のテーブルスキーマは次のとおりです。

```sql
MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| s2    | int    | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+
```

### 2. データを書き込んでクエリする

次の五つの INSERT 操作は、Sequence 値の違いが各列の更新にどう影響するかを示しています。

**INSERT 1**: `c, d, s1` のみに書き込み、`e, s2` には書き込みません。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,2,2,2);
Query OK, 1 row affected (0.080 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**INSERT 2**: `s1=1` は既存の `s1=2` より小さいため、`c, d, s1` は更新されません。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1);
Query OK, 1 row affected (0.048 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**INSERT 3**: `e, s2` に書き込みます。更新前の `s2` は `NULL`（最小値として扱われます）だったため、`e, s2` が更新されます。

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.043 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 |    2 |    2 |    2 |
+------+------+------+------+------+------+------+
```

**INSERT 4**: `s1=3` は既存の `s1=2` より大きいため、`c, d, s1` が更新されます。`e, s2` には影響しません。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,3,3,3);
Query OK, 1 row affected (0.049 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    2 |    3 |    2 |
+------+------+------+------+------+------+------+
```

**INSERT 5**: 両方の列グループに書き込みます。`s1=4` と `s2=4` はどちらも既存の値より大きいため、すべての列が更新されます。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+------+
```

更新結果のまとめは次のとおりです。

| 操作 | 更新条件 | 更新された列 |
| --- | --- | --- |
| INSERT 1 | `c, d, s1` への最初の書き込み | `c, d, s1` |
| INSERT 2 | 新しい `s1` < 既存の `s1` | なし |
| INSERT 3 | `e, s2` への最初の書き込み | `e, s2` |
| INSERT 4 | 新しい `s1` > 既存の `s1` | `c, d, s1` |
| INSERT 5 | 新しい `s1` と `s2` がどちらも既存の値より大きい | `c, d, s1, e, s2` |

### 3. 列を追加または削除する

Sequence Mapping テーブルでは、`ALTER TABLE` を使用して列やマッピングを動的に追加または削除できます。

**初期テーブルの作成**: `s1 -> c,d` のマッピングのみを設定します。

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d"
);
```

**初期データの書き込み**:

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1),(1,1,3,3,3),(1,1,2,2,2);
Query OK, 3 rows affected (0.101 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |
+------+------+------+------+------+
```

**列とマッピングの追加**: `ALTER TABLE` を使用して列 `e, s2` を追加すると同時に、`s2 -> e` のマッピングを宣言します。

```sql
MySQL > alter table upsert_test add column (e int(11) NULL, s2 bigint) PROPERTIES('sequence_mapping.s2' = 'e');
Query OK, 0 rows affected (0.011 sec)

MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s2    | bigint | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 | NULL | NULL |
+------+------+------+------+------+------+------+
```

**新しいマッピングが有効になった後の書き込み**:

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.052 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |    2 |    2 |
+------+------+------+------+------+------+------+

MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    5 |    4 |
+------+------+------+------+------+------+------+
```

**列の削除**: Value 列 `e` を削除すると、対応するマッピングが無効になります。その後、Sequence 列 `s2` を削除します。

```sql
MySQL > alter table upsert_test drop column e;
Query OK, 0 rows affected (0.006 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | s2   |
+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+

MySQL > alter table upsert_test drop column s2;
Query OK, 0 rows affected (0.005 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |
+------+------+------+------+------+
```

## 使用上の制約

<!-- Knowledge type: Configuration parameters / Usage limitations -->

Sequence Mapping を使用する際は、次の制約に注意してください。

| 分類 | 制約 |
| --- | --- |
| **テーブル作成時の設定** | `light_schema_change` を有効にする必要があります。テーブル作成時に `sequence_mapping` プロパティを宣言しなかった場合、後から有効にすることはできません。 |
| **列の型** | Sequence 列でサポートされるのは整数型と時間型（`DATE`、`DATETIME`）のみで、作成後に型を変更することはできません。 |
| **列の役割** | Sequence 列もマッピング対象の列も Key 列にはできません。Key 以外のすべての列を Sequence 列にマッピングする必要があります。 |
| **マッピング関係** | 異なる Sequence 列にマッピングする列は**重複できません**（例えば、`d` を `s1` と `s2` の両方にマッピングすることはできません）。マッピングを設定した後は**変更できません**（例えば、すでに `s1` にマッピングした列を `s2` に再マッピングすることはできません）。 |
| **DDL の制限** | 列名の変更と Rollup の作成はサポートされません。 |
| **ストレージモード** | 現在サポートされるのは MOR（Merge-on-Read）テーブルのみです。グローバル Sequence 列との併用はサポートされません。バッチ削除操作もサポートされません。 |
| **ロード時の動作** | ロード時に含まれないフィールドには、デフォルト値または `NULL` が自動的に設定されます。Sequence 列の比較では、`NULL` は**最小値**として扱われます。 |
