 (($, Themify, win, doc, fwVars, themeVars,und) => {
    'use strict';
    const ThemifyTheme = {
        bodyCl: doc.body.classList,
        headerType: themeVars.headerType,
        v: fwVars.theme_v,
        url: fwVars.theme_url + '/',
        init() {
            this.darkMode();
            this.isFullPageScroll = !Themify.is_builder_active && this.bodyCl.contains('full-section-scrolling');
            this.is_horizontal_scrolling = this.isFullPageScroll === true && this.bodyCl.contains('full-section-scrolling-horizontal');
            this.readyView();
            Themify.megaMenu(doc.tfId('main-nav'));
            this.headerRender();
            this.headerVideo();
            this.fixedHeader();
            if (this.isFullPageScroll === true) {
                this.fullpage();
            }
            this.wc();
            this.clickableOverlay();
            this.mobileMenuDropDown();
            setTimeout(() => {
                this.loadFilterCss();
            }, 800);
            setTimeout(() => {
                this.backToTop();
            }, 2000);
            this.doInfinite(doc.tfId('loops-wrapper'));
            setTimeout(() => {
                this.commentAnimation();
            }, 3500);
            this.revealingFooter();
            this.singleInfinie();
            this.splitMenu();
        },
        fixedHeader() {
            if (this.is_horizontal_scrolling === false && this.bodyCl.contains('fixed-header-enabled') && this.headerType !== 'header-bottom' && doc.tfId('headerwrap') !== null) {
                this.hasFixedHeader = true;
                Themify.fixedHeader();
            }
        },
        revealingFooter() {
            if (this.bodyCl.contains('revealing-footer') && doc.tfId('footerwrap') !== null) {
                Themify.loadJs(this.url + 'js/modules/revealingFooter', null, this.v);
            }
        },
        doInfinite(container) {
            if (themeVars.infiniteEnable) {
                Themify.infinity(container, {
                    scrollToNewOnLoad: themeVars.scrollToNewOnLoad,
                    scrollThreshold: !('auto' !== themeVars.autoInfinite),
                    history: !themeVars.infiniteURL ? false : 'replace'
                });
            }
            Themify.on('infiniteloaded', () => {//should be enable always,for single infinity and others
                this.loadFilterCss();
            });
        },
        fullpage(e) {
            if (doc.tfClass('themify_builder')[0] === und) {
                this.bodyCl.remove('full-section-scrolling');
                return;
            }
            if (e && doc.fullscreenElement !== null) {
                Themify.on('tfsmartresize', this.fullpage.bind(this), true);
                return;
            }
            const w = e ? e.w : Themify.w;
            if (themeVars.f_s_d && w < parseInt(themeVars.f_s_d)) {
                Themify.lazyDisable = null;
                this.bodyCl.remove('full-section-scrolling');
                this.isFullPageScroll = false;
                Themify.lazyLoading();
                Themify.on('tfsmartresize', this.fullpage.bind(this), true);
                if (typeof tbLocalScript !== 'undefined' && tbLocalScript.scrollHighlight) {
                    delete tbLocalScript.scrollHighlight.scroll;
                    if (typeof ThemifyBuilderModuleJs !== 'undefined') {
                        ThemifyBuilderModuleJs.initScrollHighlight();
                    }
                }
                return;
            }
            this.bodyCl.add('full-section-scrolling');
            Themify.lazyDisable = true;
            this.isFullPageScroll = true;
            Promise.all([
                Themify.wow(),
                Themify.loadJs(this.url + 'js/modules/fullpage',null,this.v)
            ])
            .then(()=>{
                Themify.trigger('themify_theme_fullpage_init', [{
                    is_horizontal: this.is_horizontal_scrolling,
                    is_fixedHeader: this.hasFixedHeader,
                    has_footer: this.bodyCl.contains('fullpage-footer')
                }]);
            });
        },
        loadFilterCss() {
            const filters = ['blur', 'grayscale', 'sepia', 'none'];
            for (let i = filters.length - 1; i > -1; --i) {
                if (doc.tfClass('filter-' + filters[i])[0] !== und || doc.tfClass('filter-hover-' + filters[i])[0] !== und) {
                    Themify.loadCss(this.url + 'styles/modules/filters/' + filters[i], null, this.v);
                }
            }
        },
        headerVideo() {
            const header = doc.tfId('headerwrap');
            if (header) {
                const videos = Themify.selectWithParent('[data-fullwidthvideo]', header);
                if (videos.length > 0) {
                    Themify.loadJs(this.url + 'js/modules/headerVideo',null,this.v).then(()=>{
                        Themify.trigger('themify_theme_header_video_init', [videos]);
                    });
                }
            }
        },
        wc() {
            if (win.woocommerce_params !== und) {
                Themify.loadJs(this.url + 'js/modules/wc', null, this.v);
            }
        },
        mobileMenuDropDown() {
            const items = doc.tfClass('toggle-sticky-sidebar');
            for (let i = items.length - 1; i > -1; --i) {
                items[i].tfOn('click', function () {
                    const sidebar = doc.tfId('sidebar'),
                        cl=this.classList;
                    if (cl.contains('open-toggle-sticky-sidebar')) {
                        cl.remove('open-toggle-sticky-sidebar');
                        cl.add('close-toggle-sticky-sidebar');
                        sidebar.classList.add('open-mobile-sticky-sidebar', 'tf_scrollbar');
                    } else {
                        cl.remove('close-toggle-sticky-sidebar');
                        cl.add('open-toggle-sticky-sidebar');
                        sidebar.classList.remove('open-mobile-sticky-sidebar', 'tf_scrollbar');
                    }
                }, {passive: true});
            }
        },
        splitMenu() {
            if (this.headerType === 'header-menu-split') {
                const _resize =  e=> {
                            if (e.w<=fwVars.menu_point) {
                                /* on mobile move the site logo to the header */
                                $('#main-nav #site-logo').prependTo('.header-bar');
                            } else {
                                $('.header-bar #site-logo').prependTo($('#main-nav .themify-logo-menu-item'));
                            }
                        };
                _resize({w:Themify.w});
                Themify.on('tfsmartresize', e => {
                    if (e) {
                        _resize(e);
                    }
                });
            }
        },
        clickableOverlay() {
            setTimeout(() => {
                doc.body.tfOn('click', e=> {
                    const target=e.target;
                    if (target && target.tagName !== 'A' && target.tagName !== 'BUTTON' && target.closest('.post-content')) {
                        const el = target.closest('.loops-wrapper');
                        if (el !== null) {
                            const cl = el.classList;
                            if ((cl.contains('grid6') || cl.contains('grid5') || cl.contains('grid4') || cl.contains('grid3') || cl.contains('grid2')) && (cl.contains('polaroid') || cl.contains('overlay') || cl.contains('flip'))) {
                                const link = target.closest('.post').querySelector('.post-image a, .post-title a');
                                if (link && link.href) {
                                    link.click();
                                }
                            }
                        }
                    }
                });
            }, 1500);
        },
        headerRender() {
            const type = this.headerType;
            if (type === 'header-horizontal' || type === 'header-top-bar' || type === 'boxed-compact' || type === 'header-stripe') {
                const headerWidgets = doc.tfClass('header-widget')[0];
                if (headerWidgets !== und) {
                    const pullDown = doc.tfClass('pull-down')[0];
                    if (pullDown !== und) {
                        pullDown.tfOn('click', e => {
                            e.preventDefault();
                            e.stopPropagation();
                            doc.tfId('header').classList.toggle('pull-down-close');
                            $(headerWidgets).slideToggle('fast');
                        });
                    }
                }
            }
            Themify.sideMenu(doc.tfId('menu-icon'), {
                close: '#menu-icon-close',
                side: type === 'header-leftpane' || type === 'header-minbar' ? 'left' : 'right',
                hasOverlay: !(type === 'header-slide-out' || type === 'header-rightpane')
            });
            // Expand Mobile Menus
            if (fwVars.m_m_expand) {
                Themify.on('sidemenushow',panel_id => {
                    if ('#mobile-menu' === panel_id) {
                        const items = doc.querySelectorAll('#main-nav>li.has-sub-menu');
                        for (let i = items.length - 1; i > -1; i--) {
                            items[i].className += ' toggle-on';
                        }
                    }
                }, true);
            }
            if (type === 'header-top-widgets') {
                const _resize = () => {
                    if (this.bodyCl.contains('mobile_menu_active')) {
                        $('.header-widget-full .header-widget').appendTo('#mobile-menu');
                    } else {
                        $('#mobile-menu .header-widget').prependTo('.header-widget-full');
                    }
                };
                _resize();
                Themify.on('tfsmartresize', e => {
                    if (e) {
                        _resize(e);
                    }
                });
            }
        },
        backToTop() {
            const back_top = doc.tfClass('back-top'),
                    type = this.headerType,
                    isFullpageScroll = this.isFullPageScroll,
                    back_top_float = isFullpageScroll ? null : doc.querySelector('.back-top-float:not(.footer-tab)');
            if (back_top_float) {
                const events = ['scroll'],
                        scroll = function () {
                            back_top_float.classList.toggle('back-top-hide', (this.scrollY < 10));
                        };
                if (Themify.isTouch) {
                    events.push('touchstart');
                    events.push('touchmove');
                }
                win.tfOn(events, scroll, {passive: true});
            }
            if (back_top[0]) {
                for (let i = back_top.length - 1; i > -1; --i) {
                    back_top[i].tfOn('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isFullpageScroll || this.classList.contains('footer-tab')) {
                            const wrap = doc.tfId('footerwrap');
                            if (wrap) {
                                wrap.classList.remove('tf_hide');
                                Themify.lazyScroll(wrap.querySelectorAll('[data-lazy]'), true);
                                wrap.classList.toggle('expanded');
                            }
                        } else {
                            Themify.scrollTo();
                        }
                    });
                }
            }
        },
        commentAnimation() {
            if (doc.tfId('commentform')) {
                Themify.body.on('focus.tfCommentLabel', '#commentform input, #commentform textarea', function () {
                    $(this).closest('p').addClass('focused');
                }).on('blur.tfCommentLabel', '#commentform input, #commentform textarea', function () {
                    if (this.value === '') {
                        $(this).removeClass('filled').closest('p').removeClass('focused');
                    } else {
                        $(this).addClass('filled');
                    }
                });
            }
        },
        readyView() {
            if (this.isFullPageScroll || '1' === themeVars.pageLoaderEffect) {
                 Themify.on('themify_onepage_afterload', ()=>{
                    this.bodyCl.add('ready-view');
                    this.bodyCl.remove('hidden-view');
                    $('.section_loader').fadeOut(500);
                    win.tfOn('beforeunload', e => {
                        const el = e.target.activeElement,
							href = el.getAttribute('href');
                        if (el.tagName === 'BODY' || el.getAttribute('id') === 'tb_toolbar' || el.closest('#tb_toolbar') || (href && (href.indexOf('tel:') || href.indexOf('mailto:'))))
                            return;
                    });
                    
                 }, true,!(this.isFullPageScroll && !(themeVars.f_s_d && Themify.w <= parseInt(themeVars.f_s_d))));
            }
        },
        singleInfinie() {
            if (doc.tfClass('tf_single_scroll_wrap')[0]) {
                win.tfOn('scroll', () => {
                    Themify.loadJs(this.url + 'js/modules/single-infinite', null, this.v);
                }, {once: true, passive: true});
            }
        },
		toggleDarkMode( status = true ) {
			const el = doc.querySelector( 'link[href*="dark-mode"]' );
			if ( status ) {
				if ( el ) {
					el.setAttribute( 'media', 'all' );
				} else {
					Themify.loadCss(themeVars.darkmode.css,'darkmode',this.v,doc.body.lastChild);
				}
			}
            else if ( el ) {
                /* disable the stylesheet instead of removing it, might need to re-enable it later */
                el.setAttribute( 'media', 'none' );
			}
            this.bodyCl.toggle( 'tf_darkmode' );
		},
		darkMode(){
			if ( themeVars.darkmode ) {
				if ( themeVars.darkmode.start ) {
					/* Scheduled dark mode */
					const current_date = new Date(),
						start_date = new Date(),
						end_date = new Date(),
						start = themeVars.darkmode.start.split(':'),
						end = themeVars.darkmode.end.split(':');
					start_date.setHours(start[0],start[1],0);
					if(parseInt(end[0])<parseInt(start[0])){
						end_date.setDate(end_date.getDate() + 1);
					}
					end_date.setHours(end[0],end[1],0);
					if ( current_date >= start_date && current_date < end_date ) {
						this.toggleDarkMode();
					}
				} else {
					/* by user preference */
					let toggles = doc.tfClass( 'tf_darkmode_toggle' );
					for ( let i = toggles.length - 1; i > -1; --i ) {
						toggles[ i ].tfOn( 'click', e=> {
							e.preventDefault();
							const enabled = ! this.bodyCl.contains( 'tf_darkmode' );
							this.toggleDarkMode( enabled );
							localStorage.setItem( 'tf_darkmode', enabled ? 1 : 0 );
						} );
					}
					if ( parseInt( localStorage.getItem( 'tf_darkmode' ) ) ) {
						this.toggleDarkMode();
					}
				}
			}
		}
    };
    ThemifyTheme.init();
})(jQuery, Themify, window, document, themify_vars, themifyScript,undefined);
