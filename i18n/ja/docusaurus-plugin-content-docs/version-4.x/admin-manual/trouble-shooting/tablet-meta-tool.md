---
{
    "title": "Tablet メタデータ管理ツール",
    "language": "ja",
    "description": "最新バージョンでは、Tablet のメタ情報を保存するために BE に RocksDB を導入しました。"
}
---

# Tablet メタデータ管理ツール

## 背景

最新バージョンでは、ヘッダーファイルを使ってメタ情報を保存することで生じるさまざまな機能上および性能上の問題を解決するため、Tablet のメタ情報を保存する RocksDB を BE に導入しました。現在、各データディレクトリ（ルートパス）には対応する RocksDB インスタンスがあり、そのルートパス上のすべての Tablet のメタ情報がキーと値の形式で保存されます。

これらのメタデータを保守するために、オンラインの HTTP インターフェースとオフラインのメタツールを提供しています。

HTTP インターフェースは、稼働中の BE で Tablet のメタデータを表示する場合にのみ使用します。

一方、メタツールはオフラインでのメタデータ管理操作にのみ使用します。使用する前に BE を停止する必要があります。

メタツールは BE の lib/ ディレクトリにあります。

## 操作

### Tablet Meta の表示

Tablet Meta の情報は、オンラインとオフラインのどちらでも表示できます。

#### オンライン

BE の HTTP インターフェースにアクセスして、対応する Tablet Meta の情報を取得します。

API:

`http://{host}:{port}/api/meta/header/{tablet_id}/{schema_hash}`


> host: BE のホスト名
>
> port: BE の HTTP ポート
>
> tablet_id: Tablet ID
>
> schema_hash: Tablet のスキーマハッシュ

例:

`http://be_host:8040/api/meta/header/14156/2458238340`

クエリが成功すると、Tablet Meta が JSON 形式で返されます。

#### オフライン

meta\ tool を使用して、ディスク上の Tablet Meta を取得します。

コマンド:

```
./lib/meta_tool --root_path=/path/to/root_path --operation=get_meta --tablet_id=xxx --schema_hash=xxx
```

> root_path: be.conf で設定した、対応する root_path のパス。

結果も Tablet Meta が JSON 形式で表示されます。

### ヘッダーの読み込み

ヘッダーの読み込み機能は、Tablet を手動で移行するために用意されています。この機能は JSON 形式の Tablet Meta を使用するため、シャードフィールドやバージョン情報を変更する必要がある場合は、Tablet Meta の JSON コンテンツを直接編集できます。その後、次のコマンドで読み込みます。

コマンド:

```
./lib/meta_tool --operation=load_meta --root_path=/path/to/root_path --json_meta_path=path
```

### ヘッダーの削除

BE のディスクから Tablet のメタ情報を削除します。単一削除と一括削除に対応しています。

単一削除:

```
./lib/meta_tool --operation=delete_meta --root_path=/path/to/root_path --tablet_id=xxx --schema_hash=xxx`
```

一括削除:

```
./lib/meta_tool --operation=batch_delete_meta --tablet_file=/path/to/tablet_file.txt
```

`tablet_file.txt` の各行には、それぞれ単一の Tablet に関する情報を記載します。形式は次のとおりです。

`root_path,tablet_id,schema_hash`

各列はコンマで区切ります。

`tablet_file` の例:

```
/output/be/data/,14217,352781111
/output/be/data/,14219,352781111
/output/be/data/,14223,352781111
/output/be/data/,14227,352781111
/output/be/data/,14233,352781111
/output/be/data/,14239,352781111
```

一括削除では、`tablet_file` 内の Tablet 情報の形式が正しくない行はスキップされます。実行が完了すると、削除に成功した件数とエラーの件数が表示されます。

### PB 形式の Tablet Meta

このコマンドでは、従来のファイルベースの管理方式で保存された PB 形式の Tablet Meta を表示し、JSON 形式で出力します。

コマンド:

```
./lib/meta_tool --operation=show_meta --root_path=/path/to/root_path --pb_header_path=path
```

### PB 形式のセグメントメタ情報

このコマンドでは、PB 形式のセグメントメタ情報を表示し、JSON 形式で出力します。

コマンド:

```
./meta_tool --operation=show_segment_footer --file=/path/to/segment/file
```
