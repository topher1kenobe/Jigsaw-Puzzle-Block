<?php
/**
 * Plugin Name:       Jigsaw Puzzle Block
 * Description:       Adds a "Jigsaw Puzzle" block. Each front-end visitor searches the WordPress.org Photo Directory and picks their own photo, which becomes an interactive drag-and-drop jigsaw puzzle with real interlocking pieces that snap together.
 * Version:           1.19.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            topher1kenobe
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       jigsaw-puzzle-block
 *
 * @package Jigsaw_Puzzle_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'JIGSAW_PUZZLE_BLOCK_VERSION', '1.19.1' );
define( 'JIGSAW_PUZZLE_BLOCK_DIR', plugin_dir_path( __FILE__ ) );
define( 'JIGSAW_PUZZLE_BLOCK_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register the plugin's scripts and styles ahead of block registration,
 * so block.json can reference them by handle (no build step required).
 */
function jigsaw_puzzle_register_assets() {
	wp_register_script(
		'jigsaw-puzzle-editor-script',
		JIGSAW_PUZZLE_BLOCK_URL . 'assets/editor.js',
		array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
		JIGSAW_PUZZLE_BLOCK_VERSION,
		true
	);

	wp_register_style(
		'jigsaw-puzzle-editor-style',
		JIGSAW_PUZZLE_BLOCK_URL . 'assets/editor.css',
		array(),
		JIGSAW_PUZZLE_BLOCK_VERSION
	);

	wp_register_script(
		'jigsaw-puzzle-view-script',
		JIGSAW_PUZZLE_BLOCK_URL . 'assets/puzzle.js',
		array(),
		JIGSAW_PUZZLE_BLOCK_VERSION,
		true
	);

	wp_register_style(
		'jigsaw-puzzle-style',
		JIGSAW_PUZZLE_BLOCK_URL . 'assets/style.css',
		array(),
		JIGSAW_PUZZLE_BLOCK_VERSION
	);
}
add_action( 'init', 'jigsaw_puzzle_register_assets', 5 );

/**
 * Register the block type from block.json, with a server-side render callback
 * so the puzzle markup (and image URL) is generated fresh on every page load.
 */
function jigsaw_puzzle_register_block() {
	register_block_type(
		JIGSAW_PUZZLE_BLOCK_DIR . 'block.json',
		array(
			'render_callback' => 'jigsaw_puzzle_render_block',
		)
	);
}
add_action( 'init', 'jigsaw_puzzle_register_block', 10 );

/**
 * Register a REST route that proxies searches to the wordpress.org Photo
 * Directory. Calling it server-side avoids browser CORS restrictions
 * entirely, and lets us use WordPress's own REST auth/nonce handling.
 */
