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
* `Ctrl + →` jumps to `p=1000`.
* If the actual last page is less than 1000, last-page detection is not currently implemented.

## Version

`0.1.0`

## License

For personal use.
