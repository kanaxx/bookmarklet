void((function(f){
    if(window.jQuery && jQuery().jquery > '3.2') {
        console.log('use jquery');
      f(jQuery);
    }else{
        console.log('load jquery');
      var script = document.createElement('script');
      script.src = '//code.jquery.com/jquery-3.2.1.min.js';
      script.onload = function(){
        var $ = jQuery.noConflict(true);
        f($);
      };
      document.body.appendChild(script);
    }
  })(
    function($,undefined){
        interval_second=0.8;
        api_limit=5;
        max_items = 50;
        list = [];
        err_list =[];
        ok_list=[];

        console.log('jquery version is %s', $.fn.jquery);

        if( $('div#__all_into_cart').length<=0 ){
            $('div#landingBox').prepend(
                '<div id="__all_into_cart">'+
                '<div style="display:inline-block">入れるカタログコード<br><textarea rows="15" id="__all_into_cart_list"></textarea></div>'+
                '<div style="display:inline-block">かごに入ったもの<br><textarea rows="15" id="__all_into_cart_ok_list"></textarea></div>'+
                '<div style="display:inline-block">かごに入らなかったもの<br><textarea rows="15" id="__all_into_cart_err_list"></textarea></div>'+
                '<div style="display:inline-block">ページ内のカタログコード<br><span id="__all_into_cart_num"></span><br><br>処理済み<br><span id="__all_into_cart_msg"></span></div>'+
                '</div>');

            list = findCatalogCode();
            console.log(list);
            $('textarea#__all_into_cart_list').val( list.join("\n"));
            $('span#__all_into_cart_num').text(list.length);
            
            alert('ページ内に' + list.length + '個のカタログIDが見つかりました');
            
            return;
        }else{
            list_text = $('textarea#__all_into_cart_list').val();
            list = list_text.split(/\n/);
            list = list.filter(function (x, i, self) {
                if(x.trim()==''){
                    return false;
                }
                return self.indexOf(x) === i;
            });

            item_count = Math.min(list.length, max_items);
            api_call_count = Math.ceil( item_count/api_limit );
            console.log('item count=%s API call count=%s', item_count, api_call_count);
            
            var df0 = $.Deferred();
            var dfi = df0.then( function(){ 
                console.log('df0 break!');
                return wait(0.5);
            });
            for( var i=0; i<api_call_count;i++){
                dfi = dfi
                .then(function(){
                    return wait(interval_second);
                })
                .then( function(){ 
                    //return $.when(callRegisterCart());
                    return $.when.apply($,callRegisterCart());
                })
                .then(function(a){
                    console.log(arguments);

                    for(var i=0; i<arguments.length; i++){
                        if(arguments[i].result){
                            ok_list.push(arguments[i].cd);
                        }else{
                            err_list.push(arguments[i].cd);
                        }
                    }
                    console.log('ok=%s, ng=%s', ok_list.length, err_list.length);
                    $('#__all_into_cart_msg').text(ok_list.length + err_list.length + '/' + item_count);
                    refreshList();
                });
            }
            dfi.then(function(){
                console.log('Finish');
                
                refreshList();
                alert( ok_list.length +'個の商品をかごにいれました。');
            });

            console.log('main thread is finished');
            df0.resolve();
        }

        function refreshList(){
            $('textarea#__all_into_cart_list').val( list.join("\n"));
            $('textarea#__all_into_cart_ok_list').val( ok_list.join("\n"));
            $('textarea#__all_into_cart_err_list').val( err_list.join("\n"));
        }
        function findCatalogCode(){
            var ans = [];

            link = $('div#landingBox a[href^="/product/"]');
            link.each(function(a,b){ 
                href=$(b).attr('href');
                //console.log(href);
                if( href.match(/\/product\/([0-9a-zA-Z]*)/ )){
                    ans.push(RegExp.$1);
                }
            });
            
            ans = ans.filter(function (x, i, self) {
                return self.indexOf(x) === i;
            });
            return ans;
        }
        
        function callRegisterCart(){
            dflist = [];
            for( i=0; i<api_limit; i++){
                df = registerCart();
                if(df != null){
                    dflist.push(df);
                }
            }
            return dflist;
        }
        function registerCart() {
            var e = list.shift();
            a=1;
            if( e==undefined ){
                return null;
            }
            console.log('call add cart [%s]', e);
            var d = $.Deferred();

            $.ajax({
                url: 'https://lohaco.jp/tpc/top/apiRegistCart/',
                type: "POST",
                dataType: "xml",
                data: "ctgItemCd=" + encodeURI(e) + "&qty=" + encodeURI(a),
            }).done(function (response, textStatus, jqXHR) {
                console.log('done add cart [%s]', e);
                d.resolve({'cd':e, 'result':true});
            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.log('fail add cart [%s]', e);
                d.resolve({'cd':e, 'result':false});
            });
            return d.promise();
        }
        function wait(sec) {
            // console.log('wait %s second', sec);
            var d = $.Deferred();
            setTimeout(function() {
                console.log('waited %s second', sec);
                d.resolve(sec);
            }, sec * 1000);
            // console.log('return wait method', sec);
            return d.promise();
        }
    }
))
