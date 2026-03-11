---
{
  "title": "SHOW COLLATION",
  "description": "Dorisでは、SHOW COLLATIONコマンドはデータベースで利用可能な文字セット照合順序を表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

Dorisでは、SHOW COLLATIONコマンドはデータベースで利用可能な文字セットの照合順序を表示するために使用されます。照合順序とは、データがどのようにソートされ比較されるかを決定するルールのセットです。これらのルールは文字データの保存と取得に影響を与えます。

## Syntax

```sql
SHOW COLLATION
```
## 戻り値

| column name | description  |
| -- |--------------|
| Collation | 照合順序名         |
| Charset | 文字セット          |
| Id | 照合順序のID        |
| Default | この文字セットのデフォルト照合順序かどうか |
| Compiled | 照合順序がコンパイルされているかどうか        |
| Sortlen | ソート長         |



## 使用上の注意

Dorisでは、MySQLの照合順序設定コマンドと互換性がありますが、実際には効果がありません。実行時には、utf8mb4_0900_binが常に比較ルールとして使用されます。

## 例

```sql
SHOW COLLATION;
```
```text
+--------------------+---------+------+---------+----------+---------+
| Collation          | Charset | Id   | Default | Compiled | Sortlen |
+--------------------+---------+------+---------+----------+---------+
| utf8mb4_0900_bin   | utf8mb4 |  309 | Yes     | Yes      |       1 |
| utf8mb3_general_ci | utf8mb3 |   33 | Yes     | Yes      |       1 |
+--------------------+---------+------+---------+----------+---------+
```
