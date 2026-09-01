# Jigsaw Puzzle Block

A WordPress block that turns any moment on a page into an interactive drag-and-drop jigsaw puzzle — except *you* don't pick the photo. Each visitor searches the free [WordPress.org Photo Directory](https://wordpress.org/photos/) and picks their own, right on the published page.

- Real interlocking piece shapes (not just square tiles) that snap together into movable clusters before locking into their final position
- Visitors search, browse the latest photos, load more results (9 at a time, indefinitely), preview any photo larger, or ask to be shown a random one across the *entire* result set
- Fully server-proxied photo search — visitors' browsers never talk to wordpress.org directly, and repeat searches are cached for an hour
- Configurable rows/columns and four color settings (Background, Board, Accent, Text) per block instance
- No build step: the block editor script is plain `wp.element.createElement` calls, no webpack/JSX required to hack on it

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

**From a release zip:**

1. Download the latest `jigsaw-puzzle-block-X.Y.Z.zip`.
2. In wp-admin, go to **Plugins → Add New → Upload Plugin**, choose the zip, and click **Install Now**.
3. Activate the plugin.

**From source (for development):**

```bash
git clone https://github.com/topher1kenobe/jigsaw-puzzle-block.git
cp -r jigsaw-puzzle-block /path/to/wordpress/wp-content/plugins/
```

Then activate it from the Plugins screen as usual.

## Usage

1. Edit a post or page and add the **Jigsaw Puzzle** block.
2. In the block sidebar, set the number of **Rows**/**Columns** (piece count) and, under **Colors**, the Background/Board/Accent/Text colors — the mini preview in the editor updates live as you change them.
3. Publish. There's nothing else to configure — the block doesn't have an image of its own. When a visitor views the page, they'll see a photo search box instead of a puzzle; once they pick (or randomly land on) a photo, the puzzle builds from that.

## How it works

- `jigsaw-puzzle-block.php` registers the block and a REST route (`/wp-json/jigsaw-puzzle/v1/photos`) that proxies searches to wordpress.org's own `/wp-json/wp/v2/photos` endpoint server-side, resolving each photo's full-size image in a single batched request and caching the combined response in a transient for 60 minutes.
- `assets/editor.js` is the Gutenberg editor experience (rows/columns + color pickers + a live mock preview). It has no build step — it's registered directly against the `wp.blocks` / `wp.element` / `wp.blockEditor` globals available in the block editor.
- `assets/puzzle.js` is the front-end engine: the photo picker (search, load-more, random, lightbox preview) and the puzzle itself (piece-shape generation, drag/merge/lock logic). It supports multiple independent puzzle instances on one page.
- `assets/style.css` / `assets/editor.css` hold the front-end and editor-only styles, scoped under `jgp-`/`jigsaw-puzzle-` prefixes to avoid colliding with theme CSS, with the four color attributes exposed as CSS custom properties and the rest of the palette derived from them via `color-mix()`.

## Contributing

Issues and pull requests welcome. This is a small, dependency-free plugin by design — please keep that in mind for anything proposed (e.g. avoid introducing a JS build step or additional runtime dependencies unless there's a strong reason to).

## License

GPL-2.0-or-later. See [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html) or the license header in `jigsaw-puzzle-block.php`.

## Author

[topher1kenobe](https://github.com/topher1kenobe)
