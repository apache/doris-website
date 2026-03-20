---
{
  "title": "SYNC",
  "description": "この文はnon-master Frontend (FE) ノードのメタデータを同期するために使用されます。Apache Dorisでは、master FEノードのみがメタデータを書き込むことができます。",
  "language": "ja"
}
---
## 説明

このステートメントは、非masterのFrontend (FE)ノードのメタデータを同期するために使用されます。Apache Dorisでは、masterのFEノードのみがメタデータを書き込むことができ、他のFEノードはメタデータの書き込み操作をmasterに転送します。masterがメタデータの書き込み操作を完了した後、非masterノードでメタデータの再生に短い遅延が生じる可能性があります。このステートメントを使用してメタデータの強制同期を実行できます。

## 構文

```sql
SYNC;
```
## Access Control Requirements  

任意のユーザーまたはロールがこの操作を実行できます。


## Examples

メタデータを同期する：

    ```sql
    SYNC;
    ```
