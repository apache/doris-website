---
{
  "title": "MERGE-INTO",
  "language": "ja",
  "description": "テーブル内の値を、第2のテーブルまたはサブクエリの値に基づいて挿入、更新、削除します。"
}
---
## 説明

2番目のテーブルまたはサブクエリの値に基づいて、テーブル内の値を挿入、更新、削除します。2番目のテーブルがターゲットテーブルの新しい行（挿入対象）、変更された行（更新対象）、またはマークされた行（削除対象）を含む変更ログである場合、マージが有用です。

このコマンドは、以下のケースを処理するためのセマンティクスをサポートしています：

- 一致する値（更新と削除用）
- 一致しない値（挿入用）

このコマンドのターゲットテーブルは、UNIQUE KEYモデルテーブルである必要があります。

## 構文

```sql
MERGE INTO <target_table>
    USING <source>
    ON <join_expr>
    { matchedClause | notMatchedClause } [ ... ]
```
どこで

```sql
matchedClause ::=
    WHEN MATCHED
        [ AND <case_predicate> ]
        THEN { UPDATE SET <col_name> = <expr> [ , <col_name> = <expr> ... ] | DELETE } 
```
```sql
notMatchedClause ::=
    WHEN NOT MATCHED
        [ AND <case_predicate> ]
        THEN INSERT [ ( <col_name> [ , ... ] ) ] VALUES ( <expr> [ , ... ] )
```
## パラメータ

**\<target_table\>**

> マージするテーブルを指定します。

**\<source\>**

> ターゲットテーブルと結合するテーブルまたはサブクエリを指定します。

**\<join_expr\>**

> ターゲットテーブルとソースを結合する条件式を指定します。

### matchedClause (更新または削除用)

**WHEN MATCHED ... AND \<case_predicate\>**

> オプションで、trueの場合にマッチングケースが実行される条件式を指定します。  
> デフォルト: 値なし（マッチングケースは常に実行される）

**WHEN MATCHED ... THEN { UPDATE SET ... | DELETE }**

> 値がマッチした場合に実行するアクションを指定します。

**SET col_name = expr [ , col_name = expr ... ]**

> 新しい列値の対応する式を使用して、ターゲットテーブルの指定された列を更新します（ターゲットとソースの両方のリレーションを参照可能）。  
> 単一のSETサブ句では、更新する複数の列を指定できます。

**DELETE**

> ソースとマッチするターゲットテーブルの行を削除します。

### notMatchedClause (挿入用)

**WHEN NOT MATCHED ... AND \<case_predicate\>**

> オプションで、trueの場合に非マッチングケースが実行される条件式を指定します。
> デフォルト: 値なし（非マッチングケースは常に実行される）

**WHEN NOT MATCHED ... THEN INSERT [ ( col_name [ , ... ] ) ] VALUES ( expr [ , ... ] )**

> 値がマッチしない場合に実行するアクションを指定します。

**( col_name [ , ... ] )**

> オプションで、ソースからの値で挿入されるターゲットテーブルの1つ以上の列を指定します。
> デフォルト: 値なし（ターゲットテーブルのすべての列が挿入される）

**VALUES ( expr [ , ... ] )**

> 挿入される列値の対応する式を指定します（ソースリレーションを参照する必要があります）。

## アクセス制御要件

このSQLコマンドを実行する[user](../../../../admin-manual/auth/authentication-and-authorization.md)は、最低限以下の[privileges](../../../../admin-manual/auth/authentication-and-authorization.md)を持っている必要があります：

| Privilege | Object | Description |
| :---------------- | :------------ | :- |
| SELECT_PRIV       | target table and source |  |
| LOAD_PRIV       | target table |  |

## 使用上の注意

- このコマンドのターゲットテーブルはUNIQUE KEYモデルテーブルである必要があります。
- 単一のMERGE文には、複数のマッチング句と非マッチング句（つまり、WHEN MATCHED ...とWHEN NOT MATCHED ...）を含めることができます。
- ANDサブ句を省略する（デフォルト動作）マッチング句または非マッチング句は、文内でそのタイプの句の最後でなければなりません（例えば、WHEN MATCHED ...句の後にWHEN MATCHED AND ...句を続けることはできません）。これを行うと到達不可能なケースになり、エラーが返されます。

### 重複結合の動作¶

現在、Dorisは重複する結合行が発生するかどうかを検出しません。発生した場合、動作は未定義です。

結合後、同じターゲットテーブル行に対して複数の操作（更新、削除、または挿入など）が同時に適用される場合、動作はINSERT文と同様になります：Sequence列が存在する場合、最終的に書き込まれるデータはSequence列の値によって決定されます。そうでない場合、いずれかの行が任意に書き込まれます。

## 例

以下の例は、ソーステーブルの値を使用してターゲットテーブルのデータを更新する、基本的なマージ操作を実行します。まず、2つのテーブルを作成してロードします：

```sql
CREATE TABLE `merge_into_source_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

CREATE TABLE `merge_into_target_base_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    UNIQUE KEY(`c1`)
    DISTRIBUTED BY HASH(`c1`)
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

INSERT INTO merge_into_source_table VALUES (1, 12), (2, 22), (3, 33);
INSERT INTO merge_into_target_base_table VALUES (1, 1), (2, 10);
```
テーブル内の値を表示する：

```sql
SELECT * FROM merge_into_source_table;
```
```
+----+----+
| c1 | c2 |
+----+----+
| 1  | 12 |
| 2  | 22 |
| 3  | 33 |
+----+----+
```
```sql
SELECT * FROM merge_into_target_base_table;
```
```
+----+----+
| c1 | c2 |
+----+----+
| 2  | 10 |
| 1  | 1  |
+----+----+
```
MERGE文を実行します：

```sql
WITH tmp AS (SELECT * FROM merge_into_source_table)
MERGE INTO merge_into_target_base_table t1
    USING tmp t2
    ON t1.c1 = t2.c1
    WHEN MATCHED AND t1.c2 = 10 THEN DELETE
    WHEN MATCHED THEN UPDATE SET c2 = 10
    WHEN NOT MATCHED THEN INSERT VALUES(t2.c1, t2.c2)
```
ターゲットテーブルに新しい値を表示します（ソーステーブルは変更されません）：

```sql
SELECT * FROM merge_into_target_base_table;
```
```
+----+----+
| c1 | c2 |
+----+----+
| 3  | 33 |
| 1  | 10 |
+----+----+
```
