// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language_out ECMASCRIPT_2017
// ==/ClosureCompiler==
javascript:(
    async function(){

        //0.画面チェック
        if( !location.href.match(/lohaco\.jp\/sf\/cart\//)){
            alert("対象のページではないようです。カゴのページに移動します");
            window.location.href='https://lohaco.jp/sf/cart/';
            return;
        }
        
        var deletedCount = 0;
        var targetItems = [];

        //1. 普通の商品
        targetItems = targetItems.concat(LOHACO.Env.PAGE.lohacoItems);

        //2. discountItem
        for(var i=0; i<LOHACO.Env.PAGE.setDiscounts.length; i++){
            var setDiscount = LOHACO.Env.PAGE.setDiscounts[i];
            console.log('start %s-%s', setDiscount.name, setDiscount.lohacoItems.length );
            targetItems = targetItems.concat(setDiscount.lohacoItems);
        }

        //3. sellerItem
        for(var i=0; i<LOHACO.Env.PAGE.sellers.length; i++){
            var seller = LOHACO.Env.PAGE.sellers[i];
            console.log('start %s-%s', seller.name, seller.items.length );
            targetItems = targetItems.concat(seller.items);
        }

        //4. supplierItem
        targetItems = targetItems.concat(LOHACO.Env.PAGE.supplierItems);

        //5. 商品を消す
        console.log('target Items = %s', targetItems.length);
        deletedCount += await processItems(targetItems);

        //6. ここで終わり
        alert(deletedCount + '商品を消しました。F5でリロードしてね。');

    //======
        //Itemを繰り返してdelete呼ぶ関数
        async function processItems(items){
            var cnt = 0;
            for(var i=0; i<items.length; i++){
                //投げすぎないためのやさしさ。2回目以降はちょっと止まろう
                if(i>0){
                    await new Promise(resolve => setTimeout(resolve, 500)) // 0.5秒待つ
                }

                var code = items[i].catalogCode;
                var result = await deleteItem(code);
                cnt+=result;
                if(result == 1){
                    console.log('%s is OK', code);
                    deletedEffect(code);
                }else{
                    console.log('%s is NG', code);
                }
            }
            return cnt;
        }
        //単品Itemを削除するAPIを実行する関数
        async function deleteItem(itemcd){
            var url = 'https://lohaco.jp/sf/api/b/cart/items/' + itemcd;
            var response = await fetch(url, 
                {
                    method: "DELETE", 
                    headers: {
                        "Content-Type": "application/json", 
                        "x-csrf-token":LOHACO.Env.CSRF_TOKEN },
                    body:"{}"
                });
            var json = await response.text();
            // console.log(json);

            if(response.status=='200'){
                return 1;
            }else{
                return 0;
            }
        }
        //削除が終わったら表示を変える関数(動いている感じが出ないから)
        //商品名に取り消し線を入れて、自動スクロール
        function deletedEffect(itemcd){
            var selector = 'p.title > a[href^="/product/' + itemcd + '"]';
            var a = $(selector);
            if( a.length == 1){
                a.html( '<s>' + a.html() + '</s>' );
                var y = a.offset().top - 100;
                $(window).scrollTop(y);
            }
        }
    }
)();
