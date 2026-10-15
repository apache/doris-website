---
{
    "title": "CREATE SYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "同期マテリアライズドビューを作成するためのステートメント。"
}
---

## 説明

同期マテリアライズドビューを作成するためのステートメントです。

## 構文

```sql
CREATE MATERIALIZED VIEW <materialized_view_name> [AS] <query>            
```

ここで

```sql
query
    :
    SELECT <select_expr> select_expr[, select_expr ...]
    FROM <base_table>
    WHERE condition
    GROUP BY <column_name>[, <column_name> ...]
    ORDER BY <column_name>[, <column_name> ...]
```

## 必須パラメータ

**1. `<materialized_view_name>`**

> マテリアライズドビューの識別子（名前）を指定します。同期マテリアライズドビューはテーブルを基に作成されるため、名前は同じテーブル内で一意である必要があります。
>
> 識別子は文字で始める必要があります。Unicode 名のサポートが有効な場合は、任意の言語の文字で始めることができます。識別子全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My Object`）。
>
> 識別子に予約語は使用できません。
>
> 詳細については、識別子と予約語に関する要件を参照してください。

**2. `<query>`**

> マテリアライズドビューの構築に使用するクエリです。その結果がマテリアライズドビューのデータになります。現在サポートされているクエリの形式は次のとおりです。
>
> 構文はクエリステートメントの構文と同じです。
>
> - `select_expr`: マテリアライズドビューのスキーマに含まれるすべての列。
>   - 単一の列を少なくとも一つ含める必要があります。
> - `base_table`: マテリアライズドビューのベーステーブルの名前。必須です。
>   - サブクエリではなく、単一のテーブルである必要があります。
> - `where`: マテリアライズドビューのフィルタ条件。省略可能です。
>   - 指定しない場合、データはフィルタされません。
> - `group by`: マテリアライズドビューのグループ化列。省略可能です。
>   - 指定しない場合、データはグループ化されません。
> - `order by`: マテリアライズドビューのソート列。省略可能です。
>   - ソート列の宣言順序は、`select_expr` で宣言した列の順序と一致させる必要があります。
>   - `order by` を指定しない場合、規則に従ってソート列が自動的に追加されます。集約型のマテリアライズドビューでは、すべてのグループ化列がソート列として自動的に追加されます。非集約型のマテリアライズドビューでは、先頭の36バイトがソート列として自動的に追加されます。
>   - 自動的に追加されるソート列が3つ未満の場合、先頭の三つがソート列として使用されます。クエリにグループ化列が含まれる場合、ソート列はグループ化列と一致する必要があります。

## 必要な権限

| 権限       | オブジェクト | 備考 |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | テーブル     | 現在のマテリアライズドビューのベーステーブルに対する ALTER_PRIV 権限が必要です |

## 注意事項

- 同期マテリアライズドビューの SELECT リストにある列名は、ベーステーブルの既存の列名や、同じベーステーブル上のほかの同期マテリアライズドビューの列名と重複してはいけません。エイリアス（例: col as xxx）を指定すると、名前の競合を回避できます。
- 同期マテリアライズドビューでは、単一テーブルに対する SELECT ステートメントのみがサポートされます。WHERE、GROUP BY、ORDER BY 句は使用できますが、JOIN、HAVING、LIMIT 句および LATERAL VIEW は使用できません。
- SELECT リストには、自動インクリメント列、定数、重複する式、ウィンドウ関数を含めることはできません。
- SELECT リストに集約関数が含まれる場合、集約関数はルート式である必要があります（例: `sum(a + 1)` はサポートされますが、`sum(a) + 1` はサポートされません）。また、集約関数の後に、集約関数以外の関数式を置くことはできません（例: `SELECT x, sum(a)` は使用できますが、`SELECT sum(a), x` は使用できません）。
- 一つのテーブルにマテリアライズドビューを作成しすぎると、データのインポート効率に影響する場合があります。データをインポートすると、マテリアライズドビューとベーステーブルのデータが同期的に更新されます。マテリアライズドビューが多すぎる場合、一回のインポート操作で複数のテーブルに同時にデータをインポートする場合と同様に、インポート速度が低下することがあります。
- Unique Key データモデルを対象とするマテリアライズドビューでは、列の順序のみを変更でき、集約はできません。したがって、Unique Key モデルでは、マテリアライズドビューを作成してデータを粗い粒度に集約することはできません。
- Unique Key および Aggregate Key データモデルを対象とするマテリアライズドビューで WHERE 句を指定する場合、Key 列のみを使用でき、Value 列は使用できません。

## 例

準備: 以下の例では、標準的な TPC-H の `lineitem` ベーステーブルを使用します。

```sql
CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey      INT NOT NULL,
  l_partkey       INT NOT NULL,
  l_suppkey       INT NOT NULL,
  l_linenumber    INT NOT NULL,
  l_quantity      DECIMAL(15,2) NOT NULL,
  l_extendedprice DECIMAL(15,2) NOT NULL,
  l_discount      DECIMAL(15,2) NOT NULL,
  l_tax           DECIMAL(15,2) NOT NULL,
  l_returnflag    CHAR(1) NOT NULL,
  l_linestatus    CHAR(1) NOT NULL,
  l_shipdate      DATE NOT NULL,
  l_commitdate    DATE NOT NULL,
  l_receiptdate   DATE NOT NULL,
  l_shipinstruct  CHAR(25) NOT NULL,
  l_shipmode      CHAR(10) NOT NULL,
  l_comment       VARCHAR(44) NOT NULL
)
DUPLICATE KEY (l_orderkey, l_partkey, l_suppkey, l_linenumber)
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

```sql
desc lineitem;
```

```text
+-----------------+---------------+------+-------+---------+-------+
| Field           | Type          | Null | Key   | Default | Extra |
+-----------------+---------------+------+-------+---------+-------+
| l_orderkey      | int           | No   | true  | NULL    |       |
| l_partkey       | int           | No   | true  | NULL    |       |
| l_suppkey       | int           | No   | true  | NULL    |       |
| l_linenumber    | int           | No   | true  | NULL    |       |
| l_quantity      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_extendedprice | decimal(15,2) | No   | false | NULL    | NONE  |
| l_discount      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_tax           | decimal(15,2) | No   | false | NULL    | NONE  |
| l_returnflag    | char(1)       | No   | false | NULL    | NONE  |
| l_linestatus    | char(1)       | No   | false | NULL    | NONE  |
| l_shipdate      | date          | No   | false | NULL    | NONE  |
| l_commitdate    | date          | No   | false | NULL    | NONE  |
| l_receiptdate   | date          | No   | false | NULL    | NONE  |
| l_shipinstruct  | char(25)      | No   | false | NULL    | NONE  |
| l_shipmode      | char(10)      | No   | false | NULL    | NONE  |
| l_comment       | varchar(44)   | No   | false | NULL    | NONE  |
+-----------------+---------------+------+-------+---------+-------+
```

```sql
CREATE MATERIALIZED VIEW sync_agg_mv AS
SELECT 
  l_shipdate as shipdate,
  l_partkey as partkey,
  count(*),
  sum(l_discount)
FROM
  lineitem
GROUP BY
  l_shipdate,
  l_partkey;
```
