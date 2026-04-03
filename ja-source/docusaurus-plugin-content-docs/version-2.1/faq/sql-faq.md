---
{
  "title": "SQLエラー",
  "language": "ja",
  "description": "これは、対応するtabletがクエリ可能なコピーを見つけられないために発生します。通常、BEがダウンしている、コピーが欠落している等が原因です。"
}
---
# SQL Error

### Q1. Query error: Failed to get scan range, no queryable replica found in tablet: xxxx

これは対応するtabletが照会可能なコピーを見つけられないために発生します。通常はBEがダウンしている、コピーが欠落している等が原因です。まず`show tablet tablet_id`文を実行し、次に以下の`show proc`文を実行して、このtabletに対応するレプリカ情報を表示し、レプリカが完全かどうかを確認できます。同時に、`show proc "/cluster_balance"`情報を通じて、クラスタ内のレプリカスケジューリングと修復の進行状況も照会できます。

データコピー管理に関するコマンドについては、[Data Copy Management](../admin-manual/maint-monitor/tablet-repair-and-balance.md)を参照してください。

### Q2. Show backends/frontends 表示される情報が不完全

`show backends/frontends`などの特定の文を実行した後、結果の一部の列が不完全であることが判明する場合があります。例えば、show backendsの結果でディスク容量情報が表示されません。

通常、この問題はクラスタに複数のFEがある場合に発生します。ユーザーが非Master FEノードに接続してこれらの文を実行すると、不完全な情報が表示されます。これは一部の情報がMaster FEノードにのみ存在するためです。例えば、BEのディスク使用量情報などです。したがって、Master FEに直接接続した後でのみ完全な情報を取得できます。

もちろん、ユーザーはこれらの文を実行する前に`set forward_to_master=true;`を実行することもできます。セッション変数がtrueに設定された後、続いて実行される一部の情報表示文は自動的にMaster FEに転送され、結果を取得します。これにより、ユーザーがどのFEに接続していても、完全な結果を取得できます。

### Q3. invalid cluster id: xxxx

このエラーはshow backendsまたはshow frontendsコマンドの結果に表示される場合があります。通常、FEまたはBEノードのエラーメッセージ列に表示されます。このエラーの意味は、Master FEがノードにハートビート情報を送信した後、ノードがハートビート情報に含まれるcluster idがローカルに保存されているcluster idと異なることを発見し、ハートビートへの応答を拒否することです。

DorisのMaster FEノードは各FEまたはBEノードに積極的にハートビートを送信し、ハートビート情報にcluster_idを含めます。cluster_idは、クラスタが初期化される際にMaster FEによって生成される一意のクラスタIDです。FEまたはBEが初回のハートビート情報を受信すると、cluster_idがファイル形式でローカルに保存されます。FEのファイルはメタデータディレクトリのimage/ディレクトリにあり、BEはすべてのデータディレクトリにcluster_idファイルを持ちます。その後、ノードがハートビートを受信するたびに、ローカルのcluster_idの内容とハートビート内の内容を比較します。一致しない場合、ハートビートへの応答を拒否します。

このメカニズムは、クラスタ外のノードから送信された偽のハートビートメッセージの受信を防ぐノード認証メカニズムです。

このエラーからの回復が必要な場合、まずすべてのノードが正しいクラスタにあることを確認する必要があります。その後、FEノードについては、メタデータディレクトリのimage/VERSIONファイル内のcluster_id値を修正してFEを再起動することができます。BEノードについては、データディレクトリ内のすべてのcluster_idファイルを削除してBEを再起動できます。

### Q4. Unique Keyモデルのクエリ結果が一致しない

場合によっては、ユーザーがUnique Keyモデルのテーブルを照会するために同じSQLを使用する際、複数のクエリの結果が一致しない場合があります。そして、クエリ結果は常に2-3種類の間で変化します。

これは、同じバッチのインポートデータに、同じkeyで異なる値を持つデータがあるためかもしれません。これは、データ上書きの順序の不確実性により、異なるレプリカ間で一致しない結果を引き起こします。

例えば、テーブルがk1, v1として定義されているとします。インポートデータのバッチは以下の通りです：

```text
1, "abc"
1, "def"
```
それにより、copy 1の結果が`1, "abc"`となり、copy 2の結果が`1, "def"`となる可能性があります。その結果、クエリ結果に一貫性がなくなります。

異なるレプリカ間でのデータシーケンスの一意性を確保するには、[Sequence Column](../data-operate/update/update-of-unique-model.md)機能を参照してください。

### Q5. bitmap/hll型データのクエリでNULLが返される問題

バージョン1.1.xにおいて、ベクトル化が有効になっており、クエリデータテーブルのbitmap型フィールドがNULL結果を返す場合、

1. まず`set return_object_data_as_binary=true;`を実行する必要があります
2. ベクトル化を無効にする`set enable_vectorized_engine=false;`
3. SQLキャッシュを無効にする`set [global] enable_sql_cache = false;`

これは、bitmap / hll型がベクトル化実行エンジンにおいて、入力がすべてNULLの場合、出力結果も0ではなくNULLになるためです。

### Q5. bitmap/hll型データのクエリでNULLが返される問題

バージョン1.1.xにおいて、ベクトル化が有効になっており、クエリデータテーブルのbitmp型フィールドがNULL結果を返す場合、

1. まず`set return_object_data_as_binary=true;`を実行する必要があります
2. ベクトル化を無効にする`set enable_vectorized_engine=false;`
3. SQLキャッシュを無効にする`set [global] enable_sql_cache = false;`

これは、bitmap/hll型がベクトル化実行エンジンにおいて、入力がすべてNULLの場合、出力結果も0ではなくNULLになるためです。

### Q6. オブジェクトストレージアクセス時のエラー：curl 77: Problem with the SSL CA cert

be.INFOログに`curl 77: Problem with the SSL CA cert`エラーが表示される場合、以下の方法で解決を試すことができます：

1. [https://curl.se/docs/caextract.html](https://curl.se/docs/caextract.html)から証明書をダウンロードします：cacert.pem
2. 証明書を指定の場所にコピーします：`sudo cp /tmp/cacert.pem /etc/ssl/certs/ca-certificates.crt`
3. BEノードを再起動します。

### Q7. インポートエラー："Message": "[INTERNAL_ERROR]single replica load is disabled on BE."

1. be.confの`enable_single_replica_load`パラメータがtrueに設定されていることを確認してください
2. BEノードを再起動します。
