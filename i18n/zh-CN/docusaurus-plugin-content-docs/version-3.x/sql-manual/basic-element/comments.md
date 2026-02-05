---
{
    "title": "注释",
    "language": "zh-CN",
    "description": "注释可以使您的应用程序更易于阅读和维护。例如，可以在语句中包含一个注释，描述该语句在应用程序中的用途。SQL 语句中的注释（HINT 除外）不会影响语句的执行。有关使用这种特定形式的注释的 HINT，请参阅“HINT”章节。"
}
---

## 描述

注释可以使您的应用程序更易于阅读和维护。例如，可以在语句中包含一个注释，描述该语句在应用程序中的用途。SQL 语句中的注释（HINT 除外）不会影响语句的执行。有关使用这种特定形式的注释的 HINT，请参阅“HINT”章节。

在 SQL 语句中，注释可以出现在任何关键字、参数或标点符号之间。您可以通过两种方式在语句中包含注释：

- 多行注释：以斜杠和星号（/*）开始注释，接着是注释的文本。这个文本可以跨越多行。以星号和斜杠（*/）结束注释。开始和结束字符与文本之间不需要用空格或换行符分隔。
- 单行注释：以两个连字符（--）开始注释，接着是注释的文本。这个文本不能延伸到新行。注释以换行符结束。

## 示例

### 多行注释

```sql
SELECT /* This is a multi-line comment
          that can span multiple lines */
       column_name
FROM   table_name;
```

### 单行注释

```sql
SELECT column_name -- This is a single-line comment
FROM   table_name;
```