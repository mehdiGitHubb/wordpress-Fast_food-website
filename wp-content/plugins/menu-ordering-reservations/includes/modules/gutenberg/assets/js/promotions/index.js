( function ( wp ) {

    var registerBlockType = wp.blocks.registerBlockType;

    var el = wp.element.createElement,
        SelectControl = wp.components.SelectControl,
        ButtonControl = wp.components.Button,
        Fragment = wp.element.Fragment,
        InspectorControls = wp.blockEditor.InspectorControls;

    var options = [];
    var restaurants = js_data;

    const { __ } = wp.i18n;

    const menuIcon = el( 'svg',
        {
            width: 18,
            height: 18
        },
        el( 'path',
            {
                d: "M7.61233 16.3288L0 8.71645V10.2716C0 10.6837 0.163288 11.0802 0.458761 11.3679L6.51597 17.4251C7.12247 18.0316 8.10997 18.0316 8.71647 17.4251L13.5451 12.5965C14.1516 11.99 14.1516 11.0025 13.5451 10.396L7.61233 16.3288Z"
            }
        ),
        el( 'path',
            {
                d: "M6.51597 13.5374C6.81922 13.8406 7.21577 13.9961 7.61233 13.9961C8.00889 13.9961 8.40544 13.8406 8.70869 13.5374L13.5374 8.70869C14.1438 8.10219 14.1438 7.11469 13.5374 6.50819L7.48014 0.450986C7.19245 0.163288 6.79589 0 6.38378 0H1.55512C0.699806 0 0 0.699806 0 1.55512V6.38378C0 6.79589 0.163288 7.19245 0.458761 7.48014L6.51597 13.5374ZM1.55512 1.55512H6.38378L12.441 7.61233L7.61233 12.441L1.55512 6.38378V1.55512Z"
            }
        ),
        el( 'path',
            {
                d: "M3.30463 4.27658C3.84143 4.27658 4.27658 3.84143 4.27658 3.30463C4.27658 2.76784 3.84143 2.33268 3.30463 2.33268C2.76784 2.33268 2.33268 2.76784 2.33268 3.30463C2.33268 3.84143 2.76784 4.27658 3.30463 4.27658Z"
            }
        )
    );

    for ( x in restaurants ) {
        options.push( {
            label: restaurants[x]['name'], value: restaurants[x]['uid']
        } );
    }

    registerBlockType( 'menu-ordering-reservations/promotions', {

        title: __( 'Promotions', 'menu-ordering-reservations' ),

        icon: menuIcon,

        category: 'widgets',


        supports: {
            // Removes support for an HTML mode.
            html: false,
        },
        attributes: {
            ruid: {
                default: restaurants[0]['uid'],
                type: 'string'
            },
            layout: {
                type: 'string',
                default: 'grid'
            },
            refresh: {
                type: 'boolean',
                default: 'false'
            }
        },


        edit: function ( props ) {

            const attributes = props.attributes;
            const { serverSideRender: ServerSideRender } = wp;

            var content = props.attributes.content,
                ruid = props.attributes.ruid,
                layout = props.attributes.layout,
                listStyle = props.attributes.listStyle,
                refresh = props.attributes.refresh,
                controlsList = [];

            function onChangeSelectField( newValue ) {
                props.setAttributes( { ruid: newValue } );
            }
            function onChangeLayoutSelectField( newLayout ) {
                props.setAttributes( { layout: newLayout } );
            }
            function onChangeListStyleSelectField( newListStyle ) {
                props.setAttributes( { listStyle: newListStyle } );
            }

            function onChangeRefreshToggle( newRefresh ) {
                props.setAttributes( { refresh: newRefresh } );
            }

            controlsList.push(
                el(
                    InspectorControls,
                    null,
                    el(
                        SelectControl,
                        {
                            label: __( 'Select restaurant', 'menu-ordering-reservations' ),
                            value: ruid,
                            options: options,
                            onChange: onChangeSelectField,
                            className: "gblock"
                        }
                    )
                )
            );
            controlsList.push(
                el(
                    InspectorControls,
                    null,
                    el(
                        SelectControl,
                        {
                            label: __( 'Layout', 'menu-ordering-reservations' ),
                            value: layout,
                            options: [
                                { label: 'Grid layout', value: 'grid' },
                                { label: 'Horizontal Layout', value: 'list' }
                            ],
                            onChange: onChangeLayoutSelectField,
                            className: "gblock"
                        }
                    )
                )
            );
            controlsList.push(
                el(
                    InspectorControls,
                    null,
                    el(
                        ButtonControl,
                        {
                            text: __( 'Refresh Promotions', 'menu-ordering-reservations' ),
                            variant: 'primary',
                            onClick: () => {
                                onChangeRefreshToggle( !props.attributes.refresh )
                            },
                            className: "button glf-refresh-button"
                        }
                    )
                )
            );
            controlsList.push(
                el( 'div', {}, [
                    //Preview a block with a PHP render callback
                    el( ServerSideRender, {
                        block: 'menu-ordering-reservations/promotions',
                        attributes: attributes
                    } ),
                ] )
            );
            return (
                el(
                    Fragment,
                    null,
                    controlsList
                )
            );

        },


        save: function ( props ) {
            var content = props.attributes.content,
                ruid = props.attributes.ruid,
                layout = props.attributes.ruid;

            return null;
        }
    } );


} )(
    window.wp
);
