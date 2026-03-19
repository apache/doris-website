---
{
  "title": "CREATE SYNC MATERIALIZED VIEW",
  "language": "ja",
  "description": "同期化マテリアライズドビューを作成するためのステートメント。"
}
---
## 説明

同期マテリアライズドビューを作成するためのステートメントです。

## 構文

```sql
CREATE MATERIALIZED VIEW <materialized_view_name> AS <query>            
```
どこで

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

> マテリアライズドビューの識別子（すなわち名前）を指定します。同期マテリアライズドビューはテーブルに基づいて作成されるため、名前は同じテーブル内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（Unicode名前サポートが有効な場合、任意の言語の任意の文字を使用可能）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含むことはできません。
>
> 識別子は予約キーワードにすることはできません。
>
> 詳細については、識別子と予約キーワードの要件を参照してください。

**2. `<query>`**

> マテリアライズドビューの構築に使用されるクエリ文で、その結果がマテリアライズドビューのデータを構成します。現在サポートされているクエリ形式は：
>
> 構文はクエリ文の構文と一致しています。
>
> - `select_expr`：マテリアライズドビューのスキーマ内のすべての列。
>   - 少なくとも1つの単一列を含む必要があります。
> - `base_table`：マテリアライズドビューのベーステーブルの名前、必須項目。
>   - 単一のテーブルである必要があり、サブクエリではありません。
> - `where`：マテリアライズドビューのフィルタ条件、オプション項目。
>   - 指定されない場合、データフィルタリングは実行されません。
> - `group by`：マテリアライズドビューのグループ化列、オプション項目。
>   - 指定されない場合、データはグループ化されません。
> - `order by`：マテリアライズドビューのソート列、オプション項目。
>   - ソート列の宣言順序は`select_expr`で宣言された列の順序と一致している必要があります。
>   - `order by`が宣言されていない場合、ルールに従ってソート列が自動的に補完されます。マテリアライズドビューが集約タイプの場合、すべてのグループ化列が自動的にソート列として追加されます。マテリアライズドビューが非集約タイプの場合、最初の36バイトが自動的にソート列として追加されます。
>   - 自動的に補完されるソート列の数が3未満の場合、最初の3つがソート列として使用されます。クエリにグループ化列が含まれている場合、ソート列はグループ化列と一致している必要があります。

## アクセス制御要件

| 権限       | オブジェクト | 注記                                                         |
| ---------- | ------------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table        | 現在のマテリアライズドビューのベーステーブルにALTER_PRIV権限が必要 |

## 注記

- 同期マテリアライズドビューは単一テーブルのSELECT文のみサポートし、WHERE、GROUP BY、ORDER BY句をサポートしますが、JOIN、HAVING、LIMIT句やLATERAL VIEWはサポートしません。
- SELECT リストには自動増分列、定数、重複式、またはウィンドウ関数を含めることはできません。
- SELECT リストに集約関数が含まれている場合、集約関数はルート式である必要があり（例：`sum(a + 1)`はサポートされますが、`sum(a) + 1`はサポートされません）、集約関数の後に他の非集約関数式を続けることはできません（例：`SELECT x, sum(a)`は許可されますが、`SELECT sum(a), x`は許可されません）。
- 単一テーブル上のマテリアライズドビューが多すぎると、データインポートの効率に影響を与える可能性があります：データをインポートする際、マテリアライズドビューとBaseテーブルのデータが同期的に更新されます。テーブル上にマテリアライズドビューが多すぎる場合、インポート速度が低下する可能性があり、これは単一のインポート操作で複数のテーブルに同時にデータをインポートすることに似ています。
- マテリアライズドビューがUnique Keyデータモデルを対象とする場合、列の順序のみ変更でき、集約を実行できません。したがって、Unique Keyモデルでは、マテリアライズドビューを作成してデータを粗く集約することはできません。
- マテリアライズドビューがUnique KeyおよびAggregate Keyデータモデルを対象とする場合、WHERE句が指定されている場合、Key列のみ使用でき、Value列は使用できません。

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
  l_shipdate,
  l_partkey,
  count(*),
  sum(l_discount)
FROM
  lineitem
GROUP BY
  l_shipdate,
  l_partkey;
```
