// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language_out ECMASCRIPT_2017
// ==/ClosureCompiler==
javascript:(
    function(f){
        if(window.jQuery && jQuery().jquery > '3.2') {
            console.log('use jquery');
            f(jQuery);
        }else{
            console.log('load jquery');
            var script = document.createElement('script');
            script.src = '//code.jquery.com/jquery-3.4.1.min.js';
            script.onload = function(){
                var $ = jQuery.noConflict(true);
                f($);
            };
            document.body.appendChild(script);
        }
    }(
    function($,undefined){

        var items = [];
        var groceryList = [];
        var current = '';
        var token = '';
        const wait = 750;//milsec
        const storageKeyName = 'amaxon_current_shippinglist';

        if(location.href.match(/www.amazon.co.jp\/afx\/lists\/grocerylists/)){
            var head = document.head.innerHTML;
            if( head.match(/"csrfToken":"([^"]*)"/) ){
                token = RegExp.$1;
                console.log(token);
            }
    
            findShoppingList();
            createLeftNaviForm();
            localStorage.setItem(storageKeyName, current);
            return;
        }

        var spans = $('span[data-fresh-add-to-cart]');
        if( spans.length > 0){
            var lastListId = localStorage.getItem(storageKeyName);
            console.log(lastListId);
            showButton(lastListId);

        }else{
            alert('対象ページではありません');
            window.location.href = 'https://www.amazon.co.jp/afx/lists/grocerylists';
            return;
        }
        
        //左ナビにフォーム出すだけ
        function createLeftNaviForm(){
            $('div#left-0')
            .append(
                '<div>' + 
                '<textarea id="_az_asinList" rows="10"></textarea><br>'+
                '<button id="_az_addItem" >リストに追加</button>' + 
                '</div>'
            )
            .append(
                '<hr>'+
                '<div><button id="_az_addCart" >商品をカートに入れる</button></div>'
            );

            $('button#_az_addItem').on('click', function(){addItemToShoppingList()});
            $('button#_az_addCart').on('click', function(){addItemToCart()});
        }

        //お買いものリストの名前とIDをHTMLから探す
        function findShoppingList(){
            $('ul#shopping-list-menu li').each(function(i,e){

                var g = $(e).find('div.shopping-list-nav').first();
                var id = g.attr('id').replace('-shopping-list-display','');
                var name = g.text().trim();
                groceryList.push({id, name});

                if( $(e).find('div#selectedListIndicator').length>0 ){
                    current = id;
                    console.log(current);
                }
            });

            console.log(groceryList);
        }
        //お買いものリスト内にある商品をHTMLから探す
        function findAvailableItems(){
            items = [];
            var i=$('div.asin-item-grid input[type="hidden"]');
            $('div.asin-item-grid input[type="hidden"]').each(function(i,e){
                var asin = e.id.replace('-list-item-id','');
                var id = $(e).val();
                if( $('div#'+ asin + '-item-container').css('display') != 'none'){
                    items.push({id:id,asin:asin});
                    console.log('%s is visible', asin);
                }else{
                    console.log('%s is not visible',asin);
                }
            });
            console.log(items);
            return items;
        }

        //カートに入れる（ボタンを押すだけ）
        async function addItemToCart(){
            var items = findAvailableItems();
            var btns = [];
            for(i in items){
                console.log(items[i].asin);
                var span = $('span#' + items[i].asin + '-add-to-cart');
                if(span.is(':visible')){
                    btns.push(span);
                }else{
                    console.log('invisible cart button');
                }
            }
            if(confirm(btns.length + 'の商品をカートに入れますか？')){
                for(i in btns){
                    btns[i].click();
                    await new Promise(resolve => setTimeout(resolve, wait));
                }
                alert('カートに入れました');
            }
            console.log('end of addCart');
        }

        //shoppingListにASINを登録する
        async function addItemToShoppingList(){
            var items = findAvailableItems();
            var existedAsins = [];
            for(i in items){
                existedAsins.push(items[i].asin);
            }
            var asinList = $('textarea#_az_asinList').val().split("\n")
                .filter(function(v){ return v.trim()!='';})
                .filter(function (x, i, self) {
                    return self.indexOf(x.trim()) === i;
                });
            // console.log(asinList);
            $('textarea#_az_asinList').val(asinList.join("\n"));

            if(asinList.length==0){
                alert('追加する商品が指定されていないです');
                return;
            }
            if( confirm(asinList.length +'個の商品を買い物リストに追加しますか？')){
                var added=0;
                for(i in asinList){
                    var inputAsin = asinList[i];
                    if(existedAsins.indexOf(inputAsin)>=0){
                        console.log('duplicated %s', inputAsin);
                        continue;
                    }

                    $('h1#shopping-list-title').text(inputAsin + ' (' + (parseInt(i)+1) + '/' + asinList.length + ')' );
                    var result = await callAddItemAPI({asin:inputAsin, listID:current});
                    console.log(result);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    added++;
                }
                alert('追加しました');
                if(added>0){
                    window.location.reload(true);
                }
            }
        }
        //AmazonのAPIを呼び出す
        async function callAddItemAPI(param){
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            };
            const body = Object.keys(param).map((key)=>key+"="+encodeURIComponent(param[key])).join("&");
            var response = await fetch('https://www.amazon.co.jp/afx/lists/json/shoppinglists/additem', 
                {method:'POST', 'headers':headers, 'body':body, credentials:'same-origin'}
            );

            var json = await response.json();
            return json;
        }
        
        function showButton( listID ){
            $('span[data-fresh-add-to-cart]').each(function(index){
                var data = JSON.parse($(this).attr('data-fresh-add-to-cart'));
                console.log(data.asin);
                $(this).parent().append(
                    '<button class="_az_addlist" data-asin="'+data.asin+'" data-list="'+listID+'">買いものリストへ</button>'
                );
            });
            $('button._az_addlist').on('click', async function(){
                console.log(this.dataset.asin);
                console.log(this.dataset.list);
                
                var json = await callAddItemAPI({asin:this.dataset.asin, listID:this.dataset.list});
                if(json.successful){
                    $(this).text('追加しました');
                }
            });
        
        }
    }

    )
)
