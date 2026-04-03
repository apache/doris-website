---
{
  "title": "CREATE SYNC MATERIALIZED VIEW",
  "language": "ja",
  "description": "同期マテリアライズドビューを作成するためのステートメント。"
}
---
## 説明

同期化されたマテリアライズドビューを作成するためのステートメント。

## 構文

```sql
CREATE MATERIALIZED VIEW <materialized_view_name> [AS] <query>            
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

> マテリアライズドビューの識別子（つまり、名前）を指定します。同期マテリアライズドビューはテーブルに基づいて作成されるため、名前は同一テーブル内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（Unicode名前サポートが有効な場合は、任意の言語の任意の文字を使用可能）、識別子文字列全体がバッククォートで囲まれていない限り、スペースや特殊文字を含むことはできません（例：`My Object`）。
>
> 識別子は予約キーワードにすることはできません。
>
> 詳細については、識別子と予約キーワードの要件を参照してください。

**2. `<query>`**

> マテリアライズドビューを構築するために使用されるクエリ文。その結果がマテリアライズドビューのデータを構成します。現在サポートされているクエリ形式は以下の通りです：
>
> 構文はクエリ文の構文と一致しています。
>
> - `select_expr`：マテリアライズドビューのスキーマ内のすべての列。
>   - 少なくとも1つの単一列を含む必要があります。
> - `base_table`：マテリアライズドビューのベーステーブルの名前。必須項目です。
>   - 単一のテーブルである必要があり、サブクエリではありません。
> - `where`：マテリアライズドビューのフィルタ条件。オプション項目です。
>   - 指定されていない場合、データフィルタリングは実行されません。
> - `group by`：マテリアライズドビューのグループ化列。オプション項目です。
>   - 指定されていない場合、データはグループ化されません。
> - `order by`：マテリアライズドビューのソート列。オプション項目です。
>   - ソート列の宣言順序は、`select_expr`で宣言された列の順序と一致している必要があります。
>   - `order by`が宣言されていない場合、ルールに従ってソート列が自動的に補完されます。マテリアライズドビューが集約タイプの場合、すべてのグループ化列が自動的にソート列として追加されます。マテリアライズドビューが非集約タイプの場合、最初の36バイトが自動的にソート列として追加されます。
>   - 自動補完されたソート列の数が3未満の場合、最初の3つがソート列として使用されます。クエリにグループ化列が含まれている場合、ソート列はグループ化列と一致している必要があります。

## アクセス制御要件

| 権限       | オブジェクト | 備考                                                         |
| ---------- | ------------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table        | 現在のマテリアライズドビューのベーステーブルに対するALTER_PRIV権限が必要 |

## 注意事項

- 同期マテリアライズドビューのselectリスト内の列名は、ベーステーブルの既存の列と同じであってはならず、同じベーステーブル上の他の同期マテリアライズドビューの列名と重複してもいけません。エイリアスを指定することで名前の競合を回避できます（例：col as xxx）。
- 同期マテリアライズドビューは単一テーブルに対するSELECT文のみをサポートし、WHERE、GROUP BY、ORDER BY句をサポートしますが、JOIN、HAVING、LIMIT句やLATERAL VIEWはサポートしません。
- SELECTリストには自動インクリメント列、定数、重複した式、またはウィンドウ関数を含めることはできません。
- SELECTリストに集約関数が含まれている場合、集約関数はルート式である必要があり（例：`sum(a + 1)`はサポートされていますが、`sum(a) + 1`はサポートされていません）、集約関数の後に他の非集約関数式を続けることはできません（例：`SELECT x, sum(a)`は許可されますが、`SELECT sum(a), x`は許可されません）。
- 単一テーブル上にマテリアライズドビューが多すぎると、データインポートの効率に影響を与える可能性があります：データをインポートする際、マテリアライズドビューとBaseテーブルのデータが同期的に更新されます。テーブル上にマテリアライズドビューが多すぎると、単一のインポート操作で複数のテーブルに同時にデータをインポートするのと同様に、インポート速度が低下する可能性があります。
- マテリアライズドビューがUnique Keyデータモデルを対象とする場合、列の順序の変更のみが可能で、集約を実行することはできません。したがって、Unique Keyモデルでは、マテリアライズドビューを作成することでデータを粗く集約することはできません。
- マテリアライズドビューがUnique KeyおよびAggregate Keyデータモデルを対象とする場合、WHERE句が指定された際は、Key列のみを使用でき、Value列は使用できません。

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
