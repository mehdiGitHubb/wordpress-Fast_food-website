<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly

if ( ! class_exists( 'Glf_Module_Shortcodes' ) ) {

	/**
	 * GloriaFood Gutenberg Blocks implementation
	 *
	 * @since 1.1.0
	 */
	class Glf_Module_Shortcodes {

		private static $_instance = null;

		public function __construct() {
			add_shortcode( 'restaurant-menu-and-ordering', array( 'Glf_Module_Shortcodes', 'add_ordering_shortcode' ) );
			add_shortcode( 'restaurant-reservations', array( 'Glf_Module_Shortcodes', 'add_reservations_shortcode' ) );
			add_shortcode( 'restaurant-full-menu', array( 'Glf_Module_Shortcodes', 'add_menu_shortcode' ) );
			add_shortcode( 'restaurant-opening-hours', array( 'Glf_Module_Shortcodes', 'add_opening_hours' ) );
			add_shortcode( 'restaurant-promotions', array( 'Glf_Module_Shortcodes', 'add_promotions' ) );
		}

        public static function classic_tracking( $added, $atts, $option ) {
            $currentOption = Glf_Utils::glf_get_from_wordpress_options( 'classic_' . $option, 'false' );
            Glf_Utils::glf_add_to_wordpress_options( 'classic_' . $option, 'true' );
            Glf_Utils::glf_add_to_wordpress_options( $option, 'true' );

            if ( $currentOption === 'false' ) {
                $data = array(
                    'type' => 'added',
                    'added' => $added,
                    'editor' => 'classic',
                    'ruid' => $atts[ 'ruid' ]
                );
                Glf_Utils::glf_tracking_send( $data );
            }
        }
		public static function add_ordering_shortcode( $atts, $source = '' ) {
            if ( empty( $source ) ) {
                Glf_Utils::glf_prepare_tracking_data('ordering', $atts, 'classic', 'button_ordering' );
            }
			return self::add_shortcode( 'ordering', $atts );
		}

		public static function add_reservations_shortcode( $atts, $source = '' ) {
		    if( empty( $source ) ){
                Glf_Utils::glf_prepare_tracking_data( 'reservations', $atts, 'classic', 'button_reservations' );
            }

			return self::add_shortcode( 'reservations', $atts );
		}

		public static function add_shortcode( $type, $atts ) {
			extract( shortcode_atts( array(
				'ruid' => 'ruid'
			), $atts ) );


			if ( ! isset( $atts[ 'ruid' ] ) ) {
				$atts[ 'ruid' ] = '';
			}
			if ( ! isset( $atts[ 'rid' ] ) ) {
				$atts[ 'rid' ] = '';
			}


			$label     = '';
			$extraAttr = '';
			$extraCss  = '';
			switch ( $type ) {
				case 'ordering':
					$label = 'See MENU & Order';
					break;
				case 'reservations':
					$label     = 'Table Reservation';
					$extraAttr = 'data-glf-reservation="true"';
					$extraCss  = 'reservation';
					break;
			}
			// output all location labels
			// display only the selected label by using data-location attribute
			$labelArgs = array(
				'type'      => $type,
				'ruid'      => $atts[ 'ruid' ],
				'rid'       => $atts[ 'rid' ],
				'extraAttr' => $extraAttr,
				'extraCss'  => $extraCss,
			);

			if ( isset( $atts[ 'class' ] ) ) {
                $atts[ 'class' ] = esc_attr($atts[ 'class' ] );
                $labelArgs[ 'class' ] = $atts[ 'class' ];
			}
			$custom_labels = Glf_Utils::get_all_locations_labels( $labelArgs, Glf_Utils::$_GLF->custom_css );
			$inline_css    = '';

			if ( ! empty( $custom_labels ) && is_array( $custom_labels ) ) {
				$label      = $custom_labels[ 'labels' ];
				$inline_css = '<style>' . ' .glf-' . $type . '-location > span{display:none;} ' . $custom_labels[ 'css' ] . '</style>';
			}


			if ( isset( $atts[ 'class' ] ) ) { // basic || custom
				$html = '<a href="#"><span class="glf-button-default ' . $atts[ 'class' ] . '" data-glf-cuid="" data-glf-ruid="' . $atts[ 'ruid' ] . '" ' . $extraAttr . '>' . $label . '</span></a>';
			} else {
				//$html = '<span class="glf-' . $type . '-location glf-button-' . $type . '-label glf-button-default glf-button ' . $extraCss . '" style=\'' . $customCss . '\'  data-glf-cuid="" data-glf-ruid="' . $atts['ruid'] . '" ' . $extraAttr . ' data-location="' . $atts['rid'] . '">' . $label . '</span>';
				$html = $label;
			}
			$html .= '<script src="https://www.fbgcdn.com/embedder/js/ewm2.js" defer async ></script>';
			$html .= $inline_css;

			return $html;
		}

		public static function add_menu_shortcode( $atts ) {
			extract( shortcode_atts( array( 'ruid' => '' ), $atts ) );

			if ( empty( $atts[ 'ruid' ] ) ) {
				return '';
			}
			$restaurant_menu = self::glf_mor_restaurant_menu( $atts[ 'ruid' ] );
			if ( ! $restaurant_menu ) {
				return '';
			}
			$html = '';
			if ( ! empty( $restaurant_menu->categories ) ) {
			    $currency_config = isset( $restaurant_menu->currency_config, $restaurant_menu->currency_config->decimals ) ? $restaurant_menu->currency_config->decimals : '2';
				foreach ( $restaurant_menu->categories as $cat_index => $category ) {
					if ( ! empty( $category->items ) ) {
						$html .= '<div class="glf-mor-restaurant-menu-category"><h3>' . $category->name ;
                        if ( ! empty( $category->description)) {
                            $html .= '<div class="glf-mor-restaurant-menu-category-description">' . $category->description . '</div>';
                        }
                        $html .= '</h3>';
						foreach ( $category->items as $item_index => $item ) {
                            $price_from_text = ( is_array( $item->sizes) && count( $item->sizes ) > 1 );
							$picture = $item->picture ? '<picture>
                                            <img class="" alt="' . $item->name . '" src="' . $item->picture . '">
                                        </picture>' : '';
							$html    .= '<hr>

                            <div class="glf-mor-restaurant-menu-item"><div class="glf-mor-restaurant-menu-item-inner">' . $picture . '
                            <div style="width: 100%">
                                <div class="glf-mor-restaurant-menu-item-header">';
                                    $html .= '<h5 class="glf-mor-restaurant-menu-item-name">' . $item->name . '</h5>';
                                    $html .= '<div class="glf-mor-restaurant-menu-item-price" data-price="' . $item->price . '" data-currency="' . $restaurant_menu->currency . '" data-decimals="' . $currency_config . '">';
                                    if ( $price_from_text ) {
                                        $html .= '<span class="from">' . __( 'From', 'menu-ordering-reservations' ) . '</span>';
                                    }
                                    $html .= '<span class="price">' . $item->price . ' ' . $restaurant_menu->currency . '</span></div>
                                </div>
                                ' . ( empty( $item->description ) ? '' : '<div class="glf-mor-restaurant-menu-item-description">' . $item->description . '</div>' ) . '
                            </div>
                        </div></div>';
						}

						$html .= '<hr></div>';
					}
				}
			}

			$locale = false;

			$restaurant_data_obj = Glf_Utils::glf_more_restaurant_data();

			if ( $restaurant_data_obj ) {
				foreach ( $restaurant_data_obj->restaurants as $restaurant ) {
					if ( $restaurant->uid === $atts[ 'ruid' ] ) {
						$locale = $restaurant->locale;
					}
				}
			}


			if ( ! empty( $html ) ) {
				$html = '<div class="glf-mor-restaurant-menu-wrapper">' . $html . '</div>
            <script type="text/javascript">
                document.addEventListener( "DOMContentLoaded", function ( event ) {
                if (typeof jQuery != "undefined") {
                    jQuery(document).ready(function() {
                           jQuery(".glf-mor-restaurant-menu-item-price").each(function() {
                                const el=jQuery(this);
                                const el_Price=jQuery(this).find("> span.price");
                                const price=parseFloat(el.data("price"));
                                const currency= el.data("currency")
                                const numberOfDigits = parseInt( el.data("decimals") );
                                const localeStringOptions = {
                                    style:"currency",
                                    currency: currency,
                                    minimumFractionDigits: numberOfDigits,
                                    maximumFractionDigits: numberOfDigits                                    
                                }; 
                                el_Price.html(price.toLocaleString(' . ($locale ? '\'' . $locale . '\'' : 'navigator.language') . ', localeStringOptions))
                            });
                       });
                    }
                });
            </script>';
                if ( Glf_Utils::glf_check_if_classic_editor( $atts ) )
                    Glf_Utils::glf_prepare_tracking_data( 'menu', $atts, 'classic', 'menu_widget' );
			}

			return $html;
		}

		public static function add_opening_hours( $atts ){
            extract( shortcode_atts( array( 'ruid' => '' ), $atts ) );

            if ( empty( $atts[ 'ruid' ] ) ) {
                return '';
            }
            $html = '';
            $restaurant = Glf_Utils::get_restaurant_data_by_location( $atts[ 'ruid' ] );
            // prevent old shortcodes from other accounts to run
            // an empty result
            if( empty( $restaurant ) ){
                return '';
            }
            $country_code = $restaurant->country_code;
            $opening_hours_array = $restaurant->restaurant_open_hours;
            $schedule_translations = array(
                'opening' => __( 'Opening Hours', 'menu-ordering-reservations' ),
                'pickup' => __( 'Pickup Service', 'menu-ordering-reservations' ),
                'delivery' => __( 'Delivery Service', 'menu-ordering-reservations' ),
                'reservation' => __( 'Reservations', 'menu-ordering-reservations' ),
                'preserve' => __( 'Table Reservations', 'menu-ordering-reservations' ),
            );
            $day_names = array(
                __( 'Monday', 'menu-ordering-reservations' ),
                __( 'Tuesday', 'menu-ordering-reservations' ),
                __( 'Wednesday', 'menu-ordering-reservations' ),
                __( 'Thursday', 'menu-ordering-reservations' ),
                __( 'Friday', 'menu-ordering-reservations' ),
                __( 'Saturday', 'menu-ordering-reservations' ),
                __( 'Sunday', 'menu-ordering-reservations' ),
            );

            if ( is_array( $opening_hours_array ) && !empty( $opening_hours_array ) ) {
                $opening_hours_array = Glf_Utils::group_same_schedule_type( $opening_hours_array );

                $html .= '<div class="glf-widget-opening-hours">
                            <div class="wood-background" lazy-style="background-image: url(\'https://d2skenm2jauoc1.cloudfront.net/websites/img/wood2.png\')" style="background-image: url(\'https://d2skenm2jauoc1.cloudfront.net/websites/img/wood2.png\')"></div> 
                            <div class="wood-border-1"></div> 
                            <div class="wood-border-2"></div>
                            <div id="glf-opening-data" style="display: none;">' .
                            '<span class="types">' . htmlspecialchars( json_encode( $schedule_translations ) ) . '</span>' .
                            '<span class="hours">' . htmlspecialchars( json_encode( $opening_hours_array ) ) . '</span>' .
                            '<span class="country">' . $country_code . '</span>' .
                            '<span class="days">' . htmlspecialchars( json_encode( $day_names ) ) . '</span>' .
                            '</div>
                            <div class="content" >
                            </div >
                        </div >';
            }
            if ( Glf_Utils::glf_check_if_classic_editor( $atts ) )
                Glf_Utils::glf_prepare_tracking_data( 'opening-hours', $atts, 'classic', 'opening_hours_widget' );

            return $html;
        }

		public static function add_promotions( $atts ){
            extract( shortcode_atts( array( 'ruid' => '' ), $atts ) );

            if ( empty( $atts[ 'ruid' ] ) ) {
                return '';
            }
            // prevent old shortcodes from other accounts to run
            // an empty result
            if ( empty( Glf_Utils::get_restaurant_data_by_location( $atts[ 'ruid' ] ) ) ) {
                return '';
            }

            if ( !isset( $atts[ 'layout' ] ) ) {
                $atts[ 'layout' ] = 'grid';
            }
            $html = '';

            $promotions = self::glf_restaurant_widget_data( 'promotions', $atts[ 'ruid' ], true );

            $totalPromotions = count( $promotions );

            $html .= '<div id class="glf-widget-promotions">';
                $html .= '<div class="glf-promotions-list type-' . $atts[ 'layout' ] . '">';


                for( $i = 0; $i < $totalPromotions; $i++ ){
                    $html .= '<div class="glf-promotion-deal">';

                        if ( !empty( $promotions[ $i ]->picture ) ) {
                            $html .= '<div class="deal-background" style="background-image:url(' . $promotions[ $i ]->picture . ');"></div>';
                        }

                        $html .= '<div class="deal-details">';
                            $html .= '<div class="details-text">';
                                $html .= '<h3 class="deal-title">' . $promotions[ $i ]->name . '</h3>';
                                $html .= '<div class="deal-description">';
                                    $html .= '<p>' . $promotions[ $i ]->description . '</p>';
                                $html .= '</div>';

                                $html .= self::get_promotion_conditions( $promotions[ $i ], $atts[ 'layout' ] );
                            $html .= '</div>';
                            //$html .= '<div id="" class="deal-button" href="#">View deal</div>';
                        $html .= '</div>';
                    $html .= '</div>';
                }

                $html .= '</div>';
            $html .= '</div >';



            return $html;
        }

        public static function get_promotion_conditions( $promo_conditions, $layout ){
            $returnHTML = '';
            if( $layout !== 'list' ){
                return $returnHTML;
            }
            if ( property_exists( $promo_conditions, 'fulfillConditions' ) ) {
                $fulfillConditions = $promo_conditions->fulfillConditions;
                if ( is_array( $fulfillConditions ) && count( $fulfillConditions ) > 0 ) {
                    $returnHTML .= '<div class="deal-conditions">';
                        $returnHTML .= '<p>' . __( 'Conditions', 'menu-ordering-reservations' ) . ':</p>';
                        $returnHTML .= '<ul class="deal-list">';
                        foreach ( $fulfillConditions as $condition ){
                            $returnHTML .= '<li class="deal-condition">' . $condition . '</li>';
                        }
                        $returnHTML .= '</ul>';
                    $returnHTML .= '</div>';
                }
            }
            return $returnHTML;
        }

		public static function glf_mor_restaurant_menu( $restaurantUid, $forceRefresh = false ) {
			if ( $forceRefresh ) {
				$restaurant_menu = self::glf_mor_restaurant_menu_get_and_cache( $restaurantUid );
			} else {
				$restaurant_menu = get_transient( 'glf_mor_restaurant_menu' . $restaurantUid );

				if ( false === $restaurant_menu ) {
					$restaurant_menu = self::glf_mor_restaurant_menu_get_and_cache( $restaurantUid );
				}
			}

			return $restaurant_menu;
		}

		public static function glf_mor_restaurant_menu_get_and_cache( $restaurantUid, $cacheTime = 3600 ) {
			$restaurant_menu = Glf_Utils::$_GLF->glf_mor_api_call( "/restaurant/$restaurantUid/menu?active=true&pictures=true" );
			set_transient( 'glf_mor_restaurant_menu' . $restaurantUid, $restaurant_menu, $cacheTime );

			return $restaurant_menu;
		}

		public static function glf_restaurant_widget_data( $type, $restaurantUid, $forceRefresh = false ){
            if ( $forceRefresh ) {
                $restaurant_widget_data = self::glf_restaurant_widgets_get_data_and_cache( $type, $restaurantUid );
            } else {
                $restaurant_widget_data = get_transient( 'glf_mor_restaurant_' . $type . $restaurantUid );
                if ( false === $restaurant_widget_data ) {
                    $restaurant_widget_data = self::glf_restaurant_widgets_get_data_and_cache( $type, $restaurantUid );
                }
            }

            return $restaurant_widget_data;
        }

		public static function glf_restaurant_widgets_get_data_and_cache( $type, $restaurantUid, $cacheTime = 3600 ){
		    $restaurant_widget_data = Glf_Utils::$_GLF->glf_mor_api_call( "/restaurant/$restaurantUid/" . $type  ."?active=true&pictures=true" );
            set_transient( 'glf_mor_restaurant_' . $type . $restaurantUid, $restaurant_widget_data, $cacheTime );

            return $restaurant_widget_data;
        }

        public static function glf_mor_restaurant_opening_hours( $restaurantUid, $forceRefresh = false ) {
            $restaurant_opening_hours = get_transient( 'glf_mor_restaurant_opening_hours_' . $restaurantUid );
            if ( false === $restaurant_opening_hours ) {
                $restaurant_opening_hours = self::glf_mor_restaurant_opening_hours_get_and_cache( $restaurantUid );
            }

            return $restaurant_opening_hours;
        }

		public static function glf_mor_restaurant_opening_hours_get_and_cache( $restaurantUid, $cacheTime = 3600 ) {
            Glf_Utils::$_GLF->update_restaurants();
            $restaurant_opening_hours = Glf_Utils::glf_more_restaurant_data( 'true', 'true' );
			set_transient( 'glf_mor_restaurant_opening_hours_' . $restaurantUid, $restaurant_opening_hours, $cacheTime );

			return $restaurant_opening_hours;
		}

        public static function glf_mor_restaurant_promotions( $restaurantUid, $forceRefresh = false ) {
            $restaurant_promotions = get_transient( 'glf_mor_restaurant_promotions_' . $restaurantUid );
            if ( false === $restaurant_promotions ) {
                $restaurant_promotions = self::glf_mor_restaurant_promotions_get_and_cache( $restaurantUid );
            }

            return $restaurant_promotions;
        }

		public static function glf_mor_restaurant_promotions_get_and_cache( $restaurantUid, $cacheTime = 3600 ) {
            Glf_Utils::$_GLF->update_restaurants();
            $restaurant_promotions = Glf_Utils::glf_more_restaurant_data( 'true', 'true' );
			set_transient( 'glf_mor_restaurant_opening_hours_' . $restaurantUid, $restaurant_promotions, $cacheTime );

			return $restaurant_promotions;
		}
	}

	new Glf_Module_Shortcodes();
}
