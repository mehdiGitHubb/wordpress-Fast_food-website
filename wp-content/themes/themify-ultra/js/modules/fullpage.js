/* fullpage */
;
(( Themify, doc, win, themeVars,und)=>{
	'use strict';
	let scrolling = false,
		isLargeScrolling=false,
		wrapper,
		duration = 0,
		pagesCount = 0,
		currentIndex = 0,
		initOnce = false,
		isHorizontal = false,
		normalHeight=Themify.h,
		realFixedHeight=0,
		realNormalHeight=0,
		fixedHeight=0,
		hasFixedHeader=false,
		has_footer=false,
		isDisabled=false,
        isSensitivy=false,
		prevTime=0,
		req2,
		scrollings=[],
		prevbreakpoint,
		deltaY,
		prevHash = ''; /* used for detecting movement in touch devices */
	const _is_retina = win.devicePixelRatio > 1,
			points=Object.keys(themeVars.breakpoints).reverse(),
			snakeScroll = !doc.body.classList.contains( 'full-section-scrolling-single' ),
			_CLICK_ = !Themify.isTouch ? 'click' :'touchstart',
			_MOBILE_BREAKPOINT_ = themeVars.f_s_d ? parseInt(themeVars.f_s_d) : null,
            isFade=doc.body.classList.contains('fp-effect-fade'),
			_ISPARALLAX_ = isFade===false && themeVars.fullpage_parallax !== und,
			run = w=> {
				win.scroll(0, 0);
				scrolling=false;
				currentIndex=0;
				_create(w);
				if(!duration){
                    const comp=win.getComputedStyle(wrapper);
                    isSensitivy=comp.getPropertyValue('--tf_section_sensitivy')==='l';  
					duration = isFade===true?win.getComputedStyle(wrapper.getElementsByClassName('fp-section-container')[0]).transitionDuration:comp.transitionDuration;
					duration=parseFloat(duration);
					if (duration < 100) {
						duration *= 1000;
					}
				}
				_verticalNavigation();
				if (initOnce === false) {
					main();
				}
				doc.tfOn('keydown', _keydown, {passive: true})
				.tfOn('wheel', _wheel, {passive: true});
				if (Themify.isTouch) {
					wrapper.tfOn((win.PointerEvent ? 'pointerdown' : 'touchstart'), _touchstart, {passive: true});
				}
			},
			_disable=()=>{
				isDisabled=true;
				doc.tfOff('keydown', _keydown, {passive: true})
				.tfOff('wheel', _wheel, {passive: true});
				wrapper.tfOff((win.PointerEvent ? 'pointerdown' : 'touchstart'), _touchstart, {passive: true});
				const mainNav=doc.tfId('fp-nav'),
					childs=wrapper.children;
				if(mainNav){
					mainNav.remove();
				}
				wrapper.style.transform='';
				if(has_footer===true){
					const footer = doc.tfId('footerwrap');
					if(footer){
						const r_footer = footer.parentNode.parentNode;
						doc.body.appendChild(footer);
						r_footer.remove();
					}
				}
				for(let i=childs.length-1;i>-1;--i){
					let item=childs[i];
					if(item.classList.contains('fp-section-container-horizontal')){
						let rows=item.tfClass('fp-section-container-inner')[0].children,
							fr=doc.createDocumentFragment();
							for(let j=0,len=rows.length;j<len;++j){
								let r=rows[j].tfClass('module_row')[0],
								inner=r.tfClass('row_inner')[0];
								if(_ISPARALLAX_){
									r.style.transform=r.style.transition='';
								}
								if(inner){
									inner.style.paddingBottom=inner.style.paddingTop='';
									inner.classList.remove('tf_scrollbar');
								}
								fr.appendChild(r);
							}
							item.after(fr);
					}
					else{
						let r=item.tfClass('module_row')[0],
							inner=r.tfClass('row_inner')[0];
						
						if(_ISPARALLAX_){
							r.style.transform=r.style.transition='';
						}
						if(inner){
							inner.style.paddingBottom=inner.style.paddingTop='';
							inner.classList.remove('tf_scrollbar');
						}
						item.after(r);
					}
                    item.remove();
				}
				Themify.lazyDisable = null;
				Themify.lazyLoading();
				if (win.tbLocalScript !== und && win.tbLocalScript.scrollHighlight) {
					delete win.tbLocalScript.scrollHighlight.scroll;
					if (typeof ThemifyBuilderModuleJs !== 'undefined') {
						ThemifyBuilderModuleJs.initScrollHighlight();
					}
				} else {
					Themify.trigger('tb_scroll_highlight_enable');
				}
				doc.body.classList.remove('full-section-scrolling','full-section-scrolling-horizontal','full-section-scrolling-single','fullpage-footer');
			},
			_getCurrentBreakPoint=w=>{
					if(!w){
						w=Themify.w;
					}
					const points=themeVars.breakpoints;
					 if (w <=points.mobile) {
						return 'mobile';
					} 
					if (w <= points.tablet[1]) {
						return 'tablet';
					} 
					if (w <=points.tablet_landscape[1]) {
						return 'tablet_landscape';
					}
				return 'desktop';
			},
			isOverflow=node=> {
				  if (node === null || node === doc.body || node===doc.documentElement || node.classList.contains('fp-section-container') ||node.classList.contains('tf_scrollbar')) {
						return false;
				  }
				  if(node.scrollHeight > node.clientHeight){
					const overflowY=win.getComputedStyle(node).overflowY;
					if(overflowY==='auto' || overflowY==='scroll' || overflowY==='overlay'){
						return true;
					}
				  }
				  return isOverflow(node.parentNode);
			},
			_getPaddings=(el,bp)=>{
                for (let i = points.indexOf(bp),len=points.length; i < len; ++i) {
                    let padding=el.getAttribute('data-'+points[i]+'-pd');
                    if(padding){
                        padding=padding.split(' ');
                        if(padding[1]===und){
                            padding[1]=padding[0];
                        }
                        return padding;
                    }
                }
				return false;
			},
			_create =w=> {
				if(has_footer===true){
					const footer = doc.tfId('footerwrap');
					if(footer && !footer.parentNode.classList.contains('module_row')){
						footer.classList.add('module_row','fullheight');
						const r_footer = doc.createElement('div');
						r_footer.className = 'module_row fullheight';
						r_footer.appendChild(footer);
						wrapper.appendChild(r_footer);
					}
				}
				const childs = wrapper.children,
					bp=_getCurrentBreakPoint(w),
					lazyItems = [];
				for (let i = childs.length - 1; i > -1; --i) {

					if (childs[i]) {
						let el = childs[i],
							cl = el.classList;
						if (!cl.contains('fp-section-container')) {
							let vHeight=i===0 || fixedHeight===0?normalHeight:fixedHeight,
								row_inner,
								paddings=_getPaddings(el,bp);
							if (cl.contains('module_row_slide')) {
								let container = doc.createElement('div'),
										elWrap = doc.createElement('div'),
										inner = doc.createElement('div');
								while (true) {
									let prev = el.previousElementSibling;
									if (prev !== null) {
										let br = prev.classList.contains('module_row_section');
										if (prev.classList.contains('module_row_slide') || br) {
											let wrap = doc.createElement('div'),
											_row_inner=prev.tfClass('row_inner')[0],
                                            paddings=_getPaddings(prev,bp);
											wrap.className = 'fp-section-container tf_w tf_h tf_overflow';
											if(paddings[0]!==''){
												_row_inner.style.paddingTop=paddings[0];
											}
											if(paddings[1]!==''){
												_row_inner.style.paddingBottom=paddings[1];
											}
											_row_inner.className += ' tf_scrollbar';
											prev.after(wrap);
											wrap.appendChild(prev);
											
											inner.prepend(wrap);
											if(br){
												break;
											}
										}
									} else {
										break;
									}
								}
								container.className = 'fp-section-container-horizontal tf_w tf_rel tf_overflow';
								container.style['height']=vHeight+'px';
								inner.className = 'fp-section-container-inner tf_rel tf_w tf_h';
								elWrap.className = 'fp-section-container tf_w tf_h tf_overflow';
								row_inner=el.tfClass('row_inner')[0];
								row_inner.className += ' tf_scrollbar';
								container.appendChild(inner);
								el.after(container);
								inner.appendChild(el);
								el.after(elWrap);
								elWrap.appendChild(el);
								horizontalNavigation(inner);
							} 
							else if (!cl.contains('fp-section-container-horizontal')) {
								let wrap = doc.createElement('div');
								row_inner=el.tfClass('row_inner')[0];
								wrap.className = 'fp-section-container tf_w tf_overflow';
								wrap.style.height=vHeight+'px';
								if(row_inner!==und){
									row_inner.className += ' tf_scrollbar';
								}
								el.after(wrap);
								wrap.appendChild(el);
							}
							if(row_inner!==und){
								if(paddings[0]!==''){
									row_inner.style.paddingTop=paddings[0];
								}
								if(paddings[1]!==''){
								
									row_inner.style.paddingBottom=paddings[1];
								}
							}
						}
					}
				}
				if(initOnce===false){
					for (let allLazy = doc.querySelectorAll('[data-lazy]'), i = allLazy.length - 1; i > -1; --i) {
						if (!wrapper.contains(allLazy[i])) {
							lazyItems.push(allLazy[i]);
						}
					}
					Themify.lazyDisable = null;
					Themify.lazyLoading(lazyItems);
					Themify.lazyDisable = true;
					for (let wowItems = wrapper.tfClass('wow'), i = wowItems.length - 1; i > -1; --i) {
						if (!wowItems[i].hasAttribute('data-tf-animation_delay')) {
							wowItems[i].dataset.tfAnimationDelay='.3';
						}
					}
				}
				pagesCount = childs.length;
			},
			main = ()=> {
				const currentHash = location.hash.replace('#', '').replace('!/', ''),
						_scrollTo = anchor=> {
							if (anchor.indexOf('/') !== -1) {
								anchor = anchor.substring(0, anchor.indexOf('/'));
							}
							if (anchor && '#' !== anchor) {
								anchor = CSS.escape(anchor.replace('#', ''));
								let sectionEl = wrapper.querySelector('[data-anchor="' + anchor + '"]') || doc.tfId(anchor);
								if (sectionEl !== null) {
									sectionEl = sectionEl.closest('.fp-section-container');
									if (sectionEl) {
										let verticalIndex = Themify.convert(sectionEl.parentNode.children).indexOf(sectionEl),
												horizontalIndex = und;
										const horizontal = sectionEl.closest('.fp-section-container-horizontal');
										if (horizontal) {
											horizontalIndex = verticalIndex;
											verticalIndex = Themify.convert(horizontal.parentNode.children).indexOf(horizontal);
										}
										scrollTo(verticalIndex, horizontalIndex, !initOnce);
										return true;
									}
								}
							}
							return false;
						},
						changeHash = (hash, onlyMenu)=> {
							if (prevHash !== hash) {
								prevHash = hash;
								_setActiveMenu(hash);
								if (onlyMenu === und) {
									if (hash && hash !== '#' && _scrollTo(hash)) {
										if (doc.body.classList.contains('mobile-menu-visible')) {
											/* in Overlay header style, when a menu item is clicked, close the overlay */
											const menu = doc.tfId('menu-icon');
											if (menu) {
												menu.click();
											}
										}
										return true;
									}
								}
								return false;
							}
							Themify.trigger('themify_onepage_scrolled');
						};
				if (!currentHash || !changeHash(currentHash)) {
					scrollTo(currentIndex, und, true);
					Themify.trigger('themify_onepage_afterload');
				}
				setTimeout(()=> {
					win.tfOn('hashchange', function (e) {
						if (initOnce === true && isDisabled===false) {
							changeHash(this.location.hash, true);
                            _scrollTo(this.location.hash);
						}
					}, {passive: true});

					doc.body.tfOn('click', e=> {//should be click,browser break in mobile,after clicking to the link that target row id
						
						if (initOnce === true && isDisabled===false) {
							const el = e.target.closest('a');
							if (el) {
								let url = el.getAttribute('href');
								if (url && url !== '#' && url.indexOf('#') !== -1) {
									try {
										if(url.indexOf(location.protocol)===-1){
											url=location.protocol+'//'+location.host+location.pathname+url;
										}
										const path = new URL(url);
										if (path.hash && (url.indexOf('#') === 0 || (path.pathname === location.pathname && path.hostname === location.hostname))) {
											e.preventDefault();
											isLargeScrolling=true;
											changeHash(path.hash);
											isLargeScrolling=false;
										}
									} catch (_) {
									}
								}else if(el.classList.contains('scroll-next-row')){
									scrollTo('next');
								}
							}
						}
					});

					initOnce = true;
				}, 250);

			},
			horizontalNavigation =  wrap=> {
				const childs = wrap.children,
						fr = doc.createDocumentFragment(),
						nav = doc.createElement('ul'),
						prev = doc.createElement('div'),
						next = doc.createElement('div'),
						scrtxt = doc.createElement('span');
				scrtxt.className='screen-reader-text';

				for (let i = 0, len = childs.length; i < len; ++i) {
					scrtxt.innerText=i+1;
					let li = doc.createElement('li'),
							a = doc.createElement('a');
					a.href = '#';
					a.appendChild(scrtxt.cloneNode(true));
					if (i === 0) {
						li.className = 'active';
					}
					li.appendChild(a);
					nav.appendChild(li);
				}
				scrtxt.remove();
				nav.tfOn(_CLICK_,e=> {
					e.preventDefault();
					e.stopPropagation();
					const el = e.target.closest('li');
					if (el && !el.classList.contains('active')) {
						isLargeScrolling=true;
						scrollTo(currentIndex, Themify.convert(el.parentNode.children).indexOf(el));
						isLargeScrolling=false;
					}
				})
                .className = 'fp-slidesNav';

				next.tfOn(_CLICK_, e=> {
					e.stopPropagation();
					let el = nav.querySelector('.active');
					el = (el && el.nextElementSibling) ? el.nextElementSibling : nav.firstElementChild;
					Themify.triggerEvent(el, e.type);
				}, {passive: true})
                .className = 'fp-controlArrow fp-next';

				prev.tfOn(_CLICK_, e=> {
					e.stopPropagation();
					let el = nav.querySelector('.active');
					el = (el && el.previousElementSibling) ? el.previousElementSibling : nav.lastElementChild;
					Themify.triggerEvent(el, e.type);
				}, {passive: true})
                .className = 'fp-controlArrow fp-prev';
				fr.append(prev,next,nav);
				wrap.parentNode.appendChild(fr);
			},
			_verticalNavigation = ()=>{
				if (isHorizontal === false && !doc.tfId('fp-nav')) {
					const nav = doc.createElement('ul'),
							childs = wrapper.children,
						scrtxt = doc.createElement('span');
					scrtxt.className='screen-reader-text';
					
					for (let i = 0; i < pagesCount; ++i) {
						scrtxt.innerText=i+1;
						let li = doc.createElement('li'),
							a = doc.createElement('a'),
							el = childs[i].tfClass('module_row')[0],
							id = el.dataset.rowTitle,
							tooltip = doc.createElement('div');

						a.href = '#';
						a.appendChild(scrtxt.cloneNode(true));
						if (i === currentIndex) {
							li.className = 'active';
						}
						li.appendChild(a);
						if (id === 'footerwrap') {
							id = '';
						} else if (!id) {
							id = _getAnchor(el);
						}
						if (id) {
							tooltip.className = 'fp-tooltip';
							tooltip.innerText = id;
							li.appendChild(tooltip);
						}
						nav.appendChild(li);
					}
					scrtxt.remove();
					nav.id = 'fp-nav';
					nav.tfOn(_CLICK_,e=> {
						e.preventDefault();
						e.stopPropagation();
						const el = e.target.closest('li');
						if (el && !el.classList.contains('active')) {
							isLargeScrolling=true;
							scrollTo(Themify.convert(el.parentNode.children).indexOf(el));
							isLargeScrolling=false;
						}
					})
                    .className = 'fp-slidesNav';
					doc.body.appendChild(nav);
				}
			},
			_touchstart = e=> {
				if (scrolling === false && isOverflow(e.target)===false && !(Themify.isTouch && e.target.closest('.themify_builder_slider'))) {
					let touchStartY = e.touches ? e.touches[0].clientY : e.clientY,
							touchStartX = e.touches ? e.touches[0].clientX : e.clientX,
							target = e.targetTouches ? e.targetTouches[0] : e.target,
							inHorizontal = isHorizontal;
					const _MOVE_ = e.type === 'touchstart' ? 'touchmove' : 'pointermove',
							_UP_ = e.type === 'touchstart' ? 'touchend' : 'pointerup',
							_CANCEL_ = e.type === 'touchstart' ? 'touchcancel' : 'pointercancel',
							_SENSITIVE_ = 5,
							_upCallback = function (e) {
								this.tfOff(_MOVE_, _moveCallback, {passive: true})
								.tfOff([_UP_,_CANCEL_], _upCallback, {passive: true, once: true});
								wrapper.tfOff(_UP_, _upCallback, {passive: true, once: true});
								touchStartY = touchStartX = null;
							},
							_moveCallback = e=> {
								if (scrolling === false) {
									const touchEndY = e.touches ? e.touches[0].clientY : e.clientY,
											touchEndX = e.touches ? e.touches[0].clientX : e.clientX;
									if (touchEndY !== touchStartY || (inHorizontal === true && touchEndX !== touchStartX)) {
										let dir = '';
										if (inHorizontal === true) {
											if (touchEndX + _SENSITIVE_ < touchStartX) {/*left*/
												dir = Themify.isRTL === true ? 'swipe_prev' : 'swipe_next';
											} else if (touchEndX - _SENSITIVE_ > touchStartX) {/*right*/
												dir = Themify.isRTL === true ? 'swipe_next' : 'swipe_prev';
											}
										}
										if (dir === '') {
											if (touchEndY + _SENSITIVE_ < touchStartY) {/*up*/
												dir = 'next';
											} else if (touchEndY - _SENSITIVE_ > touchStartY) {/*down*/
												dir = 'prev';
											}
										}
										if (dir !== '') {
											touchStartY = touchEndY;
											touchStartX = touchEndX;
											scrollTo(dir);
										}
									}
								}
							};
							if(target.target){
								target=target.target;
							}
					if (wrapper.contains(target)) {
						if (inHorizontal === false) {
							inHorizontal = target.closest('.fp-section-container-horizontal') !== null;
						}
						doc.tfOn(_MOVE_, _moveCallback, {passive: true})
						.tfOn([_UP_,_CANCEL_], _upCallback, {passive: true, once: true});
						wrapper.tfOn(_UP_, _upCallback, {passive: true, once: true});
					}
				}
			},
			_allowScrolling=e=>{
				deltaY=-e.deltaY;
				const curTime = new Date().getTime(),
				timeDiff = curTime-prevTime,
				y=Math.abs(deltaY),
				getAverage=(elements, number)=>{
					let sum = 0;
					const lastElements = elements.slice(Math.max(elements.length - number, 1));
					for(let i =  lastElements.length-1; i>-1; --i){
						sum+=lastElements[i];
					}

					return Math.ceil(sum/number);
				};
				
				if(isSensitivy===true && y<=18){//is touchScroll?
					return false;
				}
				if(scrollings.length > 149){
                    scrollings.shift();
                }
				scrollings.push(y);
				if(timeDiff > 200){
                    //emptying the array, we dont care about old scrolling for our averages
                    scrollings = [];
                }
                prevTime = curTime;
				return getAverage(scrollings, 10) >= getAverage(scrollings, 70);
			},
			_wheel = e=> {
				if(scrolling === false && isOverflow(e.target)===false && _allowScrolling(e)===true){
					scrollTo(( Math.max(-1, Math.min(1, deltaY))<0 ? 'next' : 'prev'));
				}
			},
			_scrollVertical = (horizontalIndex, dir,silient)=> {
				if(scrolling===false){
					silient = !!silient;
					scrolling = true;
					const el = wrapper.children[currentIndex],
							row = (silient !== true && isLargeScrolling===false && el && _ISPARALLAX_ === true) ? el.tfClass('module_row')[0] : null,
							nav = doc.tfId('fp-nav'),
							ev = currentIndex === 0 ? 'tf_fixed_header_disable' : 'tf_fixed_header_enable';
					if (row) {
						let next = dir==='prev'?el.nextElementSibling:el;
						if (next) {
							next = next.tfClass('module_row')[0];
							if (next) {
								let tr='none',
									trEnd=function (e) {
										if(e.target===this){
											this.style.transition = this.style.transform ='';
											this.tfOff('transitionend', trEnd, {passive: true});
										}
									};
									next.tfOn('transitionend', trEnd, {passive: true});
									if(dir==='prev'){
										tr='transform ' + duration + 'ms ease';
									}
									else{
										setTimeout(()=>{
											next.style.setProperty('transition','transform ' + duration + 'ms ease','important');
											next.style.transform = '';
										},5);
									}
									next.style.setProperty('transition',tr,'important');
									next.style.transform = 'translateY(-62%)';
							}
						}
					}
					if(nav){
						const navItems = nav.children;
						for (let i = navItems.length - 1; i > -1; --i) {
							navItems[i].classList.toggle('active', i === currentIndex);
						}
					}
					let vHeight=realNormalHeight;
					if(currentIndex!==0){
						vHeight=-(normalHeight+(currentIndex-1)*fixedHeight-realFixedHeight);
					}
					if (silient === true) {
						wrapper.style.transition = 'none';
						Themify.trigger(ev);
						setTimeout(()=> {
							wrapper.style.transition = '';
						}, 100);
						el.classList.add('complete');
						el.tfClass('module_row')[0].style.transform = '';
						scrolling = false;
						if (horizontalIndex !== und) {
							scrollTo(currentIndex, horizontalIndex, silient);
						}
					} 
					else {
						Themify.trigger(ev);
						const trEnd=function(e){
							if(e.target===this || (isFade===true && (e.target.parentNode===this || e.target.parentNode.parentNode.parentNode===this))){
								this.tfOff('transitionend', trEnd, {passive: true});
								el.classList.add('complete');
								const __callback=()=>{
									scrolling = false;
									if (horizontalIndex !== und) {
										scrollTo(currentIndex, horizontalIndex, silient);
									}
								};
								if(e.elapsedTime<.7){
									const timer=Math.trunc(1000/(e.elapsedTime*10))+10;
									setTimeout(__callback,timer);
								}
								else{
									__callback();
								}
							}
						};
						wrapper.tfOn('transitionend', trEnd, {passive: true});
					}
					wrapper.style.transform = 'translateY(' + vHeight + 'px)';
					Themify.trigger('themify_onepage_afterload', [el]);
				}
			},
			_scrollHorizontally = (container,dir, silient)=> {
				if(scrolling===false){
					silient = !!silient;
					scrolling = true;
					const navItems = container.tfClass('fp-slidesNav')[0].children,
							index = parseInt(container.dataset.index),
							inner = container.tfClass('fp-section-container-inner')[0],
							el = inner.children[index],
							row = (silient !== true && isLargeScrolling===false && el && _ISPARALLAX_ === true) ? el.tfClass('module_row')[0] : null;
					if (row) {
						let next = dir==='prev'?el.nextElementSibling:el;
						if (next) {
							next = next.tfClass('module_row')[0];
							if (next) {
									let tr='none',
										trEnd=function (e) {
											if(e.target===this){
												this.style.transition = this.style.transform ='';
												this.tfOff('transitionend', trEnd, {passive: true});
											}
										};
									next.tfOn('transitionend', trEnd, {passive: true});
									if(dir==='prev'){
										tr='transform ' + duration + 'ms ease';
									}
									else{
										setTimeout(()=>{
											next.style.setProperty('transition','transform ' + duration + 'ms ease','important');
											next.style.transform = '';
										},5);
									}
									next.style.setProperty('transition',tr,'important');
									next.style.transform = 'translateX(-62%)';
							}
							
						}
					}
					for (let i = navItems.length - 1; i > -1; --i) {
						navItems[i].classList.toggle('active', i === index);
					}
					if (silient === true) {
						inner.style.transition = 'none';
						setTimeout(()=> {
							inner.style.transition = '';
						}, 100);
						el.classList.add('complete');
						el.tfClass('module_row')[0].style.transform = '';
						scrolling = false;
					} else {
						const trEnd=function(e){
							if(e.target===this || (isFade===true && e.target.parentNode===this)){
								this.tfOff('transitionend', trEnd, {passive: true});
								el.classList.add('complete');
								const __callback=()=>{
									scrolling = false;
								};
								if(e.elapsedTime<.7){
									const timer=Math.trunc(1000/(e.elapsedTime*10))+10;
									setTimeout(__callback,timer);
								}
								else{
									__callback();
								}
							}
						};
						inner.tfOn('transitionend', trEnd, {passive: true});
					}
					inner.style.transform = 'translateX(-' + (100 * index) + '%)';
					Themify.trigger('themify_onepage_afterload', [el]);
				}
			},
			scrollTo = (verticalIndex, horizontalIndex, silient)=>{
				if (scrolling === false) {
					// when lightbox is active, prevent scrolling the page
					if (doc.body.classList.contains('themify_mp_opened')) {
						return;
					}

					/* in case there's an element with same ID as location.hash, reset the default browser scroll */
					doc.body.scrollTop = 0;

					// Detect Keyboard Navigation
					let keyDown=typeof verticalIndex === 'string' && verticalIndex.indexOf('Key')>-1;
					if(keyDown){
						keyDown=verticalIndex;
						verticalIndex = verticalIndex === 'nextKey' || verticalIndex === 'rightKey'?'next':'prev';
					}
					// Detect Touch swipe
					let swipe=typeof verticalIndex === 'string' && verticalIndex.indexOf('swipe')>-1;
					if(swipe){
						swipe=verticalIndex;
						verticalIndex = verticalIndex === 'swipe_next'?'next':'prev';
					}
					const isNumber = verticalIndex !== 'next' && verticalIndex !== 'prev',
							oldIndex = currentIndex,
							verticalChilds = wrapper.children,
							item = verticalChilds[oldIndex];
					let changeHorizontal=false;
					if (isNumber) {
						currentIndex = verticalIndex;
					}
					if (item) {
						let index = parseInt(item.dataset.index) || 0,
							isHorizontalScroll = isHorizontal === true || (item.classList.contains('fp-section-container-horizontal') ? (isNumber || snakeScroll || swipe!==false || (keyDown === 'leftKey' || keyDown === 'rightKey')) : false);
						const horizontalChilds = isHorizontalScroll ? item.tfClass('fp-section-container') : null,
								horizontalItem = isHorizontalScroll && horizontalChilds[index] ? horizontalChilds[index] : null;
						if(isHorizontalScroll && isNumber && (!horizontalChilds[horizontalIndex] || !item.contains(horizontalChilds[horizontalIndex]))){
							isHorizontalScroll=false;
							_setActive();
						}
						if (!isNumber && !keyDown && !swipe) {
							const el = horizontalItem|| item,
									inner = el.tfClass('tf_scrollbar')[0],
									max = inner.scrollHeight - inner.clientHeight;
							if (max > 0) {
								const top = inner.scrollTop;
								if ((verticalIndex === 'prev' && top > 0) || (verticalIndex === 'next' && top < (max - 3))) {
									if (!Themify.isTouch && !_is_retina) {
										if(req2){
											cancelAnimationFrame(req2);
										}
										inner.style.scrollBehavior=(deltaY>90 || deltaY<-90)?'':'auto';
										req2=requestAnimationFrame(()=>{
											inner.scrollTop +=-deltaY;
											inner.style.scrollBehavior='';
										});
									}
									return;
								}
							}
						}
						if (isHorizontalScroll) {
							const oldHorizontalIndex = index;
							lazyLoad(horizontalItem);
							if (isNumber) {
								if (horizontalIndex !== und) {
									index = horizontalIndex;
								}
							} else {
								if (verticalIndex === 'next') {
									if (index < (horizontalChilds.length - 1)) {
										++index;
									}else{
										changeHorizontal=true;
									}
								} else if (verticalIndex === 'prev' && index > 0) {
									--index;
								}else{
									changeHorizontal=true;
								}
							}
							if (horizontalChilds[index]) {
								_setActive(index);
							}
							if (oldHorizontalIndex !== index || silient === true) {
								item.dataset.index = index;
								const dir= oldHorizontalIndex > index?'prev':'next',
								nextItem = dir==='prev' ? (index - 1) : (index + 1);
								_scrollHorizontally(item,dir, silient);
								if (horizontalChilds[nextItem]) {
									lazyLoad(horizontalChilds[nextItem]);
								}
								if(!isNumber || verticalIndex === oldIndex){
									return;
								}
							} else if (horizontalChilds[index] && horizontalChilds[index].nextElementSibling) {
								lazyLoad(horizontalChilds[index].nextElementSibling);
							}
						}
						else if(horizontalIndex===und || verticalChilds[currentIndex]){
							changeHorizontal=true;
						}
					} else {
						return;
					}
					if (isHorizontal === false || changeHorizontal===true) {
						if (verticalIndex === 'next') {
							if (oldIndex < (pagesCount - 1)) {
								++currentIndex;
							}
						} else if (verticalIndex === 'prev' && oldIndex > 0) {
							--currentIndex;
						}
						if (verticalChilds[currentIndex]) {
							_setActive();
						}
						if (oldIndex !== currentIndex || silient === true) {
							if (!isNumber && verticalChilds[currentIndex] && verticalChilds[currentIndex].classList.contains('fp-section-container-horizontal')) {
								const index = verticalIndex === 'next' ? 0 : (snakeScroll?verticalChilds[currentIndex].tfClass('fp-section-container').length - 1:0);
								if (index !== parseInt(verticalChilds[currentIndex].dataset['index'])) {
									scrollTo(currentIndex, index, true);
								}
							}
							scrolling = false;
							const dir= oldIndex > currentIndex?'prev':'next',
							nextItem = dir==='prev' ? (currentIndex - 1) : (currentIndex + 1);
							_scrollVertical((isNumber ? horizontalIndex : und),dir, silient);
							if (verticalChilds[nextItem]) {
								lazyLoad(verticalChilds[nextItem]);
							}
						} else if (verticalChilds[currentIndex] && verticalChilds[currentIndex].nextElementSibling) {
							lazyLoad(verticalChilds[currentIndex].nextElementSibling);
						}
					}
				}
			},
			_setActive = horizontalIndex=> {
				const active = wrapper.querySelectorAll('.fp-section-container-horizontal.active,.fp-section-container.active'),
						verticalIndex = currentIndex,
						verticalItem = wrapper.children[verticalIndex],
						isHorizontalScroll = horizontalIndex === und,
						isHorizontalWrapper = verticalItem.classList.contains('fp-section-container-horizontal'),
						bodyCl = doc.body.classList;

				let activeCl = (isHorizontal === true || isHorizontalWrapper) ? verticalIndex : _getAnchor(verticalItem.tfClass('module_row')[0], true),
						currentSection = verticalItem;

				if (activeCl === '' || activeCl === null) {
					activeCl = verticalIndex;
				}
				for (let i = active.length - 1; i > -1; --i) {
					active[i].classList.remove('complete', 'active');
				}
				if (isHorizontalWrapper) {
					if (isHorizontalScroll) {
						horizontalIndex = parseInt(verticalItem.dataset.index) || 0;
					}
					currentSection = verticalItem.tfClass('fp-section-container')[horizontalIndex];
					let anchor = _getAnchor(currentSection.tfClass('module_row')[0], true);
					if (!anchor) {
						anchor = horizontalIndex;
					}
					activeCl += '-' + anchor;
					if (isHorizontalScroll) {
						currentSection.classList.add('active', 'complete');
					}
				} else {
					activeCl += '-0';
				}

				currentSection.classList.add('active');
				_setAnchor(currentSection);
				for (let i = bodyCl.length - 1; i > -1; --i) {
					if (bodyCl[i].indexOf('fp-viewing-') === 0) {
						bodyCl.remove(bodyCl[i]);
						break;
					}
				}
				bodyCl.add('fp-viewing-' + activeCl);
				lazyLoad(currentSection);
				_mediaAutoPlay(currentSection);
			},
			_keydown =  e=> {
				if (scrolling === false) {
					const code = e.key || e.keyCode;
					if (code) {
						switch (code) {
							case 38:
							case 'ArrowUp':
							case 33:
							case 'PageUp':
								scrollTo('prevKey');
								break;
							case 37:
							case 'ArrowLeft':
								scrollTo('leftKey');
								break;
							case 39:
							case 'ArrowRight':
								scrollTo('rightKey');
								break;
							case 34:
							case 40:
							case 'ArrowDown':
							case 'PageDown':
								scrollTo('nextKey');
								break;
						}
					}
				}
			},
			_updateFullPage =  w=> {
				const bp = _getCurrentBreakPoint(w);
				for (let  childs = wrapper.children, j = childs.length - 1; j > -1; --j) {
					if (childs[j].classList.contains('module_row') && (childs[j].classList.contains('hide-' + bp) || (childs[j].offsetWidth === 0 && childs[j].offsetHeight === 0))) {
						childs[j].remove();
					}
				}
			},
			lazyLoad = el=> {
				if (el && !el.hasAttribute('data-done')) {
					el.dataset.done=1;
					Themify.lazyScroll(Themify.convert(Themify.selectWithParent('[data-lazy]', el)).reverse(), true);
				}
			},
			_mediaAutoPlay =  el=> {
				if (el) {
					const items = el.querySelectorAll('video,audio');
					for (let i = 0, len = items.length; i < len; ++i) {
						if (items[i]) {
							if (items[i].readyState === 4) {
								items[i].play();
							} else {
								Themify.requestIdleCallback(()=> {
									items[i].tfOn('loadedmetadata', function () {
										setTimeout(()=> {
											this.play();
										}, 100);
									}, {passive: true, once: true});
								}, 220);
							}
						}
					}
				}
			},
			_setActiveMenu =anchor=> {
				const menu = doc.tfId('main-nav');
				if (menu !== null) {
					const items = menu.tfTag('li');
					let aSectionHref = anchor ? menu.querySelector('a[href="#' + anchor.replace('#', '') + '"]') : null;
					if (aSectionHref !== null) {
						aSectionHref = aSectionHref.parentNode;
					}
					for (let i = items.length - 1; i > -1; --i) {
						if (aSectionHref === items[i]) {
							items[i].classList.add('current-menu-item');
						} else {
							items[i].classList.remove('current_page_item', 'current-menu-item');
						}
					}
				}
			},
			_getAnchor =  (row, ignore)=> {// Get builder rows anchor class to ID //
				if (ignore === true || !row.hasAttribute('data-hide-anchor')) {
					const anchor = row.dataset.anchor || row.id || '';
					return anchor.replace('#', '');
				}
				return '';
			},
			_setAnchor =row=>{
				if (row) {
					row = row.tfClass('module_row')[0];
					if (row) {
						const anchor = _getAnchor(row);
						if (anchor && anchor !== '#') {
							if (location.hash !== '#' + anchor) {
								const item=doc.tfId(anchor);
								if(item){//if there is an element,browser will move the scrollbar
									item.removeAttribute('id');
								}
								win.location.hash = anchor;
								if(item){
									item.id=anchor;
								}
							}
						} else {
							history.replaceState(null, null, location.pathname);
							prevHash='';
						}
					}
				}
			},
			_init = w=> {
				if (wrapper) {
					const bp=_getCurrentBreakPoint(w),
						callback = ()=> {
							const isMobile = _MOBILE_BREAKPOINT_ && w <= _MOBILE_BREAKPOINT_,
									bodyCl=doc.body.classList;
							if(isDisabled===false){
								let vHeight=realNormalHeight;
								if(currentIndex!==0){
									vHeight=-(normalHeight+(currentIndex-1)*fixedHeight-realFixedHeight);
								}
								wrapper.style.transform = 'translateY(' + vHeight + 'px)';
							}
							if (isMobile === true && bodyCl.contains('full-section-scrolling')) {
								_disable();
								
							}
							else if((isMobile !== true && isDisabled) || !initOnce){
								isDisabled=false;
								Themify.trigger('tb_scroll_highlight_disable');
								bodyCl.add('full-section-scrolling');
                                if(isHorizontal===true){
                                    bodyCl.add('full-section-scrolling-horizontal');
                                }
                                if(snakeScroll===false){
                                    bodyCl.add('full-section-scrolling-single');
                                }
								if(has_footer===true){
									bodyCl.add('fullpage-footer');
								}
								Themify.lazyDisable = true;
								run(w);
							}
							else if(isDisabled===false){
								const items=wrapper.children;
								for(let i=items.length-1;i>-1;--i){
									let vh=i===0 || fixedHeight===0?normalHeight:fixedHeight;
									items[i].style.height=vh+'px';
								}
								if(prevbreakpoint!==bp){
									for (let childs = wrapper.children, i = childs.length - 1; i > -1; --i) {
										let row_inner=childs[i].tfClass('row_inner')[0];
										if(row_inner!==und){
											let paddings=_getPaddings(childs[i].tfClass('module_row')[0],bp);
											if(paddings[0]!==''){
												row_inner.style.paddingTop=paddings[0];
											}
											if(paddings[1]!==''){
												row_inner.style.paddingBottom=paddings[1];
											}
										}
									}
								}
							}
							prevbreakpoint=bp;
						};
					if(prevbreakpoint!==bp){
						_updateFullPage(w);
					}
                    Themify.on('themify_builder_loaded', callback,true,Themify.is_builder_loaded || win.tbLocalScript === und);
				} else {
					Themify.trigger('themify_onepage_afterload');
				}

			},
			callcullateHeight=vh=>{
				return new Promise(resolve => {
					const bodyCl =  doc.body.classList,
						isNotTransparent=!bodyCl.contains('transparent-header') && !bodyCl.contains('menubar-bottom') && !bodyCl.contains('menubar-top');
					let offset=0;
					if(bodyCl.contains('admin-bar')){
						offset=getComputedStyle(doc.documentElement).getPropertyValue('margin-top') || 0;
						if(offset){
							offset=parseFloat(offset);
							if(isNotTransparent===true){
								offset=-offset;
							}
						}
					}
					doc.documentElement.style.setProperty('--fp_vh', vh+'px');
					if(isNotTransparent===true){
						if(hasFixedHeader===true){
							Themify.on('tf_fixed_header_init', ()=>{
                                setTimeout(()=>{
                                    ThemifyFixedHeader.calculateTop(null,true).then(params=>{
                                            realFixedHeight=params[2];
                                            realNormalHeight=params[1];
                                            normalHeight=vh-params[1]-offset;
                                            fixedHeight=vh-realFixedHeight-offset;
                                            resolve([normalHeight,fixedHeight]);
                                    });
                                },10);
                            },true,typeof ThemifyFixedHeader!=='undefined');
						}
						else{
							const headerWrap=doc.tfId('headerwrap');
							if(headerWrap!==null){
								const headerHeight=headerWrap.getBoundingClientRect().height;
								fixedHeight=vh;
								if(fixedHeight>(headerHeight+1)){
									fixedHeight-=headerHeight - offset;
								}
								normalHeight=fixedHeight;
							}
                            else{
								fixedHeight=normalHeight=vh;
							}
							resolve([normalHeight,fixedHeight]);
						}
					}
					else{	
						fixedHeight=normalHeight=vh-offset;
						resolve([normalHeight,fixedHeight]);
					}
				});
			};
	points.push('desktop');
	Themify.on('themify_theme_fullpage_init',options=> {
		win.scroll(0, 0);
		isHorizontal = !!options.is_horizontal;
		has_footer=!!options.has_footer;
		hasFixedHeader=!!options.is_fixedHeader;
		wrapper = doc.tfId('tbp_content') || doc.tfId('body');
		wrapper = wrapper !== null ? wrapper.tfClass('themify_builder')[0] : doc.querySelector('.themify_builder:not(.not_editable_builder)');
		Themify.wow().then(()=> {
			callcullateHeight(Themify.h).then(()=>{
				_init(Themify.w);
			});
			Themify.on('tfsmartresize', e=>{
				if(initOnce){
					callcullateHeight(e.h).then(()=>{
						_init(e.w);
					});
				}
			});
		});
	}, true);

})(Themify, document, window, themifyScript,undefined);