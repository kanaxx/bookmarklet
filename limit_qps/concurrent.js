//QPS制限あり
//APIのパラメータなし
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
  
      var interval=1;
      var data = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q', 'r','s','t','u','v','w','x','y','z'];
      var answer = [];

      var concurrent_limit = 10;
      var api_calls = Math.ceil(data.length/concurrent_limit);

      var root = $.Deferred();
      var deferred = root.then(function(){return wait(1)});

      for( i = 0; i < api_calls ; i++){

        deferred = deferred
        .then( 
          function(counter){ 
            return function(){
              console.log('start api call (%s)', counter);
              var deferred_list=[];
              for(var j=0; j<concurrent_limit; j++){
                var df = api();
                if( df != null){
                  deferred_list.push(df);
                }
              }
              deferred_list.push(wait(interval));
              return $.when.apply($, deferred_list);
            }
          }(i)
        )
        .done(function(){
          //apiとwaitが終わったら答えが受け取れる部分
          //api側でanswerにpushしているので不要。
        });
      }
      deferred.then(function(){
        //全部終わったら実行する処理
        console.log('final answer is');
        console.log(answer);
      });

      root.resolve();
      console.log('--end function--');
      //--------------------------------------------------------------

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
      function api() {
        var param = data.shift();
        if( param==undefined ){
            return null;
        }
        console.log('ca parameter is [%s]', param);
        var d = $.Deferred();

        $.ajax({
            url: 'https://res.cloudinary.com/kanaxx/raw/upload/v1532448755/static/sample.json',
            type: "GET",
            dataType: "json",
            data: "param=" + encodeURI(param),
        }).done(function (response, textStatus, jqXHR) {
            console.log('done API [%s]', param);
            answer.push(param.toUpperCase());
            d.resolve();
        }).fail(function (jqXHR, textStatus, errorThrown) {
          console.log(errorThrown);
          console.log('fail API [%s]', param);
          d.resolve();
        });
        return d.promise();
    }
    }
  ))
  
