---
{
    "title": "ESQUERY",
    "language": "en"
}
---

## esquery
### description
#### Syntax

`boolean esquery(varchar field, varchar QueryDSL)`

Use the esquery (field, QueryDSL) function to match queries that cannot be expressed in SQL are pushed down to Elasticsearch for filtering. 
The first column name parameter of esquery is used to associate indexes, and the second parameter is the json expression of the basic query DSL of ES, which is contained in curly brackets {}. There is one and only one root key of json, such as match_phrase、geo_Shape, bool.

### example

```
match_phrase SQL:

select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');


geo SQL:

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
