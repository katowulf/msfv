
(function($) {

   $.msfvConf = {
      maxWords: 10,
      allowedTags: '<i><em><b><strong><blockquote><p><br><div><ul><li><ol>'
   };

   /*********************************************************
    * View Controllers
    *********************************************************/

   function ViewController(maxWords) {
      var self = this;
      self.maxWords = maxWords;
      self.title = ko.observable('My Opus');
      self.genre = ko.observable('Fiction');
      self.opus = ko.observable();
      self.formattedOpus = ko.computed(function() {
         return formatOpus(self.opus());
      });
      self.wordCount = ko.computed(function() {
         return wordCount(self.opus());
      });
   }

   /*********************************************************
    * Custom Bindings
    *********************************************************/
   ko.bindingHandlers.greenOrRed = {
      update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
         var words = ko.utils.unwrapObservable(valueAccessor()), max = allBindingsAccessor().maxWords;
         var c = words <= max? 'good' : 'bad';
         $(element).html('<span class="'+c+'">'+words+' words (max '+max+')</span>');
      }
   };

   /*********************************************************
    * Document Ready
    *********************************************************/
   jQuery(function($) {

      var vc = new ViewController($.msfvConf.maxWords);
      ko.applyBindings(vc);

//      $('#opus').bind('keystrokes', {keys: ['ctrl+v']}, function(e) {
//         var $this = $(this), val = $this.val();
//         console.log('paste detected');
//         if( val.match('MsoNormal') ) {
//            console.log('has msoNormal');
//            $this.val( pasteFromWord(val) );
//         }
//      });

      CKEDITOR.on('instanceReady', function(ev) {
         console.info('instanceReady called', ev.document);
         ev.editor.on('paste', function(evt) {
            evt.data['html'] = cleanup_paste(strip_tags(evt.data['html'], $.msfvConf.allowedTags));
         });
      });

      function _disableElms(keys) {
         var f = function() { return false}, i = keys.length, out = {};
         while(i--) {
            out[ keys[i] ] = f;
         }
         return out;
      }

      $('#editor').ckeditor(function() {
           var self = this;
            this.document.on("keyup", function(e) {CK_jQ(e,self,vc)});
            this.document.on("paste", function(e) {CK_jQ(e,self,vc)});
         },
         {
//            toolbar: [
//               {name: 'document', items : ['Bold', 'Italic', '-', 'PasteFromWord', '-', 'NumberedList', 'BulletedList', '-', 'Source' ]}
//            ]
            toolbar: [
               {name: 'document', items : ['Bold', 'Italic', 'Underline', 'Strike']}
               , {name: 'pasties', items: ['PasteFromWord']}
               , {name: 'listies', items: ['NumberedList', 'BulletedList', 'Outdent', 'Indent']}
               , {name: 'sourcies', items: ['Source']}
            ]
//            , indentClasses: ['blockquote']
            , removePlugins: 'elementspath,save,font,bbcode,find,flash,image,link,scayt,smiley,specialchar,styles,stylesheetparser,table,tableresize,tabletools'
            , pasteFromWordRemoveFontStyles: true
            , pasteFromWordRemoveStyles: true
            , startupFocus: true //debug
            , toolbarCanCollapse: false
            , removeFormatTags: 'style,big,code,del,dfn,font,table,tr,tbody,thead,td,kbd,'
         }
      );

   });

   /*********************************************************
    * Utilities
    *********************************************************/

   function cleanup_paste(input) {
      return $.trim(input)
         // replace all the zany &nbsp; tags from word
         .replace('&nbsp;', ' ')
         // replace any indentation marks with the default
         .replace(/<p( [^>]+)?style=['"]margin-left:[^';"]+;['"]>(.+)<\/p>/ig, '<p style="margin-left: 40px;">$1</p>')
         // input should not begin with empty <p> tags
         .replace(/^<[pP]( [^>]+)?>[ \n\r\t\f\227\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]*<\/[pP]>/g, '')
         .replace(/<[pP]( [^>]+)?>[ \n\r\t\f\227\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]*<\/[pP]>$/g, '')
         ;
   }

   function strip_tags (input, allowed) {
      // http://phpjs.org/functions/strip_tags:535 (http://kevin.vanzonneveld.net)
      allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
      var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
         commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
      return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
         return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
      });
   }

   function wordCount(str) {
      var words = 0;
      str = strip_tags($.trim(str||'').replace(/<\/?(div|br|p)[^>]*>/g, ' '));
      var i, arr = str
         .replace('&nbsp;', ' ')
         .replace('&#8212;', ' ')
         .replace('--', ' ')
         .replace(/&#?[0-9a-zA-Z]+;/g, '')
         .replace(/([a-zA-Z0-9])['-][a-zA-Z0-9]/g, "$1")
         .replace(/[ \n\r\t\f\227\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]+/gm, ' ')
         .replace(/[^a-zA-Z0-9 ]/g, '')
         .split(' '), len = arr.length;   //, htmlspecialchars_decode(str)));
      for(i=0; i < len; i++) {
         if( arr[i].match(/[0-9A-Za-z]/) ) { words++; }
      }
      return words;
   }

//   function pasteFromWord(html) {
//      // start by completely removing all unwanted tags
//      return html
//         .replace(/<[\/]?(font|span|xml|del|ins|[ovwxp]:\w+)[^>]*?>/i, '')
//                  // then run another pass over the html (twice), removing unwanted attributes
//         .replace(/<([^>]*)(?:class|lang|style|size|face|[ovwxp]:\w+)=(?:'[^']*'|""[^""]*""|[^\s>]+)([^>]*)>/i, "<$1$2>")
//         .replace(/<([^>]*)(?:class|lang|style|size|face|[ovwxp]:\w+)=(?:'[^']*'|""[^""]*""|[^\s>]+)([^>]*)>/i, "<$1$2>");
//   }

   function formatOpus(str) {
      console.log($.trim(str));
      return strip_tags($.trim(str), $.msfvConf.allowedTags)
         .replace(/<p[^>]+style=['"]margin-left: 40px;['"]>(.+)<\/p>/, '<blockquote>$1</blockquote>')
//         .replace(/[*]([^*]+)[*]/g, "<b>$1</b>")
//         .replace(/_([^_]+)_/g, "<u>$1</u>")
//         .replace(/\/([^\/]+)\//g, "<i>$1</i>")
//         .replace(/\n/g, "<br />\n")
         ;
   }

   function CK_jQ(e, inst, viewController) {
      setTimeout(function(){
         inst.updateElement();
         viewController.opus(inst.getData());
      }, 100);
   }

})(jQuery);
