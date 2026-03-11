---
{
  "title": "WEEKOFYEAR",
  "description": "年の週を取得する",
  "language": "ja"
}
---
## weekofyear
### 説明
#### 構文

`INT WEEKOFYEAR (DATETIME DATE)`



年の週数を取得します

パラメータはDate型またはDatetime型です

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
