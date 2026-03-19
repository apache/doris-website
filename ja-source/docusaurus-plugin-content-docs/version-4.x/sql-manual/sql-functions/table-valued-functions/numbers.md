---
{
  "title": "数値",
  "description": "constvalue が設定された場合に、column名がnumberで、すべての要素値がconstvalueである1つの列のみを含む一時tableを生成するtable関数",
  "language": "ja"
}
---
## 説明

`number`という列名の1つの列のみを含む一時tableを生成するtable関数です。`const_value`が指定されている場合、すべての要素値は`const_value`になり、そうでない場合は[0,`number`)の範囲で増分されます。

## 構文

```sql
NUMBERS(
    "number" = "<number>"
    [, "<const_value>" = "<const_value>" ]
  );
```
## 必須パラメータ

| Field         | デスクリプション               |
|---------------|---------------------------|
| **number**    | 行数        |

## オプションパラメータ

| Field             | デスクリプション                              |
|-------------------|------------------------------------------|
| **const_value**   | 生成される定数値を指定   |



## 戻り値
| Field      | タイプ    | デスクリプション                     |
|----------------|---------|---------------------------------|
| **number**     | BIGINT  | 各行に対して返される値 |


## 例

```sql
select * from numbers("number" = "5");
```
```text
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
```
```sql
select * from numbers("number" = "5", "const_value" = "-123");
```
```text
+--------+
| number |
+--------+
|   -123 |
|   -123 |
|   -123 |
|   -123 |
|   -123 |
+--------+
```
