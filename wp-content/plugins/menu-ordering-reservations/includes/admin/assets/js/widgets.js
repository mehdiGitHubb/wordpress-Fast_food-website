var GLF = GLF || {};
( function ( $ ) {
    "use strict";
    GLF.core = {
        _doc: '',
        _body: '',
        ajaxRequest: '',

        domLoaded: function () {
            console.log( 'backend widgets domLoaded' );
            GLF.core.init();
        },
        init: function () {
            GLF.core.glf_elementor_editor_events();
        },
        ajaxCall: function ( action, data, onCompleteMethod = '', onCompleteArgs = '' ) {
            GLF.core.ajaxRequest = $.ajax( {
                    url: glf_ajax_url.ajax_url + ( window.location.search.indexOf( 'debug=true' ) > 0 ? '?debug=true' : '' ),
                    type: "POST",
                    data: {
                        action: action,
                        data: data,
                    },
                    dataType: "html",
                    onCompleteMethod: onCompleteMethod,
                    dataFilter: function ( data, dataType ) {
                        return data = {
                            data: $.parseJSON( data ),
                            onCompleteMethod: onCompleteMethod,
                            onCompleteArgs: onCompleteArgs,
                            dataType: 'json'
                        };
                    }
                }
            );
            GLF.core.ajaxRequestFail( GLF.core.ajaxRequest );
            GLF.core.ajaxRequest.done( function ( response ) {
                if( response.onCompleteMethod !== '' ) {
                    GLF.core[response.onCompleteMethod]( response.onCompleteArgs, response );
                } else {
                    console.log( 'ajaxCall DONE -> RESPONSE', response );
                }

            } );
        },
        ajaxRequestFail: function ( request, parent, instance, args ) {
            request.fail( function ( jqXHR, exception ) {
                var messag = "";
                if( jqXHR.status === 0 ) {
                    messag = "Internet not working! Verify network connection!";
                } else if( jqXHR.status == 404 ) {
                    messag = "[404] - Requested page not found. Check that files are on the server!";
                } else if( jqXHR.status == 500 ) {
                    messag = "[500] - Internal Server Error!";
                } else if( exception === 'parsererror' ) {
                    messag = "Requested JSON parse failed!";
                } else if( exception === 'timeout' ) {
                    messag = "Time out error!";
                } else if( exception === 'abort' ) {
                    messag = "Ajax request aborted!";
                } else {
                    messag = "Uncaught Error: " + jqXHR.responseText;
                }
                console.log( 'request.fail', messag );
            } );
        },
    };
    document.addEventListener( "DOMContentLoaded", function ( event ) {
        if( document.readyState === 'interactive' ) {
            GLF.core.domLoaded();
            window.dispatchEvent( new Event( 'resize' ) );
        }
    } );
}( jQuery ) );
