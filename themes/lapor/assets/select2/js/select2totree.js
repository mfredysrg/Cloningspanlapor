	/*!
 * Select2-to-Tree 1.1.1
 * https://github.com/clivezhg/select2-to-tree
 */
var count_data = 0;
(function ($) {
	$.fn.select2ToTree = function (options) {
		var opts = $.extend({matcher:matchStart}, options);
		var idSelect = (opts.idSelect) ? opts.idSelect : "select_categories";
		if (opts.treeData) {
			buildSelect(opts.treeData, this);
		}
		opts._templateResult = opts.templateResult;
		opts.templateResult = function (data, container) {
			var label = data.text;
			if (typeof opts._templateResult === "function") {
				label = opts._templateResult(data, container);
			}
			var $iteme = $("<span class='item-label'></span>").append(label);
			if (data.element) {
				var ele = data.element;
				container.setAttribute("data-val", ele.value);
				if (ele.className) container.className += " " + ele.className;
				if (ele.getAttribute("data-pup")) {
					container.setAttribute("data-pup", ele.getAttribute("data-pup"));
				}
				if ($(container).hasClass("non-leaf")) {
					if((ele.value).includes("autoUniqueVal")){
						$($iteme).attr("onmouseup",'expColMouseupHandler(event);');
					}
					return $.merge($('<span class="expand-collapse" onmouseup="expColMouseupHandler(event);"></span>'), $iteme);
				}
			}
			return $iteme;
		};

		window.expColMouseupHandler = function (evt) {
			toggleSubOptions(evt.target || evt.srcElement);
			/* prevent Select2 from doing "select2:selecting","select2:unselecting","select2:closing" */
			evt.stopPropagation ? evt.stopPropagation() : evt.cancelBubble = true;
			evt.preventDefault ? evt.preventDefault() : evt.returnValue = false;
		}

		var s2inst = this.select2(opts);

		s2inst.on("select2:open", function (evt) {
			var s2data = s2inst.data("select2");
			s2data.$dropdown.addClass("s2-to-tree");
			s2data.$dropdown.removeClass("searching-result");
			var $allsch = s2data.$dropdown.find(".select2-search__field").add( s2data.$container.find(".select2-search__field") );
			$allsch.off("input", inputHandler);
			$allsch.on("input", inputHandler);
		});

		/* Show search result options even if they are collapsed */
		function inputHandler(evt) {
			var s2data = s2inst.data("select2");
			if ($(this).val().trim().length > 0) {
				s2data.$dropdown.addClass("searching-result");
			}
			else {
				s2data.$dropdown.removeClass("searching-result");
			}
		}
		function remove_duplicate_group(){
			list_group = [];
			$('#select2-'+idSelect+'-results > .select2-results__option').each(function( index ) {
				name = ($(this).attr("aria-label"));
				if(!list_group.includes(name)){
					$(this).find('[value="undefined"]').parent().parent().addClass("notHover");
					list_group.push(name);
				} else {
					$(this).find(".select2-results__group").remove();
				}
				$(this).find(".non-leaf").removeClass('non-leaf');

			});
		}

		$(document).on("click",".label-value",function(){ 
			$('#'+idSelect).val($(this).attr('value')); 
			$('#'+idSelect).change();
		});

		function find_array(id){
			var data_array = new Array();
			$.each(opts.treeData.dataArr, function(index, value0){
				if(value0.key == id){
					// data_array.push(value0);
				} else {
					$.each(value0['inc'], function(index, value1){
						if(value1.key == id){
							value0.alias = "<span class='label-value' value=" + value0.id + ">"+value0.text+"</span>";
							data_array.push(value0);
						} else {
							$.each(value1['inc'], function(index, value2){
								if(value2.key == id){
									value1.alias = "<span class='label-value' value=" + value1.id + ">"+value0.text+" > \
									"+value1.text+"</span>";
									data_array.push(value1);
								} else {
									$.each(value2['inc'], function(index, value3){
										if(value3.key == id ){
											value2.alias = "<span class='label-value' value=" + value2.id + ">"+value0.text+" > \
											"+value1.text+" > \
											"+value2.text+"</span>";
											data_array.push(value2);
										} else {
											$.each(value3['inc'], function(index, value4){
												if(value4.key == id ){
													value3.alias = "<span class='label-value' value=" + value3.id + ">"+value0.text+" > \
													"+value1.text+" > \
													"+value2.text+" > \
													"+value3.text+"</span>";
													data_array.push(value3);
												}
												//  else {
												//     $.each(value4['inc'], function(index, value5){
												//         if(value5.key == id){
												//             data_array.push(value5);
												//         }
												//     });
												// }
											});
										}
									});
								}
							});
						}
					});
				}
			});
			return data_array[0];
		}
		function matchStart(params, data) {
			var total_select = $('#'+idSelect+' option').length;
			count_data++;
			if(total_select==count_data){
				setTimeout(function(){ remove_duplicate_group(), 100});
				count_data = 0;
			}
			// If there are no search terms, return all of the data
			if ($.trim(params.term) === '') {
				return data;
			}
	
			var filteredChildren = [];
			if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) >= 0) {
				filteredChildren.push(data);
			}
	
			if (filteredChildren.length) {
				check_key = find_array(data.id);
				if(check_key){
					data = {
						"text" : check_key.alias,
						"key" : check_key.id,
						"id" : check_key.id
					};
					var modifiedData = $.extend({}, data, true);
					modifiedData.children = filteredChildren;
				} else {
					var modifiedData = $.extend({}, data, true);
				}
				return modifiedData;
			}
			return null;
		}

		return s2inst;
	};

 	/* Build the Select Option elements */
	function buildSelect(treeData, $el) {

		/* Support the object path (eg: `item.label`) for 'valFld' & 'labelFld' */
		function readPath(object, path) {
			var currentPosition = object;
			for (var j = 0; j < path.length; j++) {
				var currentPath = path[j];
				if (currentPosition[currentPath]) {
					currentPosition = currentPosition[currentPath];
					continue;
				}
				return 'MISSING';
			}
			return currentPosition;
		}

		function buildOptions(dataArr, curLevel, pup) {
			var labelPath;
			if (treeData.labelFld && treeData.labelFld.split('.').length> 1){
				labelPath = treeData.labelFld.split('.');
			}
			var idPath;
			if (treeData.valFld && treeData.valFld.split('.').length > 1) {
				idPath = treeData.valFld.split('.');
			}

			for (var i = 0; i < dataArr.length; i++) {
				var data = dataArr[i] || {};
				var $opt = $("<option></option>");
				if (labelPath) {
					$opt.text(readPath(data, labelPath));
				} else {
					$opt.text(data[treeData.labelFld || "text"]);
				}
				if (idPath) {
					$opt.val(readPath(data, idPath));
				} else {
					$opt.val(data[treeData.valFld || "id"]);
				}
				if (data[treeData.selFld || "selected"] && String(data[treeData.selFld || "selected"]) === "true") {
					$opt.prop("selected", data[treeData.selFld || "selected"]);
				}
				if($opt.val() === "") {
					$opt.prop("disabled", true);
					$opt.val(getUniqueValue());
				}
				$opt.addClass("l" + curLevel);
				if (pup) $opt.attr("data-pup", pup);
				$el.append($opt);
				var inc = data[treeData.incFld || "inc"];
				if (inc && inc.length > 0) {
					$opt.addClass("non-leaf");
					buildOptions(inc, curLevel+1, $opt.val());
				}
			} // end 'for'
		} // end 'buildOptions'

		buildOptions(treeData.dataArr, 1, "");
		if (treeData.dftVal) $el.val(treeData.dftVal);
	}

	var uniqueIdx = 1;
	function getUniqueValue() {
		return "autoUniqueVal_" + uniqueIdx++;
	}

	function toggleSubOptions(target) {
		$(target.parentNode).toggleClass("opened");
		showHideSub(target.parentNode);
	}

	function showHideSub(ele) {
		var curEle = ele;
		var $options = $(ele).parent(".select2-results__options");
		var shouldShow = true;
		do {
			var pup = ($(curEle).attr("data-pup") || "").replace(/'/g, "\\'");
			curEle = null;
			if (pup) {
				var pupEle = $options.find(".select2-results__option[data-val='" + pup + "']");
				if (pupEle.length > 0) {
					if (!pupEle.eq(0).hasClass("opened")) { // hide current node if any parent node is collapsed
						$(ele).removeClass("showme");
						shouldShow = false;
						break;
					}
					curEle = pupEle[0];
				}
			}
		} while (curEle);
		if (shouldShow) $(ele).addClass("showme");

		var val = ($(ele).attr("data-val") || "").replace(/'/g, "\\'");
		$options.find(".select2-results__option[data-pup='" + val + "']").each(function () {
			showHideSub(this);
		});
	}
})(jQuery);

