( function ( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	var el = element.createElement;
	var registerBlockType = blocks.registerBlockType;
	var useBlockProps = blockEditor.useBlockProps;
	var InspectorControls = blockEditor.InspectorControls;
	var PanelColorSettings = blockEditor.PanelColorSettings;
	var PanelBody = components.PanelBody;
	var RangeControl = components.RangeControl;
	var __ = i18n.__;

	registerBlockType( 'jigsaw-puzzle/puzzle', {
		edit: function ( props ) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var blockProps = useBlockProps( {
				className: 'jigsaw-puzzle-editor-preview',
				style: {
					'--jgp-bg': attributes.bgColor,
					'--jgp-board': attributes.boardColor,
					'--jgp-accent': attributes.accentColor,
					'--jgp-text': attributes.textColor
				}
			} );

			var inspector = el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{ title: __( 'Puzzle settings', 'jigsaw-puzzle-block' ) },
					el( RangeControl, {
						label: __( 'Rows', 'jigsaw-puzzle-block' ),
						value: attributes.rows,
						onChange: function ( v ) {
							setAttributes( { rows: v } );
						},
						min: 2,
						max: 20
					} ),
					el( RangeControl, {
						label: __( 'Columns', 'jigsaw-puzzle-block' ),
						value: attributes.cols,
						onChange: function ( v ) {
							setAttributes( { cols: v } );
						},
						min: 2,
						max: 20
					} )
				),
				el( PanelColorSettings, {
					title: __( 'Colors', 'jigsaw-puzzle-block' ),
					initialOpen: false,
					colorSettings: [
						{
							value: attributes.bgColor,
							onChange: function ( v ) {
								setAttributes( { bgColor: v || '#ffffff' } );
							},
							label: __( 'Background', 'jigsaw-puzzle-block' )
						},
						{
							value: attributes.boardColor,
							onChange: function ( v ) {
								setAttributes( { boardColor: v || '#ebecfe' } );
							},
							label: __( 'Board', 'jigsaw-puzzle-block' )
						},
						{
							value: attributes.accentColor,
							onChange: function ( v ) {
								setAttributes( { accentColor: v || '#aeb8c2' } );
							},
							label: __( 'Accent', 'jigsaw-puzzle-block' )
						},
						{
							value: attributes.textColor,
							onChange: function ( v ) {
								setAttributes( { textColor: v || '#000000' } );
							},
							label: __( 'Text', 'jigsaw-puzzle-block' )
						}
					]
				} )
			);

			var preview = el(
				'div',
				{ className: 'jigsaw-puzzle-editor-mock' },
				el( 'div', { className: 'jgp-mock-board' } ),
				el(
					'div',
					{ className: 'jgp-mock-tray' },
					el( 'div', { className: 'jgp-mock-piece' } ),
					el( 'div', { className: 'jgp-mock-piece' } ),
					el( 'div', { className: 'jgp-mock-piece' } )
				),
				el( 'button', { type: 'button', className: 'jgp-mock-btn', disabled: true }, __( 'Use this photo', 'jigsaw-puzzle-block' ) )
			);

			var body = el(
				'div',
				{},
				el(
					'p',
					{ className: 'jigsaw-puzzle-editor-note' },
					__( 'Jigsaw Puzzle', 'jigsaw-puzzle-block' ) + ' \u2014 ' + attributes.rows * attributes.cols + ' ' + __( 'pieces', 'jigsaw-puzzle-block' )
				),
				el(
					'p',
					{ className: 'jigsaw-puzzle-editor-instructions' },
					__(
						'No image to choose here \u2014 visitors search and pick their own free photo from the WordPress.org Photo Directory when they view this block.',
						'jigsaw-puzzle-block'
					)
				),
				preview
			);

			return el( 'div', blockProps, inspector, body );
		},
		save: function () {
			return null; // Dynamic block: rendered server-side by render_callback.
		}
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );
