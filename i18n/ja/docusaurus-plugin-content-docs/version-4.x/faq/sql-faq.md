---
{
    "title": "SQL エラー",
    "language": "ja",
    "description": "該当するタブレットにクエリ可能なレプリカが見つからない場合に発生します。通常は BE の停止やレプリカの欠損などが原因です。"
}
---

# SQL エラー

### Q1. クエリエラー: Failed to get scan range, no queryable replica found in tablet: xxxx

該当するタブレットにクエリ可能なレプリカが見つからない場合に発生します。通常は BE の停止やレプリカの欠損などが原因です。まず `show tablet tablet_id` 文を実行し、続けて以下の `show proc` 文を実行すると、このタブレットに対応するレプリカ情報を確認し、レプリカがそろっているかを調べられます。また、`show proc "/cluster_balance"` の情報から、クラスタ内のレプリカのスケジューリングと修復の進捗も確認できます。

データレプリカの管理に関するコマンドについては、[データレプリカの管理](../admin-manual/maint-monitor/tablet-repair-and-balance.md)を参照してください。

### Q2. Show backends/frontends で表示される情報が不完全

`show backends/frontends` などの文を実行すると、結果の一部の列に情報が表示されないことがあります。たとえば、show backends の結果にディスク容量の情報が表示されない場合があります。

通常、この問題はクラスタに複数の FE がある場合に発生します。Master 以外の FE ノードに接続してこれらの文を実行すると、情報が不完全になることがあります。これは、BE のディスク使用量など、一部の情報が Master FE ノードにしか存在しないためです。完全な情報を得るには、Master FE に直接接続します。

また、これらの文を実行する前に `set forward_to_master=true;` を実行する方法もあります。このセッション変数を true に設定すると、以降に実行する一部の情報表示文が自動的に Master FE に転送されます。これにより、接続先の FE にかかわらず、完全な結果を取得できます。

### Q3. invalid cluster id: xxxx

このエラーは、show backends または show frontends コマンドの結果に表示されることがあります。通常は、FE または BE ノードのエラーメッセージ列に表示されます。このエラーは、Master FE がノードにハートビートを送信した際、ノードがハートビートに含まれるクラスタ ID とローカルに保存されたクラスタ ID の違いを検出し、ハートビートへの応答を拒否したことを意味します。

Doris の Master FE ノードは、各 FE または BE ノードにハートビートを能動的に送信します。このハートビートには cluster_id が含まれます。cluster_id は、クラスタの初期化時に Master FE が生成する一意のクラスタ ID です。FE または BE が初めてハートビートを受信すると、cluster_id はローカルにファイルとして保存されます。FE のファイルはメタデータディレクトリ内の image/ ディレクトリにあり、BE ではすべてのデータディレクトリに cluster_id ファイルがあります。その後、ノードはハートビートを受信するたびに、ローカルの cluster_id とハートビート内の値を比較します。一致しない場合は、ハートビートへの応答を拒否します。

この仕組みは、クラスタ外のノードから送信された偽のハートビートメッセージを受け付けないためのノード認証機構です。

このエラーから復旧する必要がある場合は、まずすべてのノードが正しいクラスタに属していることを確認してください。そのうえで、FE ノードでは、メタデータディレクトリ内の image/VERSION ファイルにある cluster_id の値を変更し、FE を再起動する方法を試せます。BE ノードでは、データディレクトリ内のすべての cluster_id ファイルを削除してから BE を再起動できます。

### Q4. Unique Key モデルのクエリ結果が一致しない

Unique Key モデルのテーブルに対して同じ SQL でクエリを繰り返すと、結果が一致せず、常に 2～3 種類の結果の間で変動する場合があります。

これは、同じインポートバッチにキーが同じで値が異なるデータが含まれていることが原因かもしれません。データが上書きされる順序が定まらないため、レプリカ間で結果が一致しなくなります。

たとえば、テーブルを k1、v1 で定義し、次のデータを一括でインポートしたとします。

```text
1, "abc"
1, "def"
```

この場合、レプリカ 1 の結果は `1, "abc"`、レプリカ 2 の結果は `1, "def"` になる可能性があります。そのため、クエリ結果が一致しません。

レプリカ間でデータの順序を一意に定めるには、[Sequence Column](../data-operate/update/update-of-unique-model.md) 機能を参照してください。

### Q5. bitmap/hll 型データのクエリ結果が NULL になる問題

バージョン 1.1.x でベクトル化を有効にしている場合に、クエリ対象テーブルの bitmap 型フィールドが NULL を返すときは、次の操作を行います。

1. まず `set return_object_data_as_binary=true;` を実行します。
2. ベクトル化を無効にします: `set enable_vectorized_engine=false;`
3. SQL キャッシュを無効にします: `set [global] enable_sql_cache = false;`

これは、ベクトル化実行エンジンにおいて bitmap / hll 型の入力がすべて NULL の場合、出力も 0 ではなく NULL になるためです。

### Q6. オブジェクトストレージへのアクセス時のエラー: curl 77: Problem with the SSL CA cert

be.INFO ログに `curl 77: Problem with the SSL CA cert` エラーが表示された場合は、次の方法で解決を試せます。

1. [https://curl.se/docs/caextract.html](https://curl.se/docs/caextract.html) から証明書 cacert.pem をダウンロードします。
2. 証明書を指定の場所にコピーします: `sudo cp /tmp/cacert.pem /etc/ssl/certs/ca-certificates.crt`
3. BE ノードを再起動します。

### Q7. インポートエラー: "Message": "[INTERNAL_ERROR]single replica load is disabled on BE."

1. be.conf の `enable_single_replica_load` パラメータが true に設定されていることを確認します。
2. BE ノードを再起動します。
