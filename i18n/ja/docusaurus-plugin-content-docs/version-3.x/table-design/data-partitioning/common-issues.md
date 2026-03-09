---
{
  "title": "よくある問題",
  "language": "ja",
  "description": "Dorisはパーティション粒度に基づいてテーブルを順次作成します。パーティションの作成に失敗した場合、このエラーが発生する可能性があります。"
}
---
1. 長いテーブル作成文では、不完全な構文エラープロンプトが発生する場合があります。手動でトラブルシューティングを行う際の構文エラーの可能性を以下に示します：

   - 構文構造エラー。[HELP CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)を注意深く読み、関連する構文構造を確認してください。
   - 予約語。ユーザー定義名が予約語と重複する場合は、バッククォート``で囲む必要があります。すべてのカスタム名にこの記号を使用することを推奨します。
   - 中国語文字または全角文字。UTF8でエンコードされていない中国語文字や隠れた全角文字（スペース、句読点など）は構文エラーを引き起こす可能性があります。非表示文字を表示するテキストエディターを使用して検査することを推奨します。

2. Failed to create partition [xxx]. Timeout

   Dorisはパーティション単位でテーブルを順次作成します。パーティションの作成に失敗すると、このエラーが発生する場合があります。パーティションを使用していなくても、テーブル作成に問題がある場合は`Failed to create partition`が報告される可能性があります。これは前述の通り、Dorisがパーティションを指定していないテーブルに対して変更不可能なデフォルトパーティションを作成するためです。

   このエラーに遭遇した場合、通常はBEがデータタブレットを作成する際に問題が発生したことが原因です。以下の手順でトラブルシューティングを行うことができます：

   - fe.logで、対応するタイムスタンプの`Failed to create partition`ログエントリを検索します。このログエントリで、`{10001-10010}`のような一連の数値ペアを見つけることがあります。ペアの最初の数値はBackend IDを表し、2番目の数値はTablet IDを表します。たとえば、この数値ペアはBackend ID 10001でTablet ID 10010の作成が失敗したことを示しています。
   - 対応するBackendのbe.INFOログに移動し、対応する時間帯内でTablet ID関連のログを検索してエラーメッセージを見つけます。
   - 以下は一般的なタブレット作成失敗エラーの例ですが、これに限定されません：
     - BEが関連タスクを受信しませんでした。この場合、be.INFOでTablet ID関連のログを見つけることができないか、BEが成功を報告したが実際には失敗しています。これらの問題については、[Installation and Deployment](../../../../docs/install/deploy-manually/integrated-storage-compute-deploy-manually)セクションを参照してFEとBE間の接続性を確認してください。
     - 事前割り当てメモリ失敗。これはテーブル内の行のバイト長が100KBを超えることが原因である可能性があります。
     - `Too many open files`。開いているファイルハンドルの数がLinuxシステムの制限を超えています。Linuxシステムのハンドル制限を変更する必要があります。

* データタブレット作成時にタイムアウトが発生する場合は、fe.confファイルで`tablet_create_timeout_second=xxx`と`max_create_table_timeout_second=xxx`を設定してタイムアウトを延長することもできます。デフォルトでは、`tablet_create_timeout_second`は1秒に設定され、`max_create_table_timeout_second`は60秒に設定されています。全体のタイムアウトは`min(tablet_create_timeout_second * replication_num, max_create_table_timeout_second)`として計算されます。具体的なパラメータ設定については、[FE Configuration](../../admin-manual/config/fe-config)セクションを参照してください。

3. テーブル作成コマンドが長時間結果を返さない。

* Dorisのテーブル作成コマンドは同期コマンドです。このコマンドのタイムアウトは現在、単純に(tablet num * replication num)秒として設定されています。多くのデータタブレットが作成され、その一部の作成に失敗した場合、エラーが返されるまで長時間待機することになる可能性があります。
* 通常の状況では、テーブル作成文は数秒から数十秒以内に返されるはずです。1分を超える場合は、直接操作をキャンセルして、FEまたはBEログで関連エラーを確認することを推奨します。

## その他のヘルプ

データパーティションに関するより詳細な情報については、[CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)コマンドマニュアルを参照するか、MySQLクライアントで`HELP CREATE TABLE;`を入力してより多くのヘルプ情報を取得できます。
