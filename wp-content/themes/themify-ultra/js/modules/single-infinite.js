/* Themify Single Infinite Scroll*/
( (Themify,doc )=> {
	'use strict';
        let isRemoved=false;
        const content=doc.tfId('body');
        if(content){
                const getCss=d=>{
                        const vars = d.tfId('tf_infinity_css');
                        if(vars){
                                const temp = d.createElement('div');
                                temp.appendChild(vars.content);
                                return JSON.parse(temp.innerHTML);
                        }
                        return {};
                };
                const loadedCss={},
                css=getCss(doc);
                for(let i in css){
                    if(!css[i].m){
                        loadedCss[i]=true;
                    }
                }
                content.tfOn('infinitebeforeloaded',e=>{ 
                    /* prevent duplicate "id" attributes in the #commentform */
                        const d=e.detail.d,
                            form = d.tfId( 'commentform' );
                        if ( form) {
                                let post_id = form.querySelector( 'input[name="comment_post_ID"]' );
                                if(post_id){
                                    post_id=post_id.value;
                                    for(let fields=[ 'comment', 'author', 'email', 'url' ],i=fields.length-1;i>-1;--i){
                                        let input=form.querySelector( '#' + fields[i] ),
                                            label=form.querySelector( 'label[for="' + fields[i] + '"]' );
                                        if(input){
                                            input.id=fields[i] + '-' + post_id;
                                        }   
                                        if(label){
                                            label.setAttribute('for', fields[i] + '-' + post_id );
                                        }
                                    }
                                }
                        }
                        if(isRemoved===false){
                                isRemoved=true;
                                doc.body.classList.remove('content-right','content-left','sidebar2','sidebar1','single-split-layout','sidebar-none');
                        }
                        const vals = getCss(d),
                                len=Object.keys(vals).length,
                                item=d.tfClass('tf_single_scroll_wrap')[0];
                        if(item){
                                item.classList.add('tf_opacity');
                                let found = false,
                                    j=0;
                                for(let i in vals){
                                    if(!loadedCss[i] && !vals[i].m){
                                        loadedCss[i]=true;
                                        found=true;
                                        Themify.loadCss(vals[i].s,null,vals[i].v).then(()=>{
                                            if(j===len){
                                                    item.classList.remove('tf_opacity');
                                            }
                                        });
                                    }
                                    ++j;
                                }
                                if(found===false){
                                    item.classList.remove('tf_opacity');
                                }
                        }
                },{passive:true});
                
                Themify.infinity(content,{
                        id:'#body',
                        scrollThreshold:true,
                        history:true
                });
        }

})(Themify,document);
