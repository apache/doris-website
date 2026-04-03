---
{
  "title": "タブレットメタデータ管理ツール",
  "language": "ja",
  "description": "最新バージョンのコードでは、タブレットのメタ情報を保存するためにBEにRocksDBを導入しました。"
}
---
# Tabletメタデータ管理ツール

## 背景

コードの最新バージョンでは、ヘッダーファイルによるメタ情報の保存で生じる様々な機能的・性能的問題を解決するため、tabletのメタ情報を保存するためにBEにRocksDBを導入しました。現在、各データディレクトリ（root path）に対応するRocksDBインスタンスがあり、該当するroot path上のすべてのtabletがkey-value形式で保存されています。

これらのメタデータのメンテナンスを容易にするため、関連する管理操作を完了するためのオンラインHTTPインターフェースとオフラインmeta toolを提供します。

HTTPインターフェースはオンラインでtabletメタデータを表示するためにのみ使用され、BEプロセスが実行されている間に使用できます。

しかし、meta toolはオフラインメタデータ管理操作にのみ使用されます。使用前にBEを停止する必要があります。

meta tool toolはBEのLib/ディレクトリに保存されています。

## 操作

### Tablet Metaの表示

Tablet Meta情報の表示はオンラインとオフラインの方法に分けることができます

#### オンライン

対応するTablet Meta情報を取得するためにBEのHTTPインターフェースにアクセス:

api:

`http://{host}:{port}/api/meta/header/{tablet_id}/{schema_hash}`

> Host: beホスト名
>
> port: BEのHTTPポート
>
> tablet id: tablet id
>
> schema hash: tablet schema hash

例:

`http://be_host:8040/api/meta/header/14156/2458238340`

最終的にクエリが成功した場合、Tablet MetaがJSONとして返されます。

#### オフライン

meta\ tool toolに基づいてディスク上のTablet Metaを取得。

コマンド:

```
./lib/meta_tool --root_path=/path/to/root_path --operation=get_meta --tablet_id=xxx --schema_hash=xxx
```
> root_path: be.conf で設定された対応する root_path パス

結果も JSON 形式での Tablet Meta の表現です。

### Load header

Load header の機能は tablet の手動移行を実現するために提供されています。この機能は JSON 形式の Tablet Meta に基づいているため、shard フィールドやバージョン情報の変更が関わる場合、Tablet Meta の JSON コンテンツで直接変更できます。その後、以下のコマンドを使用してロードします。

コマンド:

```
./lib/meta_tool --operation=load_meta --root_path=/path/to/root_path --json_meta_path=path
```
### Delete header

BEのディスクからタブレットメタを削除する機能を実現するため。単一削除とバッチ削除をサポートします。

単一削除:

```
./lib/meta_tool --operation=delete_meta --root_path=/path/to/root_path --tablet_id=xxx --schema_hash=xxx`
```
バッチ削除:

```
./lib/meta_tool --operation=batch_delete_meta --tablet_file=/path/to/tablet_file.txt
```
`tablet_file.txt`の各行は、タブレットの情報を表します。形式は以下の通りです：

`root_path,tablet_id,schema_hash`

各列はカンマで区切られています。

`tablet_file`の例：

```
/output/be/data/,14217,352781111
/output/be/data/,14219,352781111
/output/be/data/,14223,352781111
/output/be/data/,14227,352781111
/output/be/data/,14233,352781111
/output/be/data/,14239,352781111
```
バッチ削除は、`tablet_file`内の不正なタブレット情報フォーマットの行をスキップします。実行完了後、削除成功数とエラー数が表示されます。

### Pbフォーマットの TabletMeta

このコマンドは、古いファイルベース管理のPBフォーマットTablet Metaを表示し、Tablet MetaをJSON形式で表示するためのものです。

コマンド:

```
./lib/meta_tool --operation=show_meta --root_path=/path/to/root_path --pb_header_path=path
```
### Pb形式でのセグメントメタ

このコマンドは、PB形式のセグメントメタを表示し、セグメントメタをJSON形式で表示するためのものです。

コマンド:

```
./meta_tool --operation=show_segment_footer --file=/path/to/segment/file
```
