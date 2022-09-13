# How to use  `<versions>`

You can wrap a piece of Markdown content using the <versions>, and set the version number, like this:

```html
<versions value="1.1,1.2">
    This is markdown content...
</versions>
```
> Tips: the value must be a string that split by commas.

Then in our website, the MarkDown content will show the version number to which it belongs.

If you want to build a single version docs, you can update buildVersions.json:

```json
["1.1", "1.2"]
```
Then run the build:versions command.


