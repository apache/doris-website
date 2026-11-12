---
{
    "title": "CONVERT_TO",
    "language": "en"
}
---

<version since="1.2">

## convert_to
### description
#### Syntax

`VARCHAR convert_to(VARCHAR column, VARCHAR character)`

It is used in the order by clause. eg: order by convert(column using gbk), Now only support character can be converted to 'gbk'.
Because when the order by column contains Chinese, it is not arranged in the order of Pinyin
After the character encoding of column is converted to gbk, it can be arranged according to pinyin

</version>

### example

```
mysql> select * from class_test order by class_name;
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

mysql> select * from class_test order by convert(class_name using gbk);
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
### keywords
    convert_to
