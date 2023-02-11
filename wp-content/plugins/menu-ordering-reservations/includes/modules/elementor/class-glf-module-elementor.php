<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly

if ( ! class_exists( 'Glf_Module_Elementor' ) ) {

	/**
	 * GloriaFood Elementor Module implementation
	 *
	 * @since 1.5.0
	 */
	class Glf_Module_Elementor {

		public function __construct() {

			add_action( 'elementor/editor/wp_head', array( $this, 'elementor_panel_style' ) );
			add_action( 'elementor/elements/categories_registered', array( $this, 'add_elementor_widget_categories' ) );

			/**
             * GLF widget registration action. To be removed in future versions
             *
             * @since 1.5.0
             * @deprecated 2.1.0 New widgets are available {@see 'glf_elementor_widgets'}
             *
             * @action Registers GLF restaurant widgets.
             */
			add_action( 'elementor/widgets/widgets_registered', array( $this, 'glf_elementor_restaurant_widget' ) );

			add_action( 'elementor/widgets/widgets_registered', array( $this, 'glf_register_elementor_widgets' ) );

            add_action( 'elementor/editor/after_save', array( $this, 'glf_after_save_elementor' ), 10 , 2 );

            if ( wp_doing_ajax() ) {
                $this->add_elementor_widget_ajax();
            }

		}

		public function add_elementor_widget_ajax(){
            add_action( 'wp_ajax_glf_refresh_elementor_widget', array( $this, 'refresh_elementor_widget' ) );
        }

		public function refresh_elementor_widget() {
            $action = isset( $_POST[ 'action' ] ) ? $_POST[ 'action' ] : '';
		    $response = array(
                'action' => $action ,
		        'status' => 'failure'

            );

            if ( Glf_Utils::glf_capabilities_check() ) {
                Glf_Utils::glf_capabilities_check_failed( $response );
            }

            if( isset( $_POST['action'] ) && $_POST['action'] === 'glf_refresh_elementor_widget' ){
                $response['status'] = 'success';
                $response['message'] = 'Done!';
                $response['data'] = $_POST;
            }
            echo json_encode( $response );
            exit;
        }

		public function add_elementor_widget_categories( $elements_manager ) {

			$elements_manager->add_category(
				'gloria-food',
				[
					'title' => __( 'Gloria Food - Restaurant', 'menu-ordering-reservations' )
				]
			);
			$elements_manager->add_category(
				'gloria-food-old',
				[
					'title' => __( 'Gloria Food - Deprecated Widgets', 'menu-ordering-reservations' )
				]
			);
			
		}


        /**
         * GLF register elementor widgets.
         *
         * Register all GLF widgets with elementor
         *
         * @return void
         * @since 2.1.0
         *
         */
		public function glf_register_elementor_widgets() {

			require_once 'widgets/base/class-glf-widget-button-base.php';
			require_once 'widgets/menu-ordering/class-glf-widget-ordering.php';
			require_once 'widgets/reservations/class-glf-widget-reservations.php';
            require_once 'widgets/food-menu/class-glf-module-elementor-food-menu-widget.php';
            require_once 'widgets/opening-hours/class-glf-module-elementor-opening-hours-widget.php';
            require_once 'widgets/promotions/class-glf-module-elementor-promotions-widget.php';

			Elementor\Plugin::instance()->widgets_manager->register_widget_type( new Glf_Widget_Ordering() );
			Elementor\Plugin::instance()->widgets_manager->register_widget_type( new Glf_Widget_Reservations() );
			Elementor\Plugin::instance()->widgets_manager->register_widget_type( new Glf_Module_Elementor_Food_Menu_Widget() );
			Elementor\Plugin::instance()->widgets_manager->register_widget_type( new Glf_Module_Elementor_Opening_Hours_Widget());
			Elementor\Plugin::instance()->widgets_manager->register_widget_type( new Glf_Module_Elementor_Promotions_Widget());

		}

		public function elementor_panel_style() {
			wp_enqueue_style( 'glf_elementor_panel_style', plugins_url( 'assets/css/glf-elementor-widget.css', __FILE__ ), false, Glf_Utils::$_GLF->version );

            wp_enqueue_script( 'glf_widgets_backend', GLF_PLUGIN_URL . 'includes/admin/assets/js/widgets.js', false, Glf_Utils::$_GLF->version );
            wp_localize_script( 'glf_widgets_backend', 'glf_ajax_url', array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );
		}


        /**
         * Older widgets. To be removed in future versions
         * This will be used only when old widgets were used through out the website
         *
         * @since 1.5.0
         * @deprecated 2.1.0 New widgets are available {@see 'glf_register_elementor_widgets'}
         *
         * @action Register GLF restaurant widgets.
         */
        public function glf_elementor_restaurant_widget() {
            if( get_option( 'glf_check_old_widgets_elementor', 'no' ) === 'yes' ){
                require_once 'widgets/menu-ordering/class-glf-module-elementor-ordering-widget.php';
                require_once 'widgets/reservations/class-glf-module-elementor-reservations-widget.php';

                Elementor\Plugin::instance()->widgets_manager->register_widget_type( new Glf_Module_Elementor_Ordering_Widget() );
                Elementor\Plugin::instance()->widgets_manager->register_widget_type( new Glf_Module_Elementor_Reservations_Widget() );
            }

        }

        public function glf_after_save_elementor( $post_id, $editor_data)
        {
            $orderingWidgets = [];
            $reservationWidgets = [];
            $menuWidgets = [];
            $promotionWidgets = [];
            $openingHoursWidgets = [];

            $columns = array_merge(...array_column($editor_data, 'elements'));
            $widgets = array_merge(...array_column($columns, 'elements'));
            if (!empty($widgets)) {
                foreach ($widgets as $widget) {
                    $widgetType = $widget['widgetType'];
                    switch ($widgetType) {
                        case "glf_elementor_widget_ordering":
                            $orderingWidgets[] = $widget['id'];
                            break;
                        case "glf_elementor_widget_reservations":
                            $reservationWidgets[] = $widget['id'];
                            break;
                        case "glf_elementor_food_menu":
                            $menuWidgets[] = $widget['id'];
                            break;
                        case "glf_elementor_promotions":
                            $promotionWidgets[] = $widget['id'];
                            break;
                        case "glf_elementor_opening_hours":
                            $openingHoursWidgets[] = $widget['id'];
                            break;
                    }
                }

                $currentOrderingIds = Glf_Utils::glf_get_from_wordpress_options('ordering_widget_ids', []);
                $currentReservationIds = Glf_Utils::glf_get_from_wordpress_options('reservations_widget_ids', []);
                $currentMenuIds = Glf_Utils::glf_get_from_wordpress_options('menu_widget_ids', []);
                $currentPromotionIds = Glf_Utils::glf_get_from_wordpress_options('promotions_widget_ids', []);
                $currentOpeningHoursIds = Glf_Utils::glf_get_from_wordpress_options('opening_hours_widget_ids', []);

                $deletedOrderingIds = array_diff($currentOrderingIds, $orderingWidgets);
                $deletedReservationIds = array_diff($currentReservationIds, $reservationWidgets);
                $deletedMenuIds = array_diff($currentMenuIds, $menuWidgets);
                $deletedPromotionIds = array_diff($currentPromotionIds, $promotionWidgets);
                $deletedOpeningHoursIds = array_diff($currentOpeningHoursIds, $openingHoursWidgets);

                //remove deleted widgets
                if (!empty($deletedOrderingIds)) {
                    $currentOrderingIds = array_diff($currentOrderingIds, $deletedOrderingIds);
                    Glf_Utils::glf_add_to_wordpress_options('ordering_widget_ids', $currentOrderingIds);
                }
                if (!empty($deletedReservationIds)) {
                    $currentReservationIds = array_diff($currentReservationIds, $deletedReservationIds);
                    Glf_Utils::glf_add_to_wordpress_options('reservations_widget_ids', $currentReservationIds);
                }
                if (!empty($deletedMenuIds)) {
                    $currentMenuIds = array_diff($currentMenuIds, $deletedMenuIds);
                    Glf_Utils::glf_add_to_wordpress_options('menu_widget_ids', $currentMenuIds);
                }
                if (!empty($deletedPromotionIds)) {
                    $currentPromotionIds = array_diff($currentPromotionIds, $deletedPromotionIds);
                    Glf_Utils::glf_add_to_wordpress_options('promotions_widget_ids', $currentPromotionIds);
                }
                if (!empty($deletedOpeningHoursIds)) {
                    $currentOpeningHoursIds = array_diff($currentOpeningHoursIds, $deletedOpeningHoursIds);
                    Glf_Utils::glf_add_to_wordpress_options('opening_hours_widget_ids', $currentOpeningHoursIds);
                }
            }
        }

	}

	new Glf_Module_Elementor();
}