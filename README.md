# Pixiv Keyboard Pagination

A Chrome extension that adds keyboard controls for pagination on Pixiv.

## Features

| Key        | Action             |
| ---------- | ------------------ |
| `←`        | Previous page      |
| `→`        | Next page          |
| `Ctrl + ←` | Jump to first page |
| `Ctrl + →` | Jump to page 1000  |

## Installation

### Load unpacked

1. Open:

   ```text
   chrome://extensions/
   ```

2. Enable **Developer mode**.

3. Click **Load unpacked**.

4. Select the extension directory.

### CRX

The extension can also be packaged as a `.crx` file using Chrome's **Pack extension** function.


## Current Limitations

* The extension assumes Pixiv pagination uses the `p` query parameter.
* `p=1000` is treated as Pixiv's hard upper limit; page `1001` and above are never generated.
* The extension reads Pixiv's visible pagination controls and page links to detect the last page.
* If pagination controls have not loaded yet, `Ctrl + →` falls back to `p=1000`.

## Tests

The edge-case tests run the real `content.js` with a fake DOM, so Chrome and
Pixiv are not required:

```bash
node --test content.edge.test.js
```

The suite covers first-page navigation, middle-page navigation, known last
pages, disabled next controls, invalid `p` values, editable targets, and user
profile routes.

## Version

`0.2.0`

## License

For personal use.
