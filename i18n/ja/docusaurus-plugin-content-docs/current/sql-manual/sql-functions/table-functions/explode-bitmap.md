---
{
    "title": "EXPLODE_BITMAP",
    "language": "ja",
    "description": "explodebitmap テーブル関数は BITMAP 型のデータを受け取り、ビットマップ内の各ビットを個別の行に展開します。"
}
---

## 説明
`explode_bitmap` テーブル関数は BITMAP 型のデータを受け取り、ビットマップ内の各ビットを個別の行に展開します。
ビットマップのデータを処理し、その各要素を個別のレコードに展開する際によく使用します。[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用してください。

## 構文
```sql
EXPLODE_BITMAP(<bitmap>)
```

## パラメータ
- `<bitmap>` [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 型

## 戻り値
- `<bitmap>` 内の各ビットに対して一行を返します。各行にはビットの値が含まれます。

## 使用上の注意
1. `<bitmap>` パラメータが [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 型でない場合、エラーが報告されます。

## 例
0. データの準備
    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 通常の引数
    ```sql
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
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
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 引数
    ```sql
    select  * from example lateral view explode_bitmap(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 配列以外の引数
    ```sql
    select  * from example lateral view explode_bitmap('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap(VARCHAR(3))
    ```
