---
{
    "title": "HAMMING_DISTANCE",
    "language": "ja",
    "description": "HAMMING_DISTANCE 関数は、長さが等しい二つの文字列について、文字が異なる位置の数を返します。"
}
---

## 説明
`HAMMING_DISTANCE` 関数は、長さが等しい二つの文字列について、文字が異なる位置の数を返します。

この関数は UTF-8 の文字単位で数えます。

## 構文
```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## パラメータ
| パラメータ | 説明 |
| -- | -- |
| `<str1>` | 最初の文字列 |
| `<str2>` | 二番目の文字列 |

## 戻り値
BIGINT 値を返します。

## 例
```sql
SELECT hamming_distance('karolin', 'kathrin'); -- 3
SELECT hamming_distance('数据库', '数据仓');   -- 1
```

## 注意事項
- 二つの文字列は同じ長さでなければなりません。長さが異なる場合はエラーが返されます。
- UTF-8 文字をサポートします。
- 入力が NULL の場合は NULL を返します。
