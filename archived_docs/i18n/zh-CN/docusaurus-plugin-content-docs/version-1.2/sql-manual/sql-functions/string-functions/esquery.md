---
{
    "title": "ESQUERY",
    "language": "zh-CN"
}
---

## esquery
## 描述
## 语法

`boolean esquery(varchar field, varchar QueryDSL)`

通过esquery(field, QueryDSL)函数将一些无法用sql表述的query如match_phrase、geoshape等下推给Elasticsearch进行过滤处理.
esquery的第一个列名参数用于关联index，第二个参数是ES的基本Query DSL的json表述，使用花括号{}包含，json的root key有且只能有一个，
如match_phrase、geo_shape、bool等

## 举例

```
match_phrase查询：

select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');


geo相关查询：

select * from es_table where esquery(k4, '{
      "geo_shape": {
         "location": {
            "shape": {
               "type": "envelope",
               "coordinates": [
                  [
                     13,
                     53
                  ],
                  [
                     14,
                     52
                  ]
               ]
            },
            "relation": "within"
         }
      }
   }');
```

### keywords
    esquery
