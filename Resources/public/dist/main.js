require.config({paths:{suluarticle:"../../suluarticle/dist",suluarticlecss:"../../suluarticle/css"}}),define(["underscore","config"],function(a,b){"use strict";var c=function(){var c=b.get("sulu-content").locales,d=[];return a.each(c,function(a){d=d.concat(Object.keys(a))}),d};return{name:"Sulu Article Bundle",initialize:function(d){d.components.addSource("suluarticle","/bundles/suluarticle/dist/components"),d.sandbox.urlManager.setUrl("article","articles/<%= locale %>/edit:<%= id %>/details");var e=c(),f={defaultLocale:e[0],locales:e,languageChanger:a.map(e,function(a){return{id:a,title:a}}),settingsKey:"articleLanguage",typeNames:Object.keys(b.get("sulu_article").types),types:b.get("sulu_article").types,displayTabAll:b.get("sulu_article").displayTabAll};b.set("sulu_article",f);var g=function(){return d.sandbox.sulu.getUserSetting(f.settingsKey)||f.defaultLocale};d.sandbox.mvc.routes.push({route:"articles",callback:function(){return d.sandbox.emit("sulu.router.navigate","articles/"+g())}}),1===f.typeNames.length?(d.sandbox.mvc.routes.push({route:"articles/:locale",callback:function(a){return'<div data-aura-component="articles/list@suluarticle" data-aura-type="'+f.typeNames[0]+'" data-aura-locale="'+a+"\" data-aura-config='"+JSON.stringify(f)+"'/>"}}),d.sandbox.mvc.routes.push({route:"articles/:locale/add",callback:function(a,b){return'<div data-aura-component="articles/edit@suluarticle" data-aura-type="'+f.typeNames[0]+'" data-aura-locale="'+a+"\" data-aura-config='"+JSON.stringify(f)+"'/>"}})):(f.displayTabAll||d.sandbox.mvc.routes.push({route:"articles(/:locale)",callback:function(){return d.sandbox.emit("sulu.router.navigate","articles:"+f.typeNames[0]+"/"+g())}}),f.displayTabAll===!0&&d.sandbox.mvc.routes.push({route:"articles/:locale",callback:function(a){return'<div data-aura-component="articles/list@suluarticle" data-aura-locale="'+a+"\" data-aura-config='"+JSON.stringify(f)+"'/>"}}),d.sandbox.mvc.routes.push({route:"articles::type",callback:function(a){return d.sandbox.emit("sulu.router.navigate","articles:"+a+"/"+g())}}),d.sandbox.mvc.routes.push({route:"articles::type/:locale",callback:function(a,b){return'<div data-aura-component="articles/list@suluarticle" data-aura-locale="'+b+"\" data-aura-config='"+JSON.stringify(f)+"' data-aura-type=\""+a+'"/>'}}),d.sandbox.mvc.routes.push({route:"articles/:locale/add::type",callback:function(a,b){return'<div data-aura-component="articles/edit@suluarticle" data-aura-locale="'+a+"\" data-aura-config='"+JSON.stringify(f)+"' data-aura-type=\""+b+'"/>'}})),d.sandbox.mvc.routes.push({route:"articles/:locale/edit::id/:content",callback:function(a,b){return'<div data-aura-component="articles/edit@suluarticle" data-aura-locale="'+a+'" data-aura-id="'+b+"\" data-aura-config='"+JSON.stringify(f)+"'/>"}})}}});