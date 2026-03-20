---
{
  "title": "SHOW COMPUTE GROUPS",
  "description": "compute storage separation モードにおいて、現在のユーザーが使用権限を持つコンピュートグループのリストを表示します。",
  "language": "ja"
}
---
## デスクリプション

コンピュートストレージ分離モードにおいて、現在のユーザーが使用権限を持つコンピュートグループのリストを表示します。

## Syntax

```sql
SHOW COMPUTE GROUPS
```
## 戻り値

現在のユーザーが権限を持つcompute groupのリストを返します。

- Name - compute groupの名前
- IsCurrent - 現在のユーザーがこのcompute groupを使用しているかどうか
- Users - このcompute groupをデフォルトのcompute groupとして設定しているユーザー名
- BackendNum - このcompute groupが持つバックエンドの数

## 例

`compute_cluster`という名前のcompute groupの使用を指定します。

```sql
SHOW COMPUTE GROUPS;
```
結果は:

```sql
+-----------------+-----------+-------+------------+
| Name           | IsCurrent  | Users | BackendNum |
+-----------------+-----------+-------+------------+
| compute_cluster | TRUE      |       | 3          |
+-----------------+-----------+-------+------------+
```
## 使用上の注意

現在のユーザーがいずれのcompute groupに対しても権限を持たない場合、`SHOW COMPUTE GROUPS`は空のリストを返します。
