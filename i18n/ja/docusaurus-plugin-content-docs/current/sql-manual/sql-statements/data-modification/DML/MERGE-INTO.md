---
{
    "title": "MERGE-INTO",
    "language": "ja",
    "description": "別のテーブルまたはサブクエリの値に基づいて、テーブル内の値を挿入、更新、削除します。"
}
---

## 説明

別のテーブルまたはサブクエリの値に基づいて、テーブル内の値を挿入、更新、削除します。もう一方のテーブルが、ターゲットテーブルに挿入する新規行、更新する変更済み行、または削除対象としてマークされた行を含む変更ログである場合、マージが役立ちます。

このコマンドは、次の場合を処理できます。

- 値が一致する場合（更新と削除）。
- 値が一致しない場合（挿入）。

このコマンドのターゲットテーブルは、UNIQUE KEY モデルのテーブルである必要があります。

## 構文

```sql
MERGE INTO <target_table>
    USING <source>
    ON <join_expr>
    { matchedClause | notMatchedClause } [ ... ]
```

各句の定義は次のとおりです。

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

> マージ先のテーブルを指定します。


**\<source\>**

> ターゲットテーブルと結合するテーブルまたはサブクエリを指定します。

**\<join_expr\>**

> ターゲットテーブルとソースを結合するための式を指定します。

### matchedClause（更新または削除）

**WHEN MATCHED ... AND \<case_predicate\>**

> 一致した場合に実行する句を決める式を指定します（省略可能）。式が真の場合、その句が実行されます。  
> デフォルト：指定なし（一致した場合の句は常に実行されます）

**WHEN MATCHED ... THEN { UPDATE SET ... | DELETE }**

> 値が一致した場合に実行する操作を指定します。

**SET col_name = expr [ , col_name = expr ... ]**

> 対応する式を新しい列の値として使用し、ターゲットテーブルの指定した列を更新します（式からはターゲットとソースの両方を参照できます）。  
> 単一の SET 句では、更新する列を複数指定できます。

**DELETE**

> ソースと一致したターゲットテーブルの行を削除します。

### notMatchedClause（挿入）

**WHEN NOT MATCHED ... AND \<case_predicate\>**

> 一致しない場合に実行する句を決める式を指定します（省略可能）。式が真の場合、その句が実行されます。
> デフォルト：指定なし（一致しない場合の句は常に実行されます）

**WHEN NOT MATCHED ... THEN INSERT [ ( col_name [ , ... ] ) ] VALUES ( expr [ , ... ] )**

> 値が一致しない場合に実行する操作を指定します。

**( col_name [ , ... ] )**

> ソースの値を挿入するターゲットテーブルの列を一つ以上指定します（省略可能）。
> デフォルト：指定なし（ターゲットテーブルのすべての列に挿入します）

**VALUES ( expr [ , ... ] )**

> 挿入する列の値に対応する式を指定します（ソースを参照する必要があります）。

## アクセス制御要件

この SQL コマンドを実行する[ユーザー](../../../../admin-manual/auth/authentication-and-authorization.md)には、少なくとも次の[権限](../../../../admin-manual/auth/authentication-and-authorization.md)が必要です。

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------ | :- |
| SELECT_PRIV       | ターゲットテーブルとソース |  |
| LOAD_PRIV       | ターゲットテーブル |  |

## 使用上の注意

- このコマンドのターゲットテーブルは、UNIQUE KEY モデルのテーブルである必要があります。
- 単一の MERGE 文に、一致する場合と一致しない場合の句（WHEN MATCHED ... と WHEN NOT MATCHED ...）をそれぞれ複数含めることができます。
- AND 句を省略した句（デフォルトの動作）は、同じ種類の句の中で最後に置く必要があります。たとえば、WHEN MATCHED ... 句の後に WHEN MATCHED AND ... 句を置くことはできません。後続の句に到達できなくなるため、エラーが返されます。

### 重複する結合行の動作

現時点で Doris は、結合結果に重複行があるかどうかを検出しません。重複行がある場合の動作は未定義です。

結合後、同じターゲットテーブルの行に複数の操作（更新、削除、挿入など）が同時に適用される場合の動作は、INSERT 文と同様です。Sequence 列が存在する場合、最終的に書き込まれるデータは Sequence 列の値によって決まります。存在しない場合は、いずれかの行が任意に書き込まれます。

## 例

次の例では、ソーステーブルの値を使用してターゲットテーブルのデータを更新する、基本的なマージ操作を実行します。まず、両方のテーブルを作成してデータを挿入します。

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

テーブル内の値を表示します。

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

MERGE 文を実行します。

```sql
WITH tmp AS (SELECT * FROM merge_into_source_table)
MERGE INTO merge_into_target_base_table t1
    USING tmp t2
    ON t1.c1 = t2.c1
    WHEN MATCHED AND t1.c2 = 10 THEN DELETE
    WHEN MATCHED THEN UPDATE SET c2 = 10
    WHEN NOT MATCHED THEN INSERT VALUES(t2.c1, t2.c2)
```

ターゲットテーブルの新しい値を表示します（ソーステーブルは変更されません）。


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
