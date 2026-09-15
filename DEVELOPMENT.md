# Development Notes

## Behavior

`content.js` handles keyboard navigation on Pixiv pages using the `p` query
parameter. Page 1 is the default when `p` is absent. Pixiv page 1000 is the
hard upper limit, so the extension never generates page 1001 or higher.

Before moving right, the script checks visible `next`/`last` controls and page
links. A disabled next control or a known last page stops navigation. If the
pagination UI has not loaded yet, the script keeps the fallback behavior and
uses page 1000 for `Ctrl + Right`.

## Tests

Run the edge-case tests from this directory:

```bash
node --test content.edge.test.js
```

The suite runs the real content script with a fake DOM and does not require
Chrome or Pixiv.
