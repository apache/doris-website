---
{
  "title": "ARRAY_AGG",
  "description": "列内の値（null値を含む）を配列に連結し、行を列にピボットするために使用できます。",
  "language": "ja"
}
---
## 説明

列の値（null値を含む）を配列に連結します。これは行を列にピボットする際に使用できます。

## 構文

```sql
ARRAY_AGG(<col>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | 配列に配置される値を決定する式（通常は列名）。 |

## Return Value

ARRAY型の値を返します。特殊ケース：

- 配列内の要素の順序は保証されません。
- 変換によって生成された配列を返します。配列内の要素の型はcolの型と一致します。


## Example

```sql
select * from test_doris_array_agg;
```
```text
+------+------+

| c1   | c2   |

+------+------+

|    1 | a    |

|    1 | b    |

|    2 | c    |

|    2 | NULL |

|    3 | NULL |

+------+------+
```
```sql
select c1, array_agg(c2) from test_doris_array_agg group by c1;
```
```text
+------+-----------------+

| c1   | array_agg(`c2`) |

+------+-----------------+

|    1 | ["a","b"]       |

|    2 | [NULL,"c"]      |

|    3 | [NULL]          |

+------+-----------------+
```
