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

      //一番最初のDeferred。引き止め役
      var root = $.Deferred();
      var deferred = root.then(function(){return wait(3)});

      for( i = 0; i < data.length ; i++){
        deferred = deferred
        .then( 
          function(counter){ 
            return function(){ 
              return $.when( api(data[counter]), wait(interval) );}}(i)
        )
        .done(function(a,b){
          //apiとwaitが終わったら答えが受け取れる部分
          console.log('return value is %s,%s',a,b);
          answer.push(a);
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
  
