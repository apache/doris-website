---
{
    "title": "EXPLODE_BITMAP_OUTER",
    "language": "ja",
    "description": "explodebitmapouter テーブル関数は bitmap 型のデータを受け取り、ビットマップ内の各ビットを個別の行に展開します。"
}
---

## 説明
`explode_bitmap_outer` テーブル関数は bitmap 型のデータを受け取り、ビットマップ内の各ビットを個別の行に展開します。
ビットマップデータの処理によく使用され、ビットマップ内の各要素を個別のレコードに展開します。[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。
`explode_bitmap_outer` は `explode_bitmap` に似ていますが、空の値や NULL 値の扱いが異なります。空または NULL のビットマップを持つレコードも結果に残し、それぞれ NULL を含む行に展開します。

## 構文
```sql
EXPLODE_BITMAP_OUTER(<bitmap>)
```

## パラメータ
- `<bitmap>` [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 型

## 戻り値
- `<bitmap>` 内の各ビットについて 1 行を返します。各行にはビットの値が含まれます。
- `<bitmap>` が NULL の場合、NULL を含む 1 行を返します。
- `<bitmap>` が空の場合、NULL を含む 1 行を返します。


## 使用上の注意
1. `<bitmap>` パラメータが [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 型でない場合、エラーが報告されます。

## 例
0. データを準備する
    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 通常のパラメータ
    ```sql
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 |    1 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |   10 |
    +------+------+
    ```
2. 空の BITMAP
    ```sql
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. NULL パラメータ
    ```sql
    select  * from example lateral view explode_bitmap_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 配列以外のパラメータ
    ```sql
    select  * from example lateral view explode_bitmap_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap_outer(VARCHAR(3))
    ```