---
{
    "title": "RETENTION",
    "language": "ja",
    "description": "retention 関数は、条件を満たしたかどうかを示す Bool 型の条件を 1 個から 32 個まで引数として受け取ります。"
}
---

## 説明

`retention` 関数は、イベントが条件を満たしたかどうかを示す Bool 型の条件を 1 個から 32 個まで引数として受け取ります。任意の条件を引数に指定できます。

最初の条件を除き、各条件は最初の条件と組み合わせて評価されます。次の結果は最初と次の条件がともに true の場合に true となり、その次の結果は最初とその次の条件がともに true の場合に true となります。以降も同様です。

つまり、戻り値の配列の最初の要素は `event_1` の真偽を示し、次の要素は `event_1` と `event_2` がともに true かどうかを示し、その次の要素は `event_1` と `event_3` がともに true かどうかを示します。以降も同様です。`event_1` が false の場合、すべての要素が false の配列を返します。

## 構文

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<event_n>` | `n` 番目のイベント条件。型は Bool です。 |

## 戻り値
- true：条件を満たしています。
- false：条件を満たしていません。
最大長 32 の Bool 型の配列を返します。出力配列の長さは入力パラメータの数と同じです。
集計にデータが含まれない場合は、NULL を返します。
複数の列を計算に使用する場合、いずれかの列に NULL 値が含まれる行は集計に参加せず、除外されます。
計算に使用する列の NULL 値は、IFNULL 関数で処理できます。詳しくは、以下の例を参照してください。

## 例

1. サンプルテーブルを作成し、サンプルデータを挿入します。

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

2. ユーザーのリテンションを計算します。

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

3. 特殊なケースで NULL 値を処理するため、テーブルを作り直してデータを挿入します。

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

INSERT into retention_test2 values (0, false, false), (1, true,  NULL);

SELECT * from retention_test2;
```

```text
+------+------+-------+
| uid  | flag | flag2 |
+------+------+-------+
|    0 |    1 |  NULL |
|    1 |    0 |     0 |
+------+------+-------+
```


4. 空のテーブルに対して計算を実行すると、集計にデータが参加しないため、NULL を返します。

```sql
SELECT RETENTION(date = '2022-10-12') AS r FROM retention_test2 where uid is NULL;
```

```text
+------+
| r    |
+------+
| NULL |
+------+
```

5. 計算に使用するのは flag 列だけです。uid = 0 のとき flag が true であるため、1 を返します。

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

6. flag 列と flag2 列を計算に使用する場合、uid = 0 の行は flag2 が NULL であるため、集計から除外されます。uid = 1 の行だけが集計に参加するため、戻り値は 0 になります。

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

7. NULL 値に対処するには、IFNULL 関数を使用して NULL を false に変換します。これにより、uid = 0 と uid = 1 の両方の行が集計に含まれます。

```sql
select retention(flag,IFNULL(flag2,false)) from retention_test2;;
```

```text
+-------------------------------------+
| retention(flag,IFNULL(flag2,false)) |
+-------------------------------------+
| [1, 0]                              |
+-------------------------------------+
```
