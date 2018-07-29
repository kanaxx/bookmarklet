//QPS制限あり
//APIのパラメータあり
void((function(f){
    if(window.jQuery && jQuery().jquery > '3.2') {
      f(jQuery);
    }else{
      var script = document.createElement('script');
      script.src = '//code.jquery.com/jquery-3.2.1.min.js';
  
      script.onload = function(){
        var $ = jQuery.noConflict(true);
        f($);
      };
      document.body.appendChild(script);
    }
  })(
    function($, undefined){
  
      //query per secondなので1
      var interval=1;
      var data = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q', 'r','s','t','u','v','w','x','y','z'];
      var answer = [];

      //同時実行数は10
      var concurrent_limit = 10;
      //並列処理の回数(データ数を同時実行数で割る)
      var api_calls = Math.ceil(data.length/concurrent_limit);

      //一番最初のDeferred。引き止め役
      var root = $.Deferred();
      var deferred = root.then(function(){return wait(3)});

      for( i = 0; i < api_calls ; i++){
        deferred = deferred
        .then( 
          function(counter){ 
            return function(){
              console.log('-API set [%s]', counter);
              var deferred_list=[];
              for(var j=0; j<concurrent_limit; j++){
                var df = api(data[concurrent_limit*counter+j]);
                if( df != null){
                  deferred_list.push(df);
                }
              }
              deferred_list.push(wait(interval));
              return $.when.apply($,deferred_list);
            }
          }(i)
        )
        .done(function(){
          //apiとwaitが終わったら答えが受け取れる部分
          console.log(arguments);
          for( var a=0; a<concurrent_limit; a++){
            answer.push(arguments[a]);
          }
        });
      
      }
      deferred.then(function(){
        //全部終わったら実行する処理
        console.log('final answer is');
        console.log(answer);
      });

      //引き止め役をresolveしてあげる
      root.resolve();
      console.log('--end function--');
  
      //この先関数 =======================================

      //ただ止めるだけの関数(引数で指定された秒数止めるように変更)
      function wait(second) {
        var df = new $.Deferred;
        console.log('wait() :setTimeout with %s', second);
        setTimeout(function (){
          df.resolve();
          console.log('wait() :resolve after %s second', second);
        }, second * 1000);
        return df.promise();
      }

      //高負荷にさせるのを避けたい処理
      //必要なものは関数内に閉じる。引数を受け取って、結果はresoleで返す
      function api(mydata){
        if( mydata == undefined ){
          return null;
        }
        console.log('call API [%s]', mydata);
        var d = $.Deferred();

        $.ajax({
            url: 'https://res.cloudinary.com/kanaxx/raw/upload/v1532448755/static/sample.json',
            type: "GET",
            dataType: "json",
            data: "param=" + encodeURI(mydata),
        }).done(function (response, textStatus, jqXHR) {
            console.log('done API [%s]', mydata);
            d.resolve({'param':mydata.toUpperCase(), 'result':true});
        }).fail(function (jqXHR, textStatus, errorThrown) {
          console.log(errorThrown);
            console.log('fail API [%s]', mydata);
            d.resolve({'param':mydata.toUpperCase(), 'result':false});
        });
        return d.promise();
  
      }
    }
  ))
  
