---
{
    "title": "LATERAL VIEW",
    "language": "ja",
    "description": "Doris の LATERAL VIEW は、EXPLODE などの生成関数と組み合わせて 1 行を複数行に展開し、SQL で列を行に変換するクエリを可能にします。",
    "keywords": [
        "Doris LATERAL VIEW",
        "列から行への変換",
        "EXPLODE",
        "行から列への変換",
        "配列の展開",
        "lateral view explode",
        "SQL で 1 行を複数行に展開"
    ]
}
---

<!-- Knowledge type: Syntax reference -->
<!-- Applicable scenario: Array/collection type expansion queries, column to row -->

`LATERAL VIEW` は、Doris が提供する列から行への変換構文です。生成関数（`EXPLODE` など）と組み合わせることで、行内のコレクション型フィールドを複数行に展開し、その結果を仮想テーブルとして元の行と結合します。

## 適用場面

配列やリストなど、要素を列挙できるコレクションがデータ行に含まれており、SQL クエリで各要素を個別の行に分割して分析する場合は、`LATERAL VIEW` を使用できます。主な用途は次のとおりです。

- 行内の配列フィールドを展開し、各要素を元の行のほかの列とともに出力する。
- コレクションの各要素に対して個別に集計やフィルタリングを行う、またはほかのテーブルと結合する。
- 生成関数（`EXPLODE`、`EXPLODE_SPLIT` など）の出力をクエリ内の仮想テーブルとして使用する。

## 構文

```sql
LATERAL VIEW generator_function ( expression [, ...] ) table_identifier AS column_identifier [, ...]
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `generator_function` | `EXPLODE` や `EXPLODE_SPLIT` などの生成関数。 |
| `table_identifier` | `generator_function` が生成する仮想テーブルの別名。 |
| `column_identifier` | 出力列に付ける列の別名。列の別名の数は、生成関数が返す列の数と一致する必要があります。 |

## 使用例

次の例では、`LATERAL VIEW` を使用して列から行への変換クエリを実行します。

### 1. データの準備

`person` テーブルを作成し、テストデータを数行挿入します。

```sql
CREATE TABLE `person` (
  `id` int(11) NULL,
  `name` text NULL,
  `age` int(11) NULL,
  `class` int(11) NULL,
  `address` text NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"in_memory" = "false",
"storage_format" = "V2",
"disable_auto_compaction" = "false"
);

INSERT INTO person VALUES
    (100, 'John', 30, 1, 'Street 1'),
    (200, 'Mary', NULL, 1, 'Street 2'),
    (300, 'Mike', 80, 3, 'Street 3'),
    (400, 'Dan', 50, 4, 'Street 4');
```

### 2. LATERAL VIEW クエリの実行

`LATERAL VIEW` と `EXPLODE` 関数を組み合わせ、配列 `ARRAY(30, 60)` の各要素を `person` テーブルの各行と直積展開します。

```sql
SELECT * FROM person
LATERAL VIEW EXPLODE(ARRAY(30, 60)) tableName AS c_age;
```

### 3. 結果の確認

クエリ結果には、`person` テーブルの各行と `EXPLODE` が生成した各行の組み合わせが含まれます。

```sql
+------+------+------+-------+----------+-------+
| id   | name | age  | class | address  | c_age |
+------+------+------+-------+----------+-------+
|  100 | John |   30 |     1 | Street 1 |    30 |
|  100 | John |   30 |     1 | Street 1 |    60 |
|  200 | Mary | NULL |     1 | Street 2 |    30 |
|  200 | Mary | NULL |     1 | Street 2 |    60 |
|  300 | Mike |   80 |     3 | Street 3 |    30 |
|  300 | Mike |   80 |     3 | Street 3 |    60 |
|  400 | Dan  |   50 |     4 | Street 4 |    30 |
|  400 | Dan  |   50 |     4 | Street 4 |    60 |
+------+------+------+-------+----------+-------+
8 rows in set (0.12 sec)
```
