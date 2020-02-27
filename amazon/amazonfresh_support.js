// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language_out ECMASCRIPT_2017
// ==/ClosureCompiler==
javascript:(
    function(f){
        console.log('load jquery');
        var script = document.createElement('script');
        script.src = '//code.jquery.com/jquery-3.4.1.min.js';
        script.onload = function(){
            var $ = jQuery.noConflict(true);
            f($);
        };
        document.body.appendChild(script);
    }(
    function($,undefined){

        var groceryList = [];
        var currentShoppingList = null;
        var token = '';
        const wait = 555;//milsec
        const storageKeyName = 'amaxon_current_shippinglist';

        //お買いものリストだったらフォーム出したり
        if(location.href.match(/www.amazon.co.jp\/afx\/lists\/grocerylists/)){
            var head = document.head.innerHTML;
            if( head.match(/"csrfToken":"([^"]*)"/) ){
                token = RegExp.$1;
                console.log(token);
            }
    
            findShoppingList();
            createLeftNaviForm();
            localStorage.setItem(storageKeyName, JSON.stringify(currentShoppingList));
            return;
        }

        //お買いものリスト外で緑のカートボタンがあるなら
        var spans = $('span[data-fresh-add-to-cart]');
        if( spans.length > 0){
            var json = localStorage.getItem(storageKeyName);
            if(!json){
                alert('お買いものリストが記録されていません');
                return;
            }
            var lastShoppingList = JSON.parse(json);
            console.log(lastShoppingList);
            showAddShoppingListButton(lastShoppingList);
            alert('【'+lastShoppingList.name +'】に商品を追加します');
        }else{
            alert('ブックマークレットの対象ページではありません');
            window.location.href = 'https://www.amazon.co.jp/afx/lists/grocerylists';
            return;
        }
        
        //左ナビにフォーム出すだけ
        function createLeftNaviForm(){
            $('div#left-0')
            .append(
                '<div style="margin:5px">■ASIN<br>' + 
                '<textarea id="_knx_newAsinText" rows="10"></textarea><br>'+
                '<button id="_knx_addListButton" >リストに追加</button>' + 
                '</div>'
            )
            .append(
                '<hr>'+
                '<div><button id="_knx_addCartButton" >商品をカートに入れる</button></div>'
            )
            .append(
                '<div><button id="_knx_showAsinButton" >ASINを表示</button></div>'
            );

            $('button#_knx_addListButton').on('click', function(){addItemToShoppingList()});
            $('button#_knx_addCartButton').on('click', function(){addItemToCart()});
            $('button#_knx_showAsinButton').on('click', function(){showAsin()});
        }

        //お買いものリストの名前とIDをHTMLから探す
        function findShoppingList(){
            $('ul#shopping-list-menu li').each(function(i,e){

                var g = $(e).find('div.shopping-list-nav').first();
                var id = g.attr('id').replace('-shopping-list-display','');
                var name = g.text().trim();
                var o = {id, name};
                groceryList.push(o);

                if( $(e).find('div#selectedListIndicator').length>0 ){
                    currentShoppingList = o;
                    console.log(currentShoppingList);
                }
            });
            console.log('お買いものリスト', groceryList);
        }
        //お買いものリスト内にある商品をHTMLから探す
        function findItems(onlyAvailable){
            var items = [];
            $('div.asin-item-grid div.asinWrapper').each(function(i,e){
                var asin = e.id.replace('-item-container','');
                var img = $(e).find('div.imageRow img').first();
                var name = '';
                if(img.length>0){
                    name = img.attr('alt');
                }

                var available = false;
                if( $(e).find('span#' + asin + '-add-to-cart').length > 0){
                    available = true;
                }
                items.push( {asin, name, available} );
            });
            console.log('all items :',items);

            if( onlyAvailable ){
                items = items.filter( i => i.available);
            }

            return items;
        }

        //カートに入れる（画面上のボタンを順番に押すだけ）
        async function addItemToCart(){
            var items = findItems(true);
            var btns = [];
            for(i in items){
                console.log(items[i].asin);
                var span = $('span#' + items[i].asin + '-add-to-cart');
                if(span.is(':visible')){
                    btns.push(span);
                }else{
                    console.log('invisible cart button %s', items[i].asin);
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
            var items = findItems(false);
            var existedAsins = [];
            for(i in items){
                existedAsins.push(items[i].asin);
            }
            var textList = $('textarea#_knx_newAsinText').val().split("\n");
            var newAsins = cleanList(textList, existedAsins);

            $('textarea#_knx_newAsinText').val(newAsins.join("\n"));

            if(newAsins.length==0){
                alert('追加する商品が指定されていないです');
                return;
            }
            if( confirm(newAsins.length +'個の商品を買い物リストに追加しますか？')){
                var added=0;
                for(i in newAsins){
                    $('h1#shopping-list-title').text( newAsins[i] + ' (' + (parseInt(i)+1) + '/' + asinList.length + ')' );
                    var apiResult = await callAddItemAPI(currentShoppingList.id,  newAsins[i]);
                    console.log(apiResult);
                    await new Promise(resolve => setTimeout(resolve, wait));
                    added++;
                }
                alert(added + '商品を追加しました');
                if(added>0){
                    window.location.reload(true);
                }
            }
        }
        //AmazonのAPIを呼び出す
        async function callAddItemAPI(shoppingListID, asin){
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            };
            const body = "listID="+encodeURIComponent(shoppingListID) + '&asin='+encodeURIComponent(asin);
            var response = await fetch('https://www.amazon.co.jp/afx/lists/json/shoppinglists/additem', 
                {method:'POST', 'headers':headers, 'body':body, credentials:'same-origin'}
            );

            var json = await response.json();
            return json;
        }
        
        //
        function showAddShoppingListButton( list ){
            $('span[data-fresh-add-to-cart]').each(function(index){
                var data = JSON.parse($(this).attr('data-fresh-add-to-cart'));
                console.log(data.asin);
                $(this).parent().append(
                    '<button class="_knx_addListButton" data-asin="'+data.asin+'" data-list="'+list.id+'">買いものリストへ</button>'
                );
            });
            $('button._knx_addListButton').on('click', async function(){
                var apiResult = await callAddItemAPI(this.dataset.list, this.dataset.asin);
                if(apiResult.successful){
                    $(this).text('追加しました');
                }
            });
        }

        //ASIN表示
        function showAsin(){
            var items = findItems(false);
            var asins = [];
            
            for(var i in items){
                asins.push(items[i].asin);
            }
            var tabbed = asins.join("\t");
            console.log('--ASIN--');
            console.log(tabbed);

            var html = '';
            for(var i in items){
                html += items[i].asin + ' ' + items[i].name + '<br>';
            }

            var w = window.open('','amazonfresh','width=750,height=300,');
            w.document.write(html);
        }
        function cleanList(inputList, nowList){
            var cleaned = inputList
            //スペースは除去したあとに
            .map( v => v.replace(/\s+/g, "") )
            //空行は除去
            .filter( v => v!='')
            //配列内の重複も除去
            .filter(　(v, i, self) => self.indexOf(v) === i)
            //nowListにあるものも除去
            .filter( v => {
                if(nowList.indexOf(v)>=0){
                    console.log('duplicated %s', v);
                    return false;
                }
                return true;
            });
            console.log(cleaned);
            return cleaned;
        }
    })
)
