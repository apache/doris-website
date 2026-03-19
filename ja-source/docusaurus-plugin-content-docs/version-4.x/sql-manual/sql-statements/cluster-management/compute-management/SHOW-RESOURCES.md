---
{
  "title": "SHOW RESOURCES",
  "description": "この文は、ユーザーが使用する権限を持つリソースを表示するために使用されます。通常のユーザーは、権限を持つリソースのみを表示できます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、ユーザーが使用許可を持つリソースを表示するために使用されます。一般ユーザーは許可されたリソースのみを表示でき、rootまたはadminユーザーはすべてのリソースを表示します。

## Syntax

```sql
SHOW RESOURCES
[
  WHERE
  [NAME [ = "<your_resource_name>" | LIKE "<name_matcher>"]]
  [RESOURCETYPE = "<type>"]
] | [LIKE "<pattern>"]
[ORDER BY ...]
[LIMIT <limit>][OFFSET <offset>];
```
## 使用上の注意

1. NAME LIKE を使用した場合、RESOURCES内でName にname_matcherが含まれるResourceにマッチします
2. NAME = を使用した場合、指定されたNameと完全に一致します
3. RESOURCETYPEが指定された場合、対応するResrouceタイプにマッチします。サポートされているRESOURCETYPEについては[CREATE-RESOURCE](./CREATE-RESOURCE.md)を参照してください
4. ORDER BYを使用して、任意のカラムの組み合わせでソートできます
5. LIMITが指定された場合、マッチするレコードの表示数が制限されます。そうでなければ全て表示されます
6. OFFSETが指定された場合、クエリ結果はoffsetオフセットから開始して表示されます。デフォルトでは、オフセットは0です
7. LIKEを使用する場合、WHERE句は無視されます

## 例

1. 現在のユーザーが権限を持つすべてのリソースを表示する

   ```sql
   SHOW RESOURCES;
   ```
2. 文字列"20140102"を含む名前を持つ、指定されたResourceを表示し、10個の属性を表示する

   ```sql
   SHOW RESOURCES WHERE NAME LIKE "2014_01_02" LIMIT 10;
   ```
3. 指定されたResourceを表示し、名前を"20140102"として指定し、KEYの降順でソートする

   ```sql
   SHOW RESOURCES WHERE NAME = "20140102" ORDER BY `KEY` DESC;
   ```
3. LIKEを使用してリソースをマッチングする

   ```sql
   SHOW RESOURCES LIKE "jdbc%";
   ```
