---
{
  "title": "MERGE-INTO",
  "description": "第2のtableまたはサブクエリの値に基づいて、table内の値を挿入、更新、および削除します。",
  "language": "ja"
}
---
## 説明

セカンドtableまたはサブクエリの値に基づいて、tableの値を挿入、更新、削除します。セカンドtableがターゲットtableに挿入する新しい行、更新する変更された行、または削除するマークされた行を含む変更ログである場合、マージは有用です。

このコマンドは以下のケースを処理するためのセマンティクスをサポートします：

- 一致する値（更新と削除用）
- 一致しない値（挿入用）

このコマンドのターゲットtableはUNIQUE KEYモデルtableである必要があります。

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

> マージ対象のTableを指定します。

**\<source\>**

> ターゲットTableと結合するTableまたはサブクエリを指定します。

**\<join_expr\>**

> ターゲットTableとソースを結合する際の式を指定します。

### matchedClause（更新または削除用）

**WHEN MATCHED ... AND \<case_predicate\>**

> オプションで式を指定します。この式がtrueの場合、マッチングケースが実行されます。  
> デフォルト: 値なし（マッチングケースは常に実行されます）

**WHEN MATCHED ... THEN { UPDATE SET ... | DELETE }**

> 値がマッチした場合に実行するアクションを指定します。

**SET col_name = expr [ , col_name = expr ... ]**

> 新しいカラム値の対応する式を使用して、ターゲットTableの指定されたカラムを更新します（ターゲットとソースの両方のリレーションを参照できます）。  
> 単一のSETサブクローズでは、複数のカラムを更新対象として指定できます。

**DELETE**

> ソースとマッチした場合に、ターゲットTableの行を削除します。

### notMatchedClause（挿入用）

**WHEN NOT MATCHED ... AND \<case_predicate\>**

> オプションで式を指定します。この式がtrueの場合、非マッチングケースが実行されます。
> デフォルト: 値なし（非マッチングケースは常に実行されます）

**WHEN NOT MATCHED ... THEN INSERT [ ( col_name [ , ... ] ) ] VALUES ( expr [ , ... ] )**

> 値がマッチしない場合に実行するアクションを指定します。

**( col_name [ , ... ] )**

> オプションで、ソースから値を挿入するターゲットTableの1つ以上のカラムを指定します。
> デフォルト: 値なし（ターゲットTableの全カラムが挿入されます）

**VALUES ( expr [ , ... ] )**

> 挿入されるカラム値の対応する式を指定します（ソースリレーションを参照する必要があります）。

## Access Control Requirements

このSQLコマンドを実行するユーザーは、最低でも以下の権限を持つ必要があります：

| Privilege | Object | デスクリプション |
| :---------------- | :------------ | :- |
| SELECT_PRIV       | target table and source |  |
| LOAD_PRIV       | target table |  |

## Usage Note

- このコマンドのターゲットTableはUNIQUE KEYモデルTableである必要があります。
- 単一のMERGE文では、複数のマッチングおよび非マッチング句を含めることができます（つまり、WHEN MATCHED ... および WHEN NOT MATCHED ...）。
- ANDサブクローズを省略したマッチングまたは非マッチング句（デフォルト動作）は、文中でそのクローズタイプの最後でなければなりません（例えば、WHEN MATCHED ... 句の後にWHEN MATCHED AND ... 句を続けることはできません）。このようにすると到達不可能なケースとなり、エラーが返されます。

### 重複結合の動作¶

現在、Dorisは重複する結合行が発生するかどうかを検出しません。重複が発生した場合、動作は未定義です。

結合後に、同一のターゲットTable行に対して複数の操作（更新、削除、または挿入など）が同時に適用される場合、動作はINSERT文と類似します：Sequenceカラムが存在する場合、最終的に書き込まれるデータはSequenceカラムの値によって決定されます。存在しない場合は、いずれかの行が任意に書き込まれます。

## Examples

以下の例では、基本的なマージ操作を実行し、ソースTableの値を使用してターゲットTableのデータを更新します。まず、2つのTableを作成してロードします：

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
Table内の値を表示します：

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
ターゲットTableに新しい値を表示します（ソースTableは変更されません）：

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
