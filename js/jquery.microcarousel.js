;(function($) {
	$.fn.microcarousel = function(options) {
		var settings = $.extend({
			timer_latency : 40
		}, options);
		
		return this.each(function() {        
			var timer, $wrapper = $(this);				
			
			$wrapper.children().addClass("slide");
			
			timer = setTimeout(switch_slide, $wrapper.find(".slide:eq(0)").text().length * settings.timer_latency);
			
			function switch_slide() {
				$wrapper.find(".slide:eq(0)").animate({"margin-top" : -$wrapper.height()}, function () {
					$(this).css({"margin-top": 0}).appendTo($wrapper);
					clearTimeout(timer);
					timer = setTimeout(switch_slide, $(this).text().length * settings.timer_latency);
				});
			}
	    });
	};
})(jQuery);