---
{
    "title": "DAMERAU_LEVENSHTEIN_DISTANCE",
    "language": "ja",
    "description": "DAMERAU_LEVENSHTEIN_DISTANCE 関数は、2 つの文字列間のダメラウ・レーベンシュタイン編集距離を計算します。"
}
---

## 説明

`DAMERAU_LEVENSHTEIN_DISTANCE` 関数は、二つの文字列間の[ダメラウ・レーベンシュタイン編集距離](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance)を計算します。

ダメラウ・レーベンシュタイン編集距離は、ある文字列を別の文字列に変換するために必要な、一文字単位の編集操作の最小回数です。次の編集操作をサポートします。

- 文字の挿入
- 文字の削除
- 文字の置換
- 隣接する二文字の入れ替え

`LEVENSHTEIN` と異なり、`DAMERAU_LEVENSHTEIN_DISTANCE` は隣接する文字の入れ替えを一回の編集操作として扱うため、文字の順序を逆に入力した誤りの処理に適しています。たとえば、`abcd` を `abdc` に変換するには、隣接する `c` と `d` を入れ替えるだけで済みます。そのため、ダメラウ・レーベンシュタイン距離は 1、レーベンシュタイン距離は 2 です。

この関数は、バイト単位ではなく UTF-8 の文字単位で距離を計算します。そのため、中国語の文字など、複数バイトで表される文字も一文字として扱います。

## 構文

```sql
DAMERAU_LEVENSHTEIN_DISTANCE(<str1>, <str2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<str1>` | 第一引数の文字列。型: VARCHAR |
| `<str2>` | 第二引数の文字列。型: VARCHAR |

## 戻り値

二つの文字列間のダメラウ・レーベンシュタイン編集距離を表す INT 値を返します。

特殊なケース:

- いずれかの引数が NULL の場合は、NULL を返します。
- 二つの文字列が同じ場合は、0 を返します。
- 片方の文字列が空の場合は、もう一方の文字列の文字数を返します。
- この関数は対称的です。つまり、`DAMERAU_LEVENSHTEIN_DISTANCE(a, b)` と `DAMERAU_LEVENSHTEIN_DISTANCE(b, a)` は同じ結果を返します。
- 入力が大きすぎて内部の距離行列が上限を超える場合は、エラーを返します。

## 例

1. 基本的な使い方

```sql
SELECT damerau_levenshtein_distance('kitten', 'sitting');
```

```text
+---------------------------------------------------+
| damerau_levenshtein_distance('kitten', 'sitting') |
+---------------------------------------------------+
|                                                 3 |
+---------------------------------------------------+
```

2. 隣接する文字の入れ替え

```sql
SELECT damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+----------------------------------------------+
| damerau_levenshtein_distance('abcd', 'abdc') |
+----------------------------------------------+
|                                            1 |
+----------------------------------------------+
```

`abcd` を `abdc` に変換するには、隣接する `c` と `d` を入れ替えればよいため、距離は 1 です。

3. `LEVENSHTEIN` との違い

```sql
SELECT levenshtein('abcd', 'abdc'), damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+-----------------------------+----------------------------------------------+
| levenshtein('abcd', 'abdc') | damerau_levenshtein_distance('abcd', 'abdc') |
+-----------------------------+----------------------------------------------+
|                           2 |                                            1 |
+-----------------------------+----------------------------------------------+
```

`LEVENSHTEIN` は文字の入れ替えをサポートしないため、2 回の編集操作が必要です。`DAMERAU_LEVENSHTEIN_DISTANCE` は隣接する文字の入れ替えをサポートするため、必要な編集操作は 1 回だけです。

4. UTF-8 の文字

```sql
SELECT damerau_levenshtein_distance('你好', '好你');
```

```text
+--------------------------------------------------+
| damerau_levenshtein_distance('你好', '好你')     |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```

`你` と `好` はそれぞれ UTF-8 の文字であり、隣接する二文字の入れ替えには 1 回の編集操作が必要です。

5. 挿入、削除、置換

```sql
SELECT
    damerau_levenshtein_distance('', 'abc'),
    damerau_levenshtein_distance('数据库', '数据'),
    damerau_levenshtein_distance('flaw', 'lawn');
```

```text
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
| damerau_levenshtein_distance('', 'abc') | damerau_levenshtein_distance('数据库', '数据')      | damerau_levenshtein_distance('flaw', 'lawn') |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
|                                       3 |                                                   1 |                                            2 |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
```

6. 完全なダメラウ・レーベンシュタイン距離の例

```sql
SELECT damerau_levenshtein_distance('CA', 'ABC');
```

```text
+-------------------------------------------+
| damerau_levenshtein_distance('CA', 'ABC') |
+-------------------------------------------+
|                                         2 |
+-------------------------------------------+
```

この関数は完全なダメラウ・レーベンシュタイン距離を計算します。`CA` と `ABC` の最小編集距離は 2 です。

7. NULL 引数

```sql
SELECT damerau_levenshtein_distance(NULL, 'abc'), damerau_levenshtein_distance('abc', NULL);
```

```text
+-------------------------------------------+-------------------------------------------+
| damerau_levenshtein_distance(NULL, 'abc') | damerau_levenshtein_distance('abc', NULL) |
+-------------------------------------------+-------------------------------------------+
|                                      NULL |                                      NULL |
+-------------------------------------------+-------------------------------------------+
```

8. 入力が大きすぎる場合

```sql
SELECT damerau_levenshtein_distance(repeat('a', 4096), repeat('b', 4096));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]damerau_levenshtein_distance distance matrix is too large: 16793604 cells exceeds limit 16777216
```
