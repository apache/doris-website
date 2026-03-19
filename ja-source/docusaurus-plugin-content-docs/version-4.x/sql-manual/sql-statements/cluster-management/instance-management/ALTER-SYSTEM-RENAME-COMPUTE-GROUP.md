---
{
  "title": "ALTER-SYSTEM-RENAME-COMPUTE-GROUP",
  "description": "ALTER SYSTEM RENAME COMPUTE-GROUP",
  "language": "ja"
}
---
## ALTER-SYSTEM-RENAME-COMPUTE-GROUP


### Name

ALTER SYSTEM RENAME COMPUTE-GROUP

### デスクリプション

compute groupの名前変更に使用されます（管理者専用！）

文法:

- ストレージとコンピューティングが分離されたクラスターにおいて、このステートメントは既存のcompute groupの名前を変更するために使用されます。この操作は同期的であり、実行が完了するとコマンドが戻ります。

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>
```
注釈:
1. コンピュートグループの命名規則は、DORISのデータベース名およびTable名の命名規則と一致しています。
2. 現在のストレージとコンピューティングの分離クラスター内のすべてのコンピュートグループは、[SHOW COMPUTE GROUPS](../compute-management/SHOW-COMPUTE-GROUPS)を使用して確認できます。
3. 名前変更操作が完了した後、[SHOW COMPUTE GROUPS](../compute-management/SHOW-COMPUTE-GROUPS)を使用して確認することもできます。
4. 名前変更操作が失敗した場合、元のコンピュートグループが存在しない、または元のコンピュートグループ名とターゲットのコンピュートグループ名が同じであるなどの理由について、返されたメッセージで確認できます。

### 例

1. old_nameという名前のコンピュートグループをnew_nameに名前変更します。

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>
```
### Keywords

ALTER、SYSTEM、RENAME、ALTER SYSTEM
