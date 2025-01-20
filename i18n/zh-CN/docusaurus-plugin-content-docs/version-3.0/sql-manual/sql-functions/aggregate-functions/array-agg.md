---
{
"title": "ARRAY_AGG",
"language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

将一列中的值（包括空值 null）串联成一个数组，可以用于多行转一行（行转列）。

## 语法

```sql
ARRAY_AGG(<col>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 确定要放入数组的值的表达式（通常是列名） |

## 返回值

返回 ARRAY 类型的值。

## 举例

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

## 注意事项

- 数组中元素不保证顺序。
- 返回转换生成的数组。数组中的元素类型与 `col` 类型一致。

