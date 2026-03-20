---
{
  "title": "数値",
  "language": "ja",
  "description": "constvalue の値を持つ number という列名の単一列のみを含む一時テーブルを生成するテーブル関数（条件："
}
---
## 説明

一時的なテーブルを生成するテーブル関数で、`number`という列名の列を1つだけ含み、`const_value`が指定されている場合はすべての要素値が`const_value`になり、指定されていない場合は[0,`number`)の範囲で増分されます。

## 構文

```sql
NUMBERS(
    "number" = "<number>"
    [, "<const_value>" = "<const_value>" ]
  );
```
## 必須パラメータ

| Field         | Description               |
|---------------|---------------------------|
| **number**    | 行数        |

## オプションパラメータ

| Field             | Description                              |
|-------------------|------------------------------------------|
| **const_value**   | 生成される定数値を指定   |



## 戻り値
| Field      | Type    | Description                     |
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