$('.select2-search__field').attr("placeholder", "Cari");

function generate_select2_checkbox(id_name){
	$($('#'+id_name).data('select2').$container).addClass(id_name);
	$('#'+id_name).on('select2:opening', function (e) {
		$('.'+id_name+' .select2-selection__rendered .counter-select .title').addClass("invisible");
	});
	$('#'+id_name).on('select2:close', function (e) {
		$('.'+id_name+' .select2-selection__rendered .counter-select .title').removeClass("visible");
	});
	$('#'+id_name).on('select2:select', function (e) {
		var data_val = [];
		// console.log('#select2-'+id_name+'-results [data-pup="'+e.params.data.id+'"]');
		$( '#'+id_name+' [data-pup="'+e.params.data.id+'"]' ).each(function( index ) {
			if($( this ).val()){
				data_val.push( $( this ).val() );
				$("[data-val='"+$(this).val()+"']").attr("role","treeitem").attr("aria-selected", "true");
				$( '#'+id_name+' [data-pup="'+$( this ).val() +'"]' ).each(function( index ) {
					if($( this ).val()){
						$("[data-val='"+$(this).val()+"']").attr("role","treeitem").attr("aria-selected", "true");
						data_val.push( $( this ).val() );
						$( '#'+id_name+' [data-pup="'+$( this ).val() +'"]' ).each(function( index ) {
							if($( this ).val()){
								data_val.push( $( this ).val() );
								$("[data-val='"+$(this).val()+"']").attr("role","treeitem").attr("aria-selected", "true");
								$( '#'+id_name+' [data-pup="'+$( this ).val() +'"]' ).each(function( index ) {
									if($( this ).val()){
										data_val.push( $( this ).val() );
										$("[data-val='"+$(this).val()+"']").attr("role","treeitem").attr("aria-selected", "true");
									}
								});
							}
						});
					}
				});
			}
		});
		// console.log(data_val);
		$("#"+id_name).val(($('#'+id_name).val()+ (($('#'+id_name).val() && data_val.length > 0) ? ",": "")+data_val.join(',')).split(','));
		add_counter(id_name);
		// $("[data-pup='"+e.params.data.id+"']").trigger('mouseup');
		// $("[data-pup='"+e.params.data.id+"'] > span").first().trigger('mouseup');
	});
	$('#'+id_name).on('select2:unselect', function (e) {
		var data_val = [];
		var current_val = $("#"+id_name).val();
		// console.log("[data-pup='"+e.params.data.id+"']");
		$( '#'+id_name+' [data-pup="'+e.params.data.id+'"]' ).each(function( index ) {
			data_value = $( this ).val();
			if(data_value){
				current_val = jQuery.grep(current_val, function(value) {
					return value != data_value;
				});
				$("[data-val='"+$(this).val()+"']").attr("role","").attr("aria-selected", "false");
				$( '#'+id_name+' [data-pup="'+data_value+'"]' ).each(function( index ) {
					data_value = $( this ).val();
					if(data_value){
						current_val = jQuery.grep(current_val, function(value) {
							return value != data_value;
						});
						$("[data-val='"+$(this).val()+"']").attr("role","").attr("aria-selected", "false");
						$( '#'+id_name+' [data-pup="'+data_value+'"]' ).each(function( index ) {
							data_value = $( this ).val();
							if(data_value){
								current_val = jQuery.grep(current_val, function(value) {
									return value != data_value;
								});
								$("[data-val='"+$(this).val()+"']").attr("role","").attr("aria-selected", "false");
								$( '#'+id_name+' [data-pup="'+data_value+'"]' ).each(function( index ) {
									data_value = $( this ).val();
									if(data_value){
										current_val = jQuery.grep(current_val, function(value) {
											return value != data_value;
										});
										$("[data-val='"+$(this).val()+"']").attr("role","").attr("aria-selected", "false");
									}
								});
							}
						});
					}
				});
			}
		});
		$("#"+id_name).val(current_val);
		add_counter(id_name);
		$('.select_cities .select2-search__field').attr("placeholder","");
		// $("[data-pup='"+e.params.data.id+"']").trigger('mouseup');
		// $("[data-pup='"+e.params.data.id+"'] > span").trigger('mouseup');
	});
	$('#'+id_name).on('change.select2', function (evt) {
		add_counter(id_name);
	});
	$('#'+id_name).on('select2:close', function (evt) {
		add_counter(id_name);
	});

	function add_counter(id_name){
		var count = $('#'+id_name).val().length;
		$('.'+id_name+' .select2-selection__choice').remove();
		$('.'+id_name+' .select2-selection__rendered .counter-select').remove();
		$('.'+id_name+' .select2-selection__rendered').append("<li class='counter-select'><span class='title'>"+$('#'+id_name).attr("data-title") + "</span><span class='counter'>"+count+"</span></li>");
	}
}
