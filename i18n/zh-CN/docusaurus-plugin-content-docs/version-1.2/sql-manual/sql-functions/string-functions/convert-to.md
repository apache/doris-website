---
{
    "title": "CONVERT_TO",
    "language": "zh-CN"
}
---

<version since="1.2">

## convert_to
## 描述
## 语法

`VARCHAR convert_to(VARCHAR column, VARCHAR character)`
在order by子句中使用，例如order by convert(column using gbk), 现在仅支持character转为'gbk'.
因为当order by column中包含中文时，其排列不是按照汉语拼音的顺序.
将column的字符编码转为gbk后，可实现按拼音的排列的效果.

</version>

## 举例

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
