---
{
    "title": "CONVERT_TO",
    "language": "ja",
    "description": "列の文字コードを指定した文字セットに変換します。"
}
---

## 説明

列の文字コードを指定した文字セットに変換します。通常、ORDER BY 句で中国語の文字を含む列をピンイン順に並べるために使用します。現在は `'gbk'` への変換のみをサポートします。

## 構文

```sql
CONVERT_TO(<column>, <character>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<column>` | 文字コードを変換する VARCHAR 型の列。 |
| `<character>` | 変換先の文字セット。現在は `'gbk'` のみをサポートします。 |

## 戻り値

変換後の文字コードを持つ VARCHAR 値を返します。ORDER BY 句で使用すると、ピンイン順に並べられます。

## 例

<!-- setup-sql
CREATE TABLE class_test (class_id INT, class_name VARCHAR(50), student_ids ARRAY<INT>) DISTRIBUTED BY HASH(class_id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO class_test VALUES (1,'啊',[1]),(2,'哈',[2]),(3,'哦',[3]),(4,'张',[4]),(5,'我',[5]),(6,'asd',[6]),(7,'qwe',[7]),(8,'z',[8]);
-->

```sql
SELECT * FROM class_test ORDER BY class_name;
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        1 | 啊         | [1]         |
|        4 | 张         | [4]         |
|        5 | 我         | [5]         |
+----------+------------+-------------+
```

```sql
SELECT * FROM class_test ORDER BY CONVERT_TO(class_name, 'gbk');
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        1 | 啊         | [1]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        5 | 我         | [5]         |
|        4 | 张         | [4]         |
+----------+------------+-------------+
```