function jigsaw_puzzle_register_routes() {
	register_rest_route(
		'jigsaw-puzzle/v1',
		'/photos',
		array(
			'methods'             => 'GET',
			'callback'            => 'jigsaw_puzzle_search_photos',
			'permission_callback' => '__return_true',
			'args'                => array(
				'search' => array(
					'type'    => 'string',
					'default' => '',
				),
				'page'   => array(
					'type'    => 'integer',
					'default' => 1,
				),
			),
		)
	);

	register_rest_route(
		'jigsaw-puzzle/v1',
		'/photo',
		array(
			'methods'             => 'GET',
			'callback'            => 'jigsaw_puzzle_get_photo_by_id',
			'permission_callback' => '__return_true',
			'args'                => array(
				'id' => array(
					'type'    => 'integer',
					'default' => 0,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'jigsaw_puzzle_register_routes' );

/**
 * REST callback: fetch a single photo by ID from wordpress.org and validate
 * that it actually exists, for the ?image= deep-link feature. Never trusts
 * the ID at face value — a request for a nonexistent or malformed ID gets a
 * 404 back, which the front end treats as "fall back to the picker".
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function jigsaw_puzzle_get_photo_by_id( $request ) {
	$id = intval( $request->get_param( 'id' ) );
	$photo = jigsaw_puzzle_fetch_photo_by_id( $id );

	if ( false === $photo ) {
		return new WP_Error( 'jigsaw_puzzle_not_found', __( 'No photo found with that ID.', 'jigsaw-puzzle-block' ), array( 'status' => 404 ) );
	}

	return rest_ensure_response( $photo );
}

/**
 * Resolve a wordpress.org photo ID to its data (full image URL, thumbnail,
 * description, link), validating it against the real Photo Directory and
 * caching the result (including negative "not found" results) for an hour.
 * Used both by the /photo REST route and the Open Graph image override.
 *
 * @param int $id Photo ID.
 * @return array|false Photo data array, or false if invalid/not found.
 */
function jigsaw_puzzle_fetch_photo_by_id( $id ) {
	$id = intval( $id );
	if ( $id <= 0 ) {
		return false;
	}

	$cache_key = 'jgp_photo_' . $id;
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) {
		return empty( $cached['not_found'] ) ? $cached : false;
	}

	$url = add_query_arg(
		array( '_fields' => 'id,link,content,featured_media,photo-thumbnail-url' ),
		'https://wordpress.org/photos/wp-json/wp/v2/photos/' . $id
	);

	$response = wp_remote_get( $url, array( 'timeout' => 12 ) );
	if ( is_wp_error( $response ) ) {
		return false;
	}

	if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
		set_transient( $cache_key, array( 'not_found' => true ), 60 * MINUTE_IN_SECONDS );
		return false;
	}

	$photo = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( ! is_array( $photo ) || empty( $photo['id'] ) || intval( $photo['id'] ) !== $id ) {
		set_transient( $cache_key, array( 'not_found' => true ), 60 * MINUTE_IN_SECONDS );
		return false;
	}

	$media_id  = ! empty( $photo['featured_media'] ) ? intval( $photo['featured_media'] ) : 0;
	$media_map = jigsaw_puzzle_fetch_media_map( array( $media_id ) );

	$result = array(
		'id'          => $photo['id'],
		'thumbnail'   => isset( $photo['photo-thumbnail-url'] ) ? $photo['photo-thumbnail-url'] : '',
		'full'        => isset( $media_map[ $media_id ] ) ? $media_map[ $media_id ] : '',
		'description' => isset( $photo['content']['rendered'] ) ? wp_strip_all_tags( $photo['content']['rendered'] ) : '',
		'link'        => isset( $photo['link'] ) ? $photo['link'] : '',
	);

	if ( empty( $result['full'] ) ) {
		set_transient( $cache_key, array( 'not_found' => true ), 60 * MINUTE_IN_SECONDS );
		return false;
	}

	set_transient( $cache_key, $result, 60 * MINUTE_IN_SECONDS );
	return $result;
}

/**
 * Read and sanitize the ?image= query var: must be a clean positive
 * integer, mirroring the client-side validation used for the deep-link
 * feature. Never trusts the raw value.
 *
 * @return int Sanitized image ID, or 0 if absent/malformed.
 */
function jigsaw_puzzle_get_requested_image_id() {
	if ( empty( $_GET['image'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return 0;
	}
	$raw = sanitize_text_field( wp_unslash( $_GET['image'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! preg_match( '/^[1-9][0-9]{0,14}$/', $raw ) ) {
		return 0;
	}
	return (int) $raw;
}

/**
 * Override Yoast SEO's og:image (and twitter:image) with the puzzle photo
 * when the current page was requested with ?image=<ID>.
 *
 * @param string $image The image URL Yoast would otherwise use.
 * @return string
 */
function jigsaw_puzzle_override_social_image( $image ) {
	$id = jigsaw_puzzle_get_requested_image_id();
	if ( ! $id ) {
		return $image;
	}
	$photo = jigsaw_puzzle_fetch_photo_by_id( $id );
	if ( ! $photo || empty( $photo['full'] ) ) {
		return $image;
	}
	return $photo['full'];
}

/**
 * Add the puzzle photo to Yoast's og:image list when the page has ?image=
 * set, covering pages that wouldn't otherwise have any og:image at all
 * (wpseo_opengraph_image only replaces an image that already exists).
 *
 * @param WPSEO_OpenGraph_Image $image_container Yoast's image container.
 */
function jigsaw_puzzle_add_social_image( $image_container ) {
	$id = jigsaw_puzzle_get_requested_image_id();
	if ( ! $id ) {
		return;
	}
	$photo = jigsaw_puzzle_fetch_photo_by_id( $id );
	if ( $photo && ! empty( $photo['full'] ) ) {
		$image_container->add_image( $photo['full'] );
	}
}

/**
 * Build the "Assemble this jigsaw puzzle!" description text for a photo,
 * prefixed exactly as requested, followed by the photo's own description
 * (used as alt text elsewhere in the plugin) when available.
 *
 * @param array $photo Photo data as returned by jigsaw_puzzle_fetch_photo_by_id().
 * @return string
 */
function jigsaw_puzzle_build_social_description( $photo ) {
	$prefix = __( 'Assemble this jigsaw puzzle!', 'jigsaw-puzzle-block' );
	$alt    = ! empty( $photo['description'] ) ? $photo['description'] : '';
	return trim( $prefix . ( '' !== $alt ? ' ' . $alt : '' ) );
}

/**
 * Override Yoast's og:description/twitter:description (legacy string
 * filter). wpseo_opengraph_desc was deprecated in Yoast SEO 14.0, so this
 * is kept only as a harmless fallback for older installs; the
 * wpseo_frontend_presentation hook below is the primary mechanism.
 *
 * @param string $desc The description Yoast would otherwise use.
 * @return string
 */
function jigsaw_puzzle_override_social_description( $desc ) {
	$id = jigsaw_puzzle_get_requested_image_id();
	if ( ! $id ) {
		return $desc;
	}
	$photo = jigsaw_puzzle_fetch_photo_by_id( $id );
	if ( ! $photo ) {
		return $desc;
	}
	return jigsaw_puzzle_build_social_description( $photo );
}

/**
 * Override og:description/twitter:description via Yoast's current
 * (non-deprecated) frontend presentation object.
 *
 * @param object $presentation Yoast's Indexable_Presentation object.
 * @return object
 */
function jigsaw_puzzle_override_presentation_description( $presentation ) {
	$id = jigsaw_puzzle_get_requested_image_id();
	if ( ! $id ) {
		return $presentation;
	}
	$photo = jigsaw_puzzle_fetch_photo_by_id( $id );
	if ( ! $photo ) {
		return $presentation;
	}
	$desc = jigsaw_puzzle_build_social_description( $photo );
	if ( property_exists( $presentation, 'open_graph_description' ) ) {
		$presentation->open_graph_description = $desc;
	}
	if ( property_exists( $presentation, 'twitter_description' ) ) {
		$presentation->twitter_description = $desc;
	}
	return $presentation;
}

/**
 * Register the Yoast SEO integration, only when Yoast is actually active.
 * WPSEO_VERSION is the constant Yoast itself has used for this exact
 * "is Yoast active" check since its own companion-plugin days.
 */
function jigsaw_puzzle_register_yoast_integration() {
	if ( ! defined( 'WPSEO_VERSION' ) ) {
		return;
	}
	add_filter( 'wpseo_opengraph_image', 'jigsaw_puzzle_override_social_image' );
	add_filter( 'wpseo_twitter_image', 'jigsaw_puzzle_override_social_image' );
	add_filter( 'wpseo_add_opengraph_images', 'jigsaw_puzzle_add_social_image' );
	add_filter( 'wpseo_opengraph_desc', 'jigsaw_puzzle_override_social_description' );
	add_filter( 'wpseo_frontend_presentation', 'jigsaw_puzzle_override_presentation_description' );
}
add_action( 'plugins_loaded', 'jigsaw_puzzle_register_yoast_integration' );

/**
 * Override All in One SEO's Facebook/Open Graph tags (og:image,
 * og:description) with the puzzle photo when the page has ?image=<ID>.
 *
 * @param array $tags The Facebook/Open Graph tags AIOSEO would output.
 * @return array
 */
function jigsaw_puzzle_aioseo_facebook_tags( $tags ) {
	$id = jigsaw_puzzle_get_requested_image_id();
	if ( ! $id ) {
		return $tags;
	}
	$photo = jigsaw_puzzle_fetch_photo_by_id( $id );
	if ( ! $photo ) {
		return $tags;
	}
	if ( ! empty( $photo['full'] ) ) {
		$tags['og:image'] = $photo['full'];
	}
	$tags['og:description'] = jigsaw_puzzle_build_social_description( $photo );
	return $tags;
}

/**
 * Override All in One SEO's Twitter tags (twitter:image,
 * twitter:description) with the puzzle photo when the page has
 * ?image=<ID>.
 *
 * @param array $tags The Twitter tags AIOSEO would output.
 * @return array
 */
function jigsaw_puzzle_aioseo_twitter_tags( $tags ) {
	$id = jigsaw_puzzle_get_requested_image_id();
	if ( ! $id ) {
		return $tags;
	}
	$photo = jigsaw_puzzle_fetch_photo_by_id( $id );
	if ( ! $photo ) {
		return $tags;
	}
	if ( ! empty( $photo['full'] ) ) {
		$tags['twitter:image'] = $photo['full'];
	}
	$tags['twitter:description'] = jigsaw_puzzle_build_social_description( $photo );
	return $tags;
}

/**
 * Register the All in One SEO integration, only when AIOSEO is actually
 * active (checked both by its version constant and its legacy class name,
 * matching the detection pattern used elsewhere in the WordPress
 * ecosystem for this plugin).
 */
function jigsaw_puzzle_register_aioseo_integration() {
	if ( ! defined( 'AIOSEO_VERSION' ) && ! class_exists( 'All_in_One_SEO_Pack' ) ) {
		return;
	}
	add_filter( 'aioseo_facebook_tags', 'jigsaw_puzzle_aioseo_facebook_tags' );
	add_filter( 'aioseo_twitter_tags', 'jigsaw_puzzle_aioseo_twitter_tags' );
}
add_action( 'plugins_loaded', 'jigsaw_puzzle_register_aioseo_integration' );

/**
 * REST callback: search wordpress.org/photos and return a trimmed-down
 * result set with resolved full-size image URLs.
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function jigsaw_puzzle_search_photos( $request ) {
	$search = sanitize_text_field( (string) $request->get_param( 'search' ) );
	$search = substr( $search, 0, 100 );
	$page   = max( 1, intval( $request->get_param( 'page' ) ) );

	$per_page  = 9;
	$cache_key = 'jgp_search_v2_' . md5( $search . '|' . $page . '|' . $per_page );
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) {
		return rest_ensure_response( $cached );
	}

	$query_args = array(
		'page'     => $page,
		'per_page' => $per_page,
		'_fields'  => 'id,link,content,featured_media,photo-thumbnail-url',
	);
	if ( '' !== $search ) {
		$query_args['search'] = $search;
	}

	$url = add_query_arg( $query_args, 'https://wordpress.org/photos/wp-json/wp/v2/photos' );

	$response = wp_remote_get( $url, array( 'timeout' => 12 ) );
	if ( is_wp_error( $response ) ) {
		return new WP_Error( 'jigsaw_puzzle_fetch_failed', $response->get_error_message(), array( 'status' => 500 ) );
	}
	if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return new WP_Error( 'jigsaw_puzzle_fetch_failed', __( 'The photo directory could not be reached.', 'jigsaw-puzzle-block' ), array( 'status' => 502 ) );
	}

	$photos = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( ! is_array( $photos ) ) {
		$photos = array();
	}

	$media_ids = array();
	foreach ( $photos as $photo ) {
		if ( ! empty( $photo['featured_media'] ) ) {
			$media_ids[] = intval( $photo['featured_media'] );
		}
	}
	$media_map = jigsaw_puzzle_fetch_media_map( $media_ids );

	$results = array();
	foreach ( $photos as $photo ) {
		$media_id  = ! empty( $photo['featured_media'] ) ? intval( $photo['featured_media'] ) : 0;
		$results[] = array(
			'id'          => $photo['id'],
			'thumbnail'   => isset( $photo['photo-thumbnail-url'] ) ? $photo['photo-thumbnail-url'] : '',
			'full'        => isset( $media_map[ $media_id ] ) ? $media_map[ $media_id ] : '',
			'description' => isset( $photo['content']['rendered'] ) ? wp_strip_all_tags( $photo['content']['rendered'] ) : '',
			'link'        => isset( $photo['link'] ) ? $photo['link'] : '',
		);
	}

	$total           = intval( wp_remote_retrieve_header( $response, 'x-wp-total' ) );
	$total_pages_hdr = intval( wp_remote_retrieve_header( $response, 'x-wp-totalpages' ) );

	if ( $total_pages_hdr > 0 ) {
		$total_pages = $total_pages_hdr;
	} elseif ( $total > 0 ) {
		$total_pages = (int) ceil( $total / $per_page );
	} else {
		$total_pages = 0; // Unknown: wordpress.org didn't report a usable total.
	}

	// hasMore never depends on the (possibly missing) total headers: a full
	// page of results means there's likely another page, regardless of
	// whether wordpress.org told us the total.
	$has_more = $total_pages > 0
		? ( $page < $total_pages )
		: ( count( $results ) >= $per_page );

	$payload = array(
		'results'    => $results,
		'total'      => $total,
		'totalPages' => $total_pages, // 0 means unknown; treat as "at least $page" on the client.
		'hasMore'    => $has_more,
		'page'       => $page,
	);
	set_transient( $cache_key, $payload, 60 * MINUTE_IN_SECONDS );

	return rest_ensure_response( $payload );
}

/**
 * Resolve an array of wordpress.org media IDs to their largest available
 * image URL, in a single bulk request (with a day-long transient cache
 * per media ID to keep repeat searches fast).
 *
 * @param int[] $ids Media IDs.
 * @return array<int,string> Map of media ID => image URL.
 */
function jigsaw_puzzle_fetch_media_map( $ids ) {
	$ids = array_values( array_unique( array_filter( array_map( 'intval', $ids ) ) ) );
	if ( empty( $ids ) ) {
		return array();
	}

	$map      = array();
	$to_fetch = array();
	foreach ( $ids as $id ) {
		$cached = get_transient( 'jgp_media_' . $id );
		if ( false !== $cached ) {
			$map[ $id ] = $cached;
		} else {
			$to_fetch[] = $id;
		}
	}
	if ( empty( $to_fetch ) ) {
		return $map;
	}

	$url = add_query_arg(
		array(
			'include'  => $to_fetch,
			'per_page' => 100,
			'_fields'  => 'id,source_url,media_details',
		),
		'https://wordpress.org/photos/wp-json/wp/v2/media'
	);

	$response = wp_remote_get( $url, array( 'timeout' => 12 ) );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return $map;
	}

	$items = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( ! is_array( $items ) ) {
		return $map;
	}

	foreach ( $items as $item ) {
		$id = isset( $item['id'] ) ? intval( $item['id'] ) : 0;
		if ( ! $id ) {
			continue;
		}
		$full = '';
		if ( isset( $item['media_details']['sizes']['large']['source_url'] ) ) {
			$full = $item['media_details']['sizes']['large']['source_url'];
		} elseif ( isset( $item['source_url'] ) ) {
			$full = $item['source_url'];
		}
		if ( $full ) {
			$map[ $id ] = $full;
			set_transient( 'jgp_media_' . $id, $full, DAY_IN_SECONDS );
		}
	}

	return $map;
}

/**
 * Server-side render callback for the block.
 *
 * @param array $attributes Block attributes.
 * @return string Block HTML.
 */
function jigsaw_puzzle_render_block( $attributes ) {
	$rows = ! empty( $attributes['rows'] ) ? max( 2, min( 20, intval( $attributes['rows'] ) ) ) : 8;
	$cols = ! empty( $attributes['cols'] ) ? max( 2, min( 20, intval( $attributes['cols'] ) ) ) : 8;

	$bg_color     = jigsaw_puzzle_safe_color( isset( $attributes['bgColor'] ) ? $attributes['bgColor'] : '', '#ffffff' );
	$board_color  = jigsaw_puzzle_safe_color( isset( $attributes['boardColor'] ) ? $attributes['boardColor'] : '', '#ebecfe' );
	$accent_color = jigsaw_puzzle_safe_color( isset( $attributes['accentColor'] ) ? $attributes['accentColor'] : '', '#aeb8c2' );
	$text_color   = jigsaw_puzzle_safe_color( isset( $attributes['textColor'] ) ? $attributes['textColor'] : '', '#000000' );

	$style = sprintf(
		'--jgp-bg:%1$s;--jgp-board:%2$s;--jgp-accent:%3$s;--jgp-text:%4$s;',
		$bg_color,
		$board_color,
		$accent_color,
		$text_color
	);

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'          => 'jigsaw-puzzle-block jigsaw-puzzle-app',
			'style'          => $style,
			'data-api'       => esc_url_raw( rest_url( 'jigsaw-puzzle/v1/photos' ) ),
			'data-photo-api' => esc_url_raw( rest_url( 'jigsaw-puzzle/v1/photo' ) ),
			'data-rows'      => $rows,
			'data-cols'      => $cols,
		)
	);

	return sprintf( '<div %s></div>', $wrapper_attributes );
}

/**
 * Validate a color attribute as a hex color, falling back to a default
 * if it's missing or malformed.
 *
 * @param string $color    Candidate color value.
 * @param string $fallback Fallback hex color.
 * @return string A safe hex color.
 */
function jigsaw_puzzle_safe_color( $color, $fallback ) {
	$sanitized = sanitize_hex_color( $color );
	return $sanitized ? $sanitized : $fallback;
}
