---
{
  "title": "WEEKOFYEAR",
  "language": "ja",
  "description": "年の週を取得する"
}
---
## weekofyear
### 説明
#### 構文

`INT WEEKOFYEAR (DATETIME DATE)`



年の週数を取得する

パラメータはDateまたはDatetime型

### 例

```
mysql> select weekofyear('2008-02-20 00:00:00');
+-----------------------------------+
| weekofyear('2008-02-20 00:00:00') |
+-----------------------------------+
|                                 8 |
+-----------------------------------+
```
### keywords
    WEEKOFYEAR
