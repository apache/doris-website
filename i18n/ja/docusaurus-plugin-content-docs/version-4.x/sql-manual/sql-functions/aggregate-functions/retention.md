---
{
    "title": "RETENTION",
    "language": "ja",
    "description": "retention 関数は、イベントが特定の条件を満たしたかどうかを示す、1 個から 32 個の Bool 型の条件を引数に取ります。"
}
---

## 説明 {#description}

`retention` 関数は、イベントが特定の条件を満たしたかどうかを示す、1 個から 32 個の Bool 型の条件を引数に取ります。任意の条件を引数として指定できます。

最初の条件を除き、各条件は最初の条件と組み合わせて評価されます。最初と次の条件がともに true なら次の結果は true になり、最初とその次の条件がともに true ならその結果は true になります。以降も同様です。

つまり、戻り値の配列の最初の要素は `event_1` の真偽を示し、次の要素は `event_1` と `event_2` がともに true かどうかを示します。その次の要素は `event_1` と `event_3` がともに true かどうかを示し、以降も同様です。`event_1` が false の場合は、すべての要素が false の配列を返します。

## 構文 {#syntax}

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<event_n>` | `n` 番目のイベント条件。型は Bool です。 |

## 戻り値 {#returned-value}
- true: 条件を満たします。
- false: 条件を満たしません。
最大長が 32 の Bool の配列を返します。出力配列の長さは入力パラメータの数と同じです。
集約にデータがまったく含まれない場合は、NULL 値を返します。
複数の列を計算に使用する場合、いずれかの列に NULL 値がある行は集約計算に参加せず、除外されます。
NULL 値を処理するには、計算対象の列に IFNULL 関数を使用できます。詳しくは、後の例を参照してください。

## 例 {#examples}

1. サンプルテーブルを作成し、サンプルデータを挿入する

```sql
CREATE TABLE retention_test(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time'
) DUPLICATE KEY(uid)
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

INSERT into retention_test values
(0, '2022-10-12'),
(0, '2022-10-13'),
(0, '2022-10-14'),
(1, '2022-10-12'),
(1, '2022-10-13'),
(2, '2022-10-12');
```

2. ユーザーの継続利用を計算する

```sql
SELECT
    uid,
    RETENTION(date = '2022-10-12') AS r,
    RETENTION(date = '2022-10-12', date = '2022-10-13') AS r2,
    RETENTION(date = '2022-10-12', date = '2022-10-13', date = '2022-10-14') AS r3
FROM retention_test
GROUP BY uid
ORDER BY uid ASC;
```

```text
+------+------+--------+-----------+
| uid  | r    | r2     | r3        |
+------+------+--------+-----------+
|    0 | [1]  | [1, 1] | [1, 1, 1] |
|    1 | [1]  | [1, 1] | [1, 1, 0] |
|    2 | [1]  | [1, 0] | [1, 0, 0] |
+------+------+--------+-----------+
```

3. 特殊なケースでの NULL 値の処理として、テーブルを作り直し、データを挿入する

```sql
CREATE TABLE retention_test2(
    `uid` int,
    `flag` boolean,
    `flag2` boolean
) DUPLICATE KEY(uid)
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

INSERT into retention_test2 values (0, true, NULL), (1, false, false);

SELECT * FROM retention_test2 ORDER BY uid;
```

```text
+------+------+-------+
| uid  | flag | flag2 |
+------+------+-------+
|    0 |    1 |  NULL |
|    1 |    0 |     0 |
+------+------+-------+
```


4. 空のテーブルに対して計算すると、集約に参加するデータがないため、NULL 値が返されます。

```sql
SELECT RETENTION(flag) AS r FROM retention_test2 WHERE uid IS NULL;
```

```text
+------+
| r    |
+------+
| NULL |
+------+
```

5. 計算に使用するのは flag 列だけです。uid = 0 のとき flag は true なので、1 が返されます。

```sql
select retention(flag) from retention_test2;
```

```text
+-----------------+
| retention(flag) |
+-----------------+
| [1]             |
+-----------------+
```

6. flag 列と flag2 列を計算に使用する場合、uid = 0 の行は flag2 が NULL のため集約計算から除外されます。uid = 1 の行だけが集約に参加し、0 が返されます。

```sql
select retention(flag,flag2) from retention_test2;
```

```text
+-----------------------+
| retention(flag,flag2) |
+-----------------------+
| [0, 0]                |
+-----------------------+
```

7. NULL 値を処理するには、IFNULL 関数で NULL を false に変換します。これにより、uid = 0 と uid = 1 の両方の行が集約計算に参加します。

```sql
select retention(flag,IFNULL(flag2,false)) from retention_test2;
```

```text
+-------------------------------------+
| retention(flag,IFNULL(flag2,false)) |
+-------------------------------------+
| [1, 0]                              |
+-------------------------------------+
```
