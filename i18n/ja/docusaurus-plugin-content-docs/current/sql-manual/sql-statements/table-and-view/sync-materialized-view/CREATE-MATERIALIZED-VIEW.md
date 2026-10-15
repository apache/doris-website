---
{
    "title": "CREATE SYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "同期マテリアライズドビューを作成する文です。"
}
---

## 説明

同期マテリアライズドビューを作成する文です。

## 構文

```sql
CREATE MATERIALIZED VIEW <materialized_view_name> [AS] <query>            
```

クエリの形式は次のとおりです。

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

> マテリアライズドビューの識別子（名前）を指定します。同期マテリアライズドビューはテーブルを基に作成するため、同じテーブル内で名前が一意である必要があります。
>
> 識別子は英字で始める必要があります（Unicode 名のサポートが有効な場合は、任意の言語の文字で始めることができます）。識別子全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My Object`）。
>
> 識別子に予約語は使用できません。
>
> 詳細は、識別子と予約語の要件を参照してください。

**2. `<query>`**

> マテリアライズドビューの構築に使用するクエリ文です。その結果がマテリアライズドビューのデータになります。現在サポートされているクエリの形式は次のとおりです。
>
> 構文は通常のクエリ文と同じです。
>
> - `select_expr`: マテリアライズドビューのスキーマに含まれるすべての列です。
>   - 少なくとも一つは単一の列を指定する必要があります。
> - `base_table`: マテリアライズドビューの基となるテーブル名で、必須です。
>   - サブクエリではなく、単一のテーブルを指定する必要があります。
> - `where`: マテリアライズドビューのフィルター条件で、省略できます。
>   - 省略すると、データはフィルタリングされません。
> - `group by`: マテリアライズドビューのグループ化列で、省略できます。
>   - 省略すると、データはグループ化されません。
> - `order by`: マテリアライズドビューのソート列で、省略できます。
>   - ソート列の宣言順は、`select_expr` で宣言した列の順序と一致する必要があります。
>   - `order by` を指定しない場合は、規則に従ってソート列が自動的に補われます。集約型のマテリアライズドビューでは、すべてのグループ化列がソート列として自動的に追加されます。非集約型のマテリアライズドビューでは、先頭の36バイトがソート列として自動的に追加されます。
>   - 自動的に補われるソート列が3列未満の場合は、先頭の三列がソート列として使用されます。クエリにグループ化列が含まれる場合、ソート列はグループ化列と一致する必要があります。

## 必要な権限

| 権限 | 対象 | 説明 |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | テーブル | 現在のマテリアライズドビューの基となるテーブルに対する ALTER_PRIV 権限が必要です。 |

## 注意事項

- 同期マテリアライズドビューの SELECT リストに指定する列名は、基となるテーブルの既存の列名とも、同じテーブル上にある他の同期マテリアライズドビューの列名とも重複できません。別名を指定すると名前の競合を回避できます（例: col as xxx）。
- 同期マテリアライズドビューでは、単一テーブルに対する SELECT 文のみをサポートします。WHERE、GROUP BY、ORDER BY 句は使用できますが、JOIN、HAVING、LIMIT 句および LATERAL VIEW は使用できません。
- SELECT リストには、自動インクリメント列、定数、重複する式、ウィンドウ関数を含めることはできません。
- SELECT リストに集約関数を含める場合、集約関数は式のルートである必要があります（例: `sum(a + 1)` は使用できますが、`sum(a) + 1` は使用できません）。また、集約関数の後に、集約関数以外の関数式を置くことはできません（例: `SELECT x, sum(a)` は使用できますが、`SELECT sum(a), x` は使用できません）。
- 単一のテーブルにマテリアライズドビューを多数作成すると、データのインポート効率に影響する場合があります。インポート時には、マテリアライズドビューと基となるテーブルのデータが同期して更新されます。マテリアライズドビューが多い場合、一度のインポート操作で複数のテーブルに同時にデータをインポートする場合と同様に、インポート速度が低下することがあります。
- Unique Key データモデルを対象とするマテリアライズドビューでは、列の順序のみを変更でき、集約は実行できません。したがって、Unique Key モデルでは、マテリアライズドビューの作成によってデータを粗い粒度に集約することはできません。
- Unique Key および Aggregate Key データモデルを対象とするマテリアライズドビューで WHERE 句を指定する場合、使用できるのは Key 列のみで、Value 列は使用できません。

## 例

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
