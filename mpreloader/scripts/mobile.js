(function($) {
 /* Global functions and declarations */


 /* Backbone code */
 
 var Headline = Backbone.Model.extend({
	defaults: function() {
		return {
			storageName: '',
			contenttype: '',
			title: '',
			link: ''
		}
	}
 });
 
 
 var Article = Backbone.Model.extend({
	
	initialize: function() {
	},
	
	construct: function() {
		var article = JSON.parse(this.get('articleData'));
		this.set('headline', article['items'][0].title); 
		if (typeof article['items'][0].images != 'undefined' && article['items'][0].images.length > 2) {
			this.set('imgurl', article['items'][0].images[1].url); 
		}
		var content = article['items'][0].content;
		var str = "";
		for (var i = 0; i < content.length; i++) {
			str += "<p>" + content[i].value + "</p>";
		}		
		this.set('text', str); 
	},
	defaults: function() {
		return {
			articleData: '',
			headline: '',
			text: '',
			imgurl: ''
		}
	}
 });

 var Settings = Backbone.Model.extend({
	defaults: function() {
		return {
			sections: ['homepage', 'news', 'technology', 'pf', 'smbusiness', 'fortune', 'moneymag', 'economy', 'markets'] 
		}
	}
 });
 var settings = new Settings();
 
 var Headlines = Backbone.Collection.extend({
	model: Headline,
		
 });
 
 var Section = Backbone.Model.extend({
	model: Headlines,

	loadStorage: function() {
		var key = this.get('storageName');
		self = this;
		console.log(this.get('url'));
		$.ajax({
		  url: this.get('url'),
		}).done(function ( data ) {	
			//console.log(data);
			//var jsonObj = JSON.parse(data);
			//self._storeHeadlines(key, jsonObj);
			//var jsonObj = JSON.parse(data);
			self._storeHeadlines(key, data);			
			
		});
		
	},
	
	_storeHeadlines: function (storageName,jsonObj) {
		var storageHead = storageName + "-headlines";
		var storageArticles = storageName + "-articles";
		localStorage.removeItem(storageHead);
		localStorage.removeItem(storageArticles);		
		var headJson = []; //declare array
		var storyJson = "{";
		var itemsAr = jsonObj.items;
		for (var i = 0; i < itemsAr.length; i++) {
			if (itemsAr[i].contentType != "video") {
				var url = itemsAr[i].link;
				if (typeof url == 'undefined') {
					url = itemsAr[i].url;
				}
				if (typeof url == 'undefined') {
					continue;
				}
				headJson.push({storageName: storageName, contenttype: itemsAr[i].contenttype, title: itemsAr[i].title, link: url});
				var link = url;
				storyJson += '"'+link+'" :' + JSON.stringify(this._getArticleJson(link)) + ",";
			}
		}
		storyJson = storyJson.substring(0,storyJson.length-1);
		storyJson += "}";
		console.log(storyJson);
		localStorage.setItem(storageHead, JSON.stringify(headJson));
		localStorage.setItem(storageArticles, storyJson);
	},
	
	_getArticleJson: function (url) {
		console.log(url);
		var returnData;
		if (typeof url == 'undefined') return;
		var _url = url.replace("http://money.cnn.com","");
		$.ajax({
		  url: _url,
		  async: false,
		}).done(function ( data ) {	
			//returnData = JSON.parse(data);	
			returnData = data;			
		});	
		return returnData;
	},
	
	addHeadlines: function() {
		var key = this.get('storageName') + "-headlines";
		var keyString = localStorage.getItem(key);
		var jsonObj = null;
		if (keyString != "") {
			jsonObj =  JSON.parse(keyString);
		}
		if (jsonObj != null) {
			for (var i = 0; i < jsonObj.length; i++) {
				var model = this.get('model');
				model.add(new Headline(jsonObj[i]));
			}
		}
	},
	
	defaults: function() {
		return {
			url: '',
			storageName: '',
			ul: ''
		}
	}
	
 });
 
 
  var Sections = Backbone.Collection.extend({
	model: Section,
	
	initializeSections : function(sectionAr) {
		
		for (var i=0;i < sectionAr.length; i++) {
			var _url = "/mobile/json/" + sectionAr[i] + ".json";
			var _storageName = sectionAr[i];
			var _ul = "#" + sectionAr[i] + "-container";
			
			var section = new Section({model: new Headlines(), url: _url, storageName: _storageName, ul: _ul});
			sections.add(section);
			//section.loadStorage();
			section.addHeadlines();
		}
	},

	clearStorage: function() {
		console.log("in clear storage");
		var sections = this.models;
		_.each(sections, function(section ,i) {
			var sectionName = section.get('storageName');
			var storageHead = sectionName + "-headlines";
			var storageArticles = sectionName + "-articles";
			console.log(sectionName);			
			localStorage.setItem(storageHead, "");
			localStorage.setItem(storageArticles, "");
		});	
	},	
	
	loadStorage: function() {
		var sections = this.models;
		var settingsObj = JSON.parse(localStorage.getItem("settings-preload"));
		console.log(this);
		_.each(sections, function(sectionObj ,i) {	
			if (settingsObj["sections"][sectionObj.get('storageName')] == "checked") {
				sectionObj.loadStorage();
			} 
		});		
	
	},
	
	defaults: function() {
		return {
			sections: ['homepage', 'news', 'technology', 'pf', 'smbusiness', 'fortune', 'moneymag', 'economy', 'markets'] 
		}
	}
 });

 
 var HeadlineView = Backbone.View.extend({
	model: new Headline(),
	tagName: 'li',
	events: {
		'click' : 'showArticle'
	},
	initialize: function() {
		this.template = _.template($('#headline-tmpl').html());
	},
	showArticle: function(ev) {
		ev.preventDefault();
		var key = this.model.get('storageName') + "-articles";
		var sectionArticles = JSON.parse(localStorage.getItem(key));
		var link = this.model.get('link');
		var _articleData = JSON.stringify(sectionArticles[link]);
		var story = new Article({articleData: _articleData});
		story.construct();
		var articleView = new ArticleView({model: story, el: $('#page')});	
		articleView.render();	
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
 });
 
  var ArticleView = Backbone.View.extend({
	model: new Article(),
	el: null,
	events: {
		'click .back' : 'showSections'
	},
	initialize: function() {
		this.template = _.template($('#article-tmpl').html());
	},
	showSections: function(ev) {
		ev.preventDefault();			
		sectionsView.render();	
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
 });
 
 var SectionView = Backbone.View.extend({
	model: new Headlines(),
	el: null,
	initialize : function() {
		this.model.on('add',this.render,this);
	},
	render: function() {
		var self = this;
		self.$el.html('');
		_.each(this.model.models, function(headline ,i) {
			self.$el.append((new HeadlineView({ model: headline })).render().$el);
		});
		return this;
	}
 });
 var sections = new Sections();
 
 var SectionsView = Backbone.View.extend({
	model: sections,
	el: null,
	events: {
		'click .settings' : 'showSettings'		
	},
	initialize: function() {
		this.template = _.template($('#sections-tmpl').html());
	},
	showSettings: function(ev) {
		ev.preventDefault();
		settingsView.render();	
		var sections = settingsView.model.get('sections');
		var settingsObj = JSON.parse(localStorage.getItem("settings-preload"));
		if (settingsObj["time"] == '') {
			$('#time').val('07:00:00');
		} else {
			$('#time').val(settingsObj["time"]);
		}
		_.each(sections, function(section ,i) {	
			if (settingsObj["sections"][section] == "checked") {
				$('#'+section).attr('checked', true);
			} 
		});				

	},	
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		var self = this;
		_.each(this.model.models, function(section ,i) {			
			var ul_id = section.get('ul');
			var view = new SectionView({model: section.get('model'), el: $(ul_id)});
			view.render();
		});
		return this;
	}
 });
var sectionsView = new SectionsView({el: $('#page')});
 
var SettingsView = Backbone.View.extend({
	model: settings,
	el: null,
	events: {
		'click .back' : 'showSections',
		'click #submit-preload' : 'storeSettings'
	},
	initialize: function() {
		this.template = _.template($('#settings-tmpl').html());
	},
	showSections: function(ev) {
		ev.preventDefault();	
		sectionsView.render();	
	},
	storeSettings: function(ev) {
		ev.preventDefault();
		var sectionNames = this.model.get('sections');
		console.log(sections);
		var settingsObj = { "time": '', "sections": {} };
		settingsObj["time"] = $('#time').val();
		_.each(sectionNames, function(section ,i) {			
			if($('#'+section).attr('checked')) {
				settingsObj["sections"][section] = "checked";
			} else {
				settingsObj["sections"][section] = "";
			}
		});	
		localStorage.setItem("settings-preload",JSON.stringify(settingsObj));
		sections.clearStorage();
		sections.loadStorage();
	},	
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
 });
var settingsView = new SettingsView({el: $('#page')});	

  var AppView = Backbone.View.extend({
    initialize: function() {
	
		var sectionAr = ['homepage', 'news', 'technology', 'pf', 'smbusiness', 'fortune', 'moneymag', 'economy', 'markets'];
		sections.initializeSections(sectionAr);		
		//sections.clearStorage();
		sectionsView.render();
    }
  
  
  });

 
 $(document).ready(function() {


    var App = new AppView; 
		
 });
 
 


})(jQuery)