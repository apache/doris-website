---
{
  "title": "BITMAP_INTERSECT",
  "language": "ja",
  "description": "集約関数。グループ化後のbitmap intersectionを計算するために使用される。ユーザー継続率の計算などの一般的な使用シナリオ。"
}
---
## 説明

グループ化後のビットマップの積集合を計算するために使用される集約関数です。ユーザー継続率の計算などの一般的な使用シナリオがあります。

## 構文

```sql
BITMAP_INTERSECT(BITMAP <value>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<value>` | サポートされるビットマップデータ型 |

## 戻り値

戻り値のデータ型はBITMAPです。

## 例

テーブルスキーマ

```
KeysType: AGG_KEY
Columns: tag varchar, date datetime, user_id bitmap bitmap_union
```
```
Find the retention of users between 2020-05-18 and 2020-05-19 under different tags.
mysql> select tag, bitmap_intersect(user_id) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```
bitmap_to_string関数と組み合わせて使用し、交差の具体的なデータを取得する

```
Who are the users retained under different tags between 2020-05-18 and 2020-05-19?
mysql> select tag, bitmap_to_string(bitmap_intersect(user_id)) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```
