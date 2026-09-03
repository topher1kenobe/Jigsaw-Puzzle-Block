=== Jigsaw Puzzle Block ===
Contributors: topher1kenobe
Tags: block, gutenberg, puzzle, game, image
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.19.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Adds a "Jigsaw Puzzle" block. Rather than picking the photo yourself, each visitor searches the free
WordPress.org Photo Directory and picks their own photo right on the page, which then becomes an
interactive drag-and-drop jigsaw puzzle with real interlocking pieces that snap together and lock
into place.

== Description ==

* Insert the "Jigsaw Puzzle" block anywhere in a post or page, and set the number of rows/columns (piece count) and colors in the block settings.
* No image to choose as the site editor — the photo comes from visitors themselves.
* On the published page, each visitor searches the WordPress.org Photo Directory (or browses the latest photos), can load more results 9 at a time for as long as they like, preview any photo larger before deciding, or ask to be shown a random one, then pick one to build their puzzle.
* Pieces that are correct neighbors snap together into movable clusters even before they're in their
  final spot; a piece (or cluster) only locks permanently once it's in its true position.
* Once solved, a "Do Another Puzzle" button returns to the photo picker so visitors can start over without reloading the page.
* Multiple puzzle blocks can appear on the same page, and different visitors can pick different photos.
* Photo searches are proxied and cached server-side, so visitors never talk to wordpress.org directly and repeat searches are fast.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`, or upload the zip via Plugins > Add New > Upload Plugin.
2. Activate the plugin through the "Plugins" screen.
3. Edit a post/page and add the "Jigsaw Puzzle" block. Set the number of rows/columns and colors in the block's sidebar settings.
4. Publish. Visitors will search for and pick their own photo directly on the page.

== Frequently Asked Questions ==

= Can I link directly to a specific photo's puzzle? =

Yes. Add `?image=<ID>` to any page containing the block (the ID is the WordPress.org photo's numeric ID) and that puzzle loads directly, skipping the picker. Use the "Bookmark this image" button while solving a puzzle to get this link for the current photo. If Yoast SEO or All in One SEO is active, visiting a page this way also rewrites that plugin's og:image/twitter:image and og:description/twitter:description social sharing tags: the image becomes that specific photo, and the description becomes "Assemble this jigsaw puzzle!" followed by the photo's own description. If neither plugin is active, this part simply has no effect — the deep-linking itself still works either way.

= Where do the photos come from? =

The [WordPress.org Photo Directory](https://wordpress.org/photos/), a library of free photos contributed by the WordPress community. The plugin never lets visitors upload their own images or pick from your Media Library — only that directory.

= Can I set a specific photo instead of letting visitors choose? =

Not currently. This plugin is built around visitors choosing their own photo each time they view the block.

= Does this work with multiple puzzle blocks on one page? =

Yes. Each block instance keeps its own state, so different visitors (or the same visitor with multiple blocks) can be working on different photos independently.

= Does this send any visitor data to wordpress.org? =

No. All photo searches go through a REST route registered by this plugin on your own site, which then queries wordpress.org server-side. Visitors' browsers never contact wordpress.org directly.

== Changelog ==

= 1.19.1 =
* All modals (Solved!, image preview, bookmark) now ease in with a fade + subtle scale-up over about half a second, instead of appearing instantly.

= 1.19.0 =
* Yoast SEO integration is now only registered when Yoast is actually active (checked via the WPSEO_VERSION constant, the same technique Yoast's own companion plugins have historically used), instead of always registering harmless-but-unused filters.
* Added equivalent support for All in One SEO (AIOSEO): og:image/og:description and twitter:image/twitter:description are rewritten the same way via AIOSEO's own aioseo_facebook_tags and aioseo_twitter_tags filters, only registered when AIOSEO is detected (via the AIOSEO_VERSION constant or its legacy class name).

= 1.18.0 =
* When a page is visited with ?image=<ID>, the og:description/twitter:description are now also rewritten to "Assemble this jigsaw puzzle!" followed by the photo's own description/alt text. Uses Yoast's current wpseo_frontend_presentation object (open_graph_description/twitter_description properties) as the primary mechanism, with the legacy wpseo_opengraph_desc string filter kept as a harmless fallback for older Yoast installs (it was deprecated in Yoast SEO 14.0).

= 1.17.0 =
* When a page is visited with ?image=<ID> and Yoast SEO is active, the og:image and twitter:image meta tags are now rewritten to use that specific puzzle photo, via Yoast's official wpseo_opengraph_image, wpseo_twitter_image, and wpseo_add_opengraph_images filters. Falls through untouched if there's no ?image= param, if the ID doesn't resolve to a real photo, or if the value is malformed (validated with the same sanitization used for the deep-link feature itself, before any request is made).

= 1.16.0 =
* The "Solved!" message no longer appears as an inline pill above the board. It now opens in a modal (matching the bookmark/image-preview modal style) with a close X in the top-right corner, and "Do Another Puzzle" is a proper button inside it instead of an inline link. The modal appears once per solve; shuffling resets it so a fresh solve can trigger it again.

= 1.15.1 =
* The bookmark modal's Copy button now sits below the URL link instead of beside it.
* Extended the button-color fix from :hover to :active and :focus/:focus-visible too — the same theme-vs-class specificity issue that caused a blue hover was likely also showing up as a colored press/click state.

= 1.15.0 =
* "Bookmark this image" no longer rewrites the address bar. It now opens a modal showing the shareable URL as a clickable link, with a "Copy" button next to it (using the Clipboard API with a textarea-based fallback for older browsers).

= 1.14.1 =
* Fixed buttons showing a blue background on hover on some themes. A theme's `button:hover` selector can actually outrank a plain `.jgp-btn` class in CSS specificity (element+pseudo-class beats a lone class when compared column-by-column), even though the class wins at rest. Added an explicit `.jgp-btn:hover` rule (forcing white background, black text) with higher specificity plus `!important`, so it can't be overridden the same way.

= 1.14.0 =
* The board is now a fixed 700px wide whenever it sits beside the tray, instead of scaling proportionally with the container's width. The tray now absorbs all remaining space via flex instead of getting a proportional share, so widening the page grows the tray, not the board. Below the point where a 700px board plus a minimum-width tray no longer fit side by side, it still stacks with the board at full width, as before.

= 1.13.1 =
* Added a "View Image" button between Shuffle and Bookmark that shows the current puzzle's full source photo in a lightbox with a close X in the top-right corner, so visitors can reference the picture while solving.

= 1.13.0 =
* Added deep-linking: visiting the page with `?image=<ID>` in the URL loads that specific photo's puzzle directly, skipping the picker. The ID is sanitized client-side (must be a clean positive integer) and validated server-side against the real WordPress.org Photo Directory via a new `/photo` REST route — an ID that doesn't correspond to an actual photo falls back to the normal picker rather than showing anything broken.
* Added a "Bookmark this image" button next to Shuffle. Clicking it updates the page's URL (without reloading) to include `?image=<ID>` for the current photo, so visitors can bookmark or share a link straight back to that specific puzzle.

= 1.12.4 =
* Moved the "Pile — drag a piece onto the board" label up into the top controls row, right before the "N of M placed" progress text, instead of sitting on its own line above the tray box.

= 1.12.3 =
* Fixed WordPress Coding Standards issues in jigsaw-puzzle-block.php: added a missing @package tag, split two multi-item associative arrays (the REST route's `search`/`page` args) onto one line per value, fixed an equals-sign alignment inconsistency, and renamed a `$default` function parameter since `default` is a reserved PHP keyword.

= 1.12.2 =
* Fixed "Choose a photo for your puzzle" using a decorative light-gold accent color instead of the actual Text color setting, so it didn't reliably contrast against the chosen Background color.

= 1.12.1 =
* Fixed the "Load 9 more" button never appearing: it relied on wordpress.org sending an X-WP-TotalPages header, which it apparently doesn't always send. Pagination now uses a "hasMore" flag derived from whether a full page of results came back, which doesn't depend on that header at all. If X-WP-Total is present it's used to compute totalPages ourselves as a bonus (improves random-page selection), but nothing depends on it being there.

= 1.12.0 =
* Added a "Load 9 more" button above the photo grid. Each click fetches the next page of results and adds it above everything already loaded, so visitors can keep loading more for as long as they like rather than being limited to the first 9. The button hides automatically once every page has been loaded.
* Set plugin author to topher1kenobe and confirmed GPLv2-or-later licensing throughout.
* Rewrote readme.txt for full WordPress.org plugin directory compliance, and added a separate readme.md for GitHub.

= 1.11.0 =
* The "Solved!" text now sits on its own solid dark pill background, so it stays readable regardless of the page or theme colors behind it (previously it was plain colored text with no background, easy to lose against a light page).
* Added a "Do Another Puzzle" button next to the "Solved!" message that returns to the photo picker so visitors can start a fresh puzzle without reloading the page.

= 1.10.0 =
* "Choose randomly" now opens the lightbox with a large preview instead of jumping straight to the puzzle.
* The lightbox now has a "Choose another randomly" button next to "Use this photo" — keep re-rolling until you land on one you like, then use it or close the lightbox.
* Random selection now pulls from the entire search result set (via the WordPress.org API's total page count), not just the 9 photos currently shown on screen. Verified this actually spans every page, not just the first one.
* The proxy REST route now reports total/totalPages from wordpress.org's response so the front end can reach beyond the current page.

= 1.9.4 =
* Board now takes a proportional share (~68%) of the available width side-by-side, instead of always maxing out at 1000px and leaving the tray cramped at its bare minimum on wide content columns. Raised the board's upper bound to 1100px. Added a structural guarantee that the tray always keeps at least its minimum width when side-by-side is chosen, fixing a small inconsistency right at the threshold boundary.

= 1.9.3 =
* Lowered the side-by-side threshold from 860px to 532px, and shrank the tray/board minimum widths accordingly. The previous threshold was too high for a typical WordPress content column (often 700-900px when the block isn't set to wide/full alignment), so it was stacking far more often than necessary.

= 1.9.2 =
* Fixed the board still ending up narrower than the container with the pile stuck below it and wasted space on wide pages. The previous "full width when stacked" fallback was accidentally still capped at 1000px, and the JS test used to decide stacked-vs-side-by-side was unreliable. Replaced both with a single deterministic width calculation that's been verified to always agree with what the CSS layout can actually fit.

= 1.9.1 =
* Removed a hardcoded dark-brown button hover state left over from the old dark-theme default, which clashed badly with the new light theme default.

= 1.9.0 =
* The pile is now always to the right of the board (using explicit flex order and forced LTR layout), regardless of the site's theme or language text direction. It still moves below the board on narrow screens, as before.
* The block editor now shows a live mini preview (a mock board, tray with sample pieces, and a sample button) that updates immediately as you change colors in the Colors panel, instead of a plain placeholder box.

= 1.8.0 =
* Changed the default color scheme to a light theme: white background, pale lavender board, gray accent, black text (was a dark wood/felt/gold theme). New blocks use these by default; existing blocks with colors already set are unaffected.

= 1.7.1 =
* Fixed the lightbox's "Use this photo" button and close icon being nearly unreadable: the lightbox was appended to document.body, outside the block wrapper where the theme's color variables are defined, so they fell back to nothing. It's now appended inside the block wrapper (position:fixed still covers the full viewport, so this doesn't change how it looks/behaves otherwise).
* The lightbox's Use button and close icon are now explicitly white with black text/icon, so they stay readable regardless of the block's chosen colors.

= 1.7.0 =
* Fixed a bug where sites that had already searched before the 9-per-page change could keep seeing 20 results for up to an hour, because the 60-minute cache key didn't account for the per_page value changing. The cache key is now versioned so this kind of change can't silently serve stale results again.
* Each photo tile now has two buttons: "Use" (builds the puzzle from that photo immediately) and "Enlarge" (opens a full-size preview in a lightbox).
* The lightbox preview also has its own "Use this photo" button, so visitors can commit to a photo after previewing it larger without going back to the grid.

= 1.6.0 =
* Photo search now returns 9 results at a time (was 20), matching the 3-column grid exactly (3 rows of 3).
* Fixed the board not using full width when the layout is narrow enough that the pile wraps below it instead of sitting beside it. The board now actually checks whether the pile wrapped and re-sizes itself to fill the available width when it did, instead of guessing with a fixed reserve.

= 1.5.0 =
* Fixed a sizing bug where photo tiles in the picker shrank to their thumbnail's natural size instead of filling their grid cell; tiles now fill the space with proper padding around each photo.
* Hardened buttons and the search input against theme CSS bleed-through (some themes style bare `<button>`/`<input>` elements with their own colors, letter-spacing, and native browser chrome that could override the plugin's styling).
* Added four color settings in the block sidebar (Background, Board, Accent, Text) under a new "Colors" panel, with the rest of the palette derived automatically for a coherent look.

= 1.4.0 =
* Photo picker grid is now a fixed 3-column layout with larger tiles (was a cramped auto-fill grid).
* Added a "Choose randomly" button that picks a random photo from the currently loaded results.
* Search results (including resolved full-size image URLs) are now cached in a transient for 60 minutes, so repeated searches for the same term skip the request to wordpress.org entirely.

= 1.3.0 =
* Changed: the photo is no longer chosen in the block editor. Instead, each visitor searches the WordPress.org Photo Directory and picks their own photo when they view the block on the published page.
* Removed the Media Library / upload option entirely — photos now come only from the WordPress.org Photo Directory.
* The search REST route is now public (unauthenticated), since front-end visitors need to call it, not just logged-in editors.
* The block editor now only controls rows/columns; there's no image preview since the photo isn't known until a visitor picks one.

= 1.2.0 =
* Added a "Search WordPress.org Photos" option in the block editor: search and pick free photos from the WordPress.org Photo Directory without leaving the editor.
* Added a server-side REST proxy so photo searches never hit CORS issues and stay authenticated through WordPress's own REST API.
* Added an optional attribution link on the front end when a photo is sourced from the Photo Directory.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.3.0 =
This version changes where the photo comes from: it's now chosen by each front-end visitor instead of in the block editor. Existing blocks will show the photo picker to visitors on next view.
