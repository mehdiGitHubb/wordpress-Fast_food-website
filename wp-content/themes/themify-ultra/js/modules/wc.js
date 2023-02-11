;
(($, Themify,doc, fwVars, themeVars)=>{
	'use strict';
	if(doc.body.classList.contains('slide-cart')){
		const icon = doc.querySelectorAll('a[href="#slide-cart"]');
		if(icon.length > 0){
			Themify.sideMenu(icon, {
				close:'#cart-icon-close',
				beforeShow(){
					Themify.loadCss(fwVars.theme_url + '/styles/wc/modules/basket',null, fwVars.theme_v);
				}
			});
		}
	}
	let isWorking = false;
	const icons = doc.querySelectorAll('#headerwrap .icon-shopping-cart'),
        removeloaders=()=>{
            for(let i = icons.length - 1; i > -1; --i){
				icons[i].classList.remove('tf_loader');
			}
       };
	Themify.body.on('added_to_cart removed_from_cart', function(e){
		const cartButton = $('.cart-icon');
		if(cartButton.hasClass('empty-cart')){
			if(e.type === 'added_to_cart'){
				cartButton.removeClass('empty-cart');
			}else if(parseInt($('.cart-icon-link span').text()) <= 0){
				cartButton.addClass('empty-cart');
			}
		}
		if(e.type === 'added_to_cart'){
			removeloaders();
			if(isWorking === false && themeVars.ajaxCartSeconds){
				isWorking = true;
				let seconds = parseInt(themeVars.ajaxCartSeconds);
				const el = doc.querySelector(Themify.isTouch ? '#mobile-menu .cart-icon-link' : '.header-icons .cart-icon-link');
				if(el !== null){
					const panelId = el.getAttribute('href'),
						panel = doc.tfId(panelId.replace('#', ''));
					if(panel !== null){
						Themify.on('sidemenushow', (panel_id, side, _this)=>{
							if(panelId === panel_id){
								setTimeout(()=>{
									if($(panel).is(':hover')){
										panel.tfOn('mouseleave', function(){
											_this.hidePanel();
											doc.body.classList.remove('tf_auto_cart_open');
										}, {once:true, passive:true});
									}else{
										_this.hidePanel();
										doc.body.classList.remove('tf_auto_cart_open');
									}
									isWorking = false;
								}, seconds);
							}
						}, true);
						doc.body.classList.add('tf_auto_cart_open');
						setTimeout(()=>{
							el.click();
						}, 100);
					}
				}
			}
		}
	}).on('adding_to_cart', ()=>{
		for(let i = icons.length - 1; i > -1; --i){
			icons[i].classList.add('tf_loader');
		}
	});
	if ( typeof wc_add_to_cart_params !== 'undefined' ) {
		doc.body.tfOn('click',  e=>{
            const target=e.target?e.target.closest('.remove_from_cart_button'):null;
            if(target){
                e.preventDefault();
                target.classList.remove('tf_close');
                target.classList.add('tf_loader');
            }
		});
	}
	// Ajax add to cart in single page
	if(themeVars.ajaxSingleCart){
		const form = doc.querySelector('form.cart');
		if(form){
			form.tfOn('submit', async function(e){
				// // WC Simple Auction, WooCommerce Subscriptions plugin compatibility
                if (this.classList.contains( 'auction_form' ) || window.location.search.indexOf('switch-subscription') > -1 || this.closest('.product-type-external')!==null) {
                    return;
                }
				e.preventDefault();
				const data = new FormData(this),
					btn = this.tfClass('single_add_to_cart_button')[0],
                    btnCL=btn?btn.classList:null,
					add_to_cart = this.querySelector('[name="add-to-cart"]');
				if ( ! add_to_cart || (btnCL && btnCL.contains('loading'))) {
					return;
				}
				if(add_to_cart.tagName !== 'INPUT'){
					data.set('add-to-cart', add_to_cart.value);
				}
				if(btnCL){
					btnCL.remove('added');
					btnCL.add('loading');
				}
				Themify.body.triggerHandler('adding_to_cart', [this.querySelector('[type="submit"]'), data]);
                try{
                    const resp=await Themify.fetch(data,null,null,woocommerce_params.wc_ajax_url.toString().replace( '%%endpoint%%', 'theme_add_to_cart' ));
                    if (!resp) {
                        throw 'error';
                    }
                    if(!resp.fragments && !resp.success){
                        throw resp.data;
                    }
                    
                    const fragments = resp.fragments,
                        cart_hash = resp.cart_hash;
                    // Block fragments class
                    if(fragments){
                        const keys = Object.keys(fragments);
                        let els = null;
                        for(let i = keys.length - 1; i > -1; i--){
                            els = doc.querySelectorAll(keys[i]);
                            for(let k = els.length - 1; k > -1; k--){
                                els[k].className += ' updating';
                                els[k].outerHTML = fragments[keys[i]];
                            }
                        }
                    }
                    if(btnCL){
                        btnCL.add('added');
                    }
                    // Trigger event so themes can refresh other areas
                    Themify.body.triggerHandler('added_to_cart', [fragments, cart_hash]);
                    if(themeVars.redirect){
                        window.location.href = themeVars.redirect;
                    }
                }
                catch(err){
                    const fr=doc.createDocumentFragment(),
                        wr=doc.createElement('div');
                        await Themify.loadJs(Themify.url+'js/admin/notification',!!window.TF_Notification);
                    if(!Array.isArray(err)){
                        err=[err];
                    }
                    for(let i=0,len=err.length;i<len;++i){
                        let tmp=doc.createElement('template');
                        tmp.innerHTML=err[i];
                        fr.appendChild(tmp.content);
                    }
                    wr.className='wc_errors';
                    wr.appendChild(fr);
                    await TF_Notification.showHide('error',wr,3000);
                }
                if(btnCL){
                    btnCL.remove('loading');
                }
                removeloaders();
			});
		}
	}
})(jQuery, Themify,document, themify_vars, themifyScript);